const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function main() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const email = 'admin@internshipportal.com';
    const name = 'Platform Admin';
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const role = 'admin';
    const status = 'active';

    const [rows] = await connection.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (rows.length === 0) {
      console.log(`Admin with email ${email} not found. Creating...`);
      await connection.execute(
        `INSERT INTO users (name, email, password_hash, role, account_status)
         VALUES (?, ?, ?, ?, ?)`,
        [name, email, passwordHash, role, status]
      );
      console.log('Admin user successfully created!');
    } else {
      console.log(`Admin with email ${email} already exists. Updating credentials...`);
      await connection.execute(
        `UPDATE users 
         SET name = ?, password_hash = ?, role = ?, account_status = ? 
         WHERE email = ?`,
        [name, passwordHash, role, status, email]
      );
      console.log('Admin user successfully updated with correct credentials!');
    }
  } catch (error) {
    console.error('Error adding/updating admin:', error);
  } finally {
    await connection.end();
  }
}

main();
