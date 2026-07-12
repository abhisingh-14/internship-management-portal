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

async function initializeDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        actor_id INT UNSIGNED NOT NULL,
        action VARCHAR(100) NOT NULL,
        target_id VARCHAR(100) NOT NULL,
        details TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_admin_audit_logs_actor
          FOREIGN KEY (actor_id) REFERENCES users (id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        INDEX idx_admin_audit_logs_actor (actor_id),
        INDEX idx_admin_audit_logs_action (action),
        INDEX idx_admin_audit_logs_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Audit log for administrative actions';
    `);
  } finally {
    connection.release();
  }
}

module.exports = { pool, testConnection, initializeDatabase };