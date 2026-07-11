/**
 * logger.js
 *
 * Single, consistent logging utility for the entire backend, per
 * docs/05_Coding_Standards.md §11:
 *   - No direct `console.log` calls in committed application code.
 *   - Logs are categorized by level: error, warn, info, debug.
 *   - Verbose/debug logging is enabled in development only; production
 *     runs at `info` level and above by default, configurable via an
 *     environment variable (`LOG_LEVEL`).
 *   - Production logs are structured (JSON) for ingestion by log
 *     aggregation tooling; development logs are human-readable.
 *
 * Every other module (controllers, models, middleware, app.js,
 * server.js) imports this single logger rather than creating its own.
 */

const winston = require('winston');

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

const isProduction = process.env.NODE_ENV === 'production';

const developmentFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return stack
      ? `[${ts}] ${level}: ${message}${metaString}\n${stack}`
      : `[${ts}] ${level}: ${message}${metaString}`;
  })
);

const productionFormat = combine(timestamp(), errors({ stack: true }), json());

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: isProduction ? productionFormat : developmentFormat,
  transports: [new winston.transports.Console()],
  exitOnError: false,
});

module.exports = logger;
