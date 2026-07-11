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

const env = require('./config/env');
const { sendSuccess } = require('./utils/apiResponse');
const apiRouter = require('./routes/index');
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
app.get('/health', (req, res) => {
  sendSuccess(res, { message: 'Server is healthy' });
});

app.use('/api/v1', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
