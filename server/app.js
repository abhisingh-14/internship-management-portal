/**
 * app.js
 *
 * Configures and exports the Express application instance. Kept
 * separate from server.js (the HTTP/port bootstrap) so the app can be
 * imported and tested (e.g. with Supertest) without binding a real
 * port, per docs/05_Coding_Standards.md §14.
 *
 * Middleware order is deliberate and matches
 * docs/05_Coding_Standards.md §14:
 *   CORS -> body parsing -> routes -> 404 handler -> centralized error handler.
 *
 * No authentication, authorization, or business-logic middleware is
 * wired in here; this component excludes both by design.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');

const env = require('./config/env');
const logger = require('./utils/logger');
const { sendSuccess } = require('./utils/apiResponse');
const apiRouter = require('./routes/index');
const fileRoutes = require('./routes/file.routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// CORS is restricted to the configured client origin — never a wildcard,
// per docs/05_Coding_Standards.md §14 and §20.
app.use(cors({ origin: env.clientOrigin }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Temporary diagnostic endpoint for verifying server and database
 * connectivity during setup. Not part of the versioned /api/v1 contract
 * in docs/03_API_Design.md; flagged for review before production
 * deployment (see 01_Project_Setup.md Notes).
 */
const { pool } = require('./config/db');
app.get('/health', async (req, res) => {
  try {
    // Perform a simple query to verify database connectivity without exposing data
    await pool.execute('SELECT 1');
    sendSuccess(res, { 
      message: 'Server is healthy', 
      data: { 
        status: 'UP', 
        database: 'connected' 
      } 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, stack: error.stack });
  }
});



// New in Component 08: uploaded resumes/logos are served through this
// controlled router rather than an open express.static("/uploads") mount,
// so access to resumes can be gated by authentication + ownership rules
// (see server/controllers/file.controller.js and
// docs/04_Project_Architecture.md §10). Mounted outside the /api/v1 prefix
// so stored URLs match the exact "/uploads/resumes/..." /
// "/uploads/logos/..." shape already documented in docs/03_API_Design.md.
app.use('/uploads', fileRoutes);

app.use('/api/v1', apiRouter);

// Serve React SPA in production
if (env.isProduction) {
  const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientBuildPath));
  
  // Fallback to index.html for all non-API/non-upload client routes
  app.get(/^(?!\/(api|uploads|health)).*$/, (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
  logger.info('Production static file serving initialized.');
}

app.use(notFoundHandler);
app.use(errorHandler);

logger.info(`Express app configured for ${env.nodeEnv} environment.`);

module.exports = app;

