/**
 * MySQL connection pool.
 *
 * A single pool is created at startup and reused across all requests, per
 * docs/04_Project_Architecture.md §9. All model-layer database access must
 * acquire connections from this pool rather than creating new connections.
 */

const mysql = require('mysql2/promise');
const env = require('./env');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

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
    // 1. Create admin_audit_logs table if it does not already exist
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

    // 2. Create migrations table if it does not already exist
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Scan and execute any pending migration files
    const migrationsDir = path.join(__dirname, '../database/migration');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of files) {
        const [rows] = await connection.execute(
          'SELECT 1 FROM migrations WHERE name = ? LIMIT 1',
          [file]
        );

        if (rows.length === 0) {
          logger.info(`Applying database migration: ${file}`);
          const filePath = path.join(migrationsDir, file);
          const content = fs.readFileSync(filePath, 'utf8');

          // Clean comments and split by semicolon
          const cleanContent = content
            .split(/\r?\n/)
            .map(line => {
              const trimmed = line.trim();
              if (trimmed.startsWith('--') || trimmed.startsWith('#')) {
                return '';
              }
              return line;
            })
            .join('\n');

          const statements = cleanContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0);

          // Execute statements sequentially
          for (const statement of statements) {
            try {
              await connection.execute(statement);
            } catch (err) {
              logger.error(`Failed to execute statement in migration ${file}:`, {
                statement,
                error: err.message,
              });
              throw err;
            }
          }

          // Record migration execution
          await connection.execute(
            'INSERT INTO migrations (name) VALUES (?)',
            [file]
          );
          logger.info(`Successfully applied migration: ${file}`);
        }
      }
    }

    // 4. Ensure default admin user exists and has correct credentials
    const [adminRows] = await connection.execute(
      'SELECT 1 FROM users WHERE email = ? LIMIT 1',
      ['admin@internshipportal.com']
    );

    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('Password123!', env.bcrypt.saltRounds || 10);

    if (adminRows.length === 0) {
      logger.info('Creating default admin user...');
      await connection.execute(
        `INSERT INTO users (name, email, password_hash, role, account_status)
         VALUES (?, ?, ?, ?, ?)`,
        [
          'Platform Admin',
          'admin@internshipportal.com',
          passwordHash,
          'admin',
          'active',
        ]
      );
      logger.info('Default admin user created.');
    } else {
      logger.info('Default admin user already exists. Enforcing correct credentials...');
      await connection.execute(
        `UPDATE users 
         SET name = ?, password_hash = ?, role = ?, account_status = ? 
         WHERE email = ?`,
        [
          'Platform Admin',
          passwordHash,
          'admin',
          'active',
          'admin@internshipportal.com',
        ]
      );
      logger.info('Default admin user credentials enforced.');
    }
  } finally {
    connection.release();
  }
}

module.exports = { pool, testConnection, initializeDatabase };