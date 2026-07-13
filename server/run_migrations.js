const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: process.env.MYSQLHOST || process.env.DB_HOST,
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT),
    user: process.env.MYSQLUSER || process.env.DB_USER,
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
    database: process.env.MYSQLDATABASE || process.env.DB_NAME,
  });

  try {
    console.log('Connected. Creating migrations table if not exists...');
    // Create migrations table if not exists
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Scan migration directory
    const migrationsDir = path.join(__dirname, 'database/migration');
    if (!fs.existsSync(migrationsDir)) {
      console.error(`Migration directory not found at: ${migrationsDir}`);
      return;
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files. Checking status...`);

    for (const file of files) {
      const [rows] = await connection.execute(
        'SELECT 1 FROM migrations WHERE name = ? LIMIT 1',
        [file]
      );

      if (rows.length === 0) {
        console.log(`Applying database migration: ${file}`);
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
            console.error(`Failed to execute statement in migration ${file}:`);
            console.error(`Statement: ${statement}`);
            console.error(`Error: ${err.message}`);
            throw err;
          }
        }

        // Record migration execution
        await connection.execute(
          'INSERT INTO migrations (name) VALUES (?)',
          [file]
        );
        console.log(`Successfully applied migration: ${file}`);
      } else {
        console.log(`Migration already applied: ${file}`);
      }
    }
    console.log('All migrations checked and up to date.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await connection.end();
  }
}

runMigrations();
