const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.log('Usage: node create_admin.js "<name>" "<email>" "<password>"');
    console.log('Example: node create_admin.js "Second Admin" "admin2@internshipportal.com" "SecurePass123!"');
    process.exit(1);
  }

  const [name, email, password] = args;

  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [rows] = await connection.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (rows.length > 0) {
      console.error(`Error: User with email ${email} already exists.`);
      process.exit(1);
    }

    // Hash the password securely using bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert the admin user record
    await connection.execute(
      `INSERT INTO users (name, email, password_hash, role, account_status)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, passwordHash, 'admin', 'active']
    );

    console.log(`Admin user "${name}" (${email}) created successfully!`);
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await connection.end();
  }
}

main();
