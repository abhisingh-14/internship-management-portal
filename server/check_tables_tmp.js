const mysql = require('mysql2/promise');
require('dotenv').config();

async function main() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    const [rows] = await pool.execute('SHOW TABLES');
    console.log('Tables in database:', rows.map(r => Object.values(r)[0]));
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await pool.end();
  }
}

main();
