/**
 * MySQL connection pool.
 *
 * A single pool is created at startup and reused across all requests, per
 * docs/04_Project_Architecture.md §9. All model-layer database access must
 * acquire connections from this pool rather than creating new connections.
 */

const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: env.db.connectionLimit || 10,
  queueLimit: 0,
});

/**
 * Verifies the database connection is reachable. Intended to be called
 * once during server startup so connection issues fail fast and loudly
 * rather than surfacing on the first incoming request.
 */
async function testConnection() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}

module.exports = { pool, testConnection };