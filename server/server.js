/**
 * server.js
 *
 * HTTP server bootstrap. Verifies the MySQL connection before binding a
 * port so the process fails fast (and loudly) if the database is
 * unreachable at startup, rather than accepting traffic against a
 * broken connection pool.
 *
 * Kept separate from app.js so the Express app instance itself remains
 * importable/testable without a bound port.
 */

const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { testConnection } = require('./config/db');

async function startServer() {
  try {
    await testConnection();
    logger.info('Database connection established.');

    app.listen(env.port, () => {
      logger.info(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server due to a database connectivity error.', {
      message: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

startServer();
