// server/config/env.js

const dotenv = require('dotenv');

dotenv.config();

function validateEnv() {
  const missing = [];

  if (!process.env.NODE_ENV) missing.push('NODE_ENV');
  if (!process.env.CLIENT_ORIGIN) missing.push('CLIENT_ORIGIN');
  if (!process.env.PORT) missing.push('PORT');

  // Require either custom DB_* variables or Railway-provided MYSQL* variables
  if (!process.env.DB_HOST && !process.env.MYSQLHOST) missing.push('DB_HOST / MYSQLHOST');
  if (!process.env.DB_PORT && !process.env.MYSQLPORT) missing.push('DB_PORT / MYSQLPORT');
  if (!process.env.DB_USER && !process.env.MYSQLUSER) missing.push('DB_USER / MYSQLUSER');
  if (!process.env.DB_PASSWORD && !process.env.MYSQLPASSWORD) missing.push('DB_PASSWORD / MYSQLPASSWORD');
  if (!process.env.DB_NAME && !process.env.MYSQLDATABASE) missing.push('DB_NAME / MYSQLDATABASE');

  if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
  if (!process.env.JWT_EXPIRES_IN) missing.push('JWT_EXPIRES_IN');
  if (!process.env.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');
  if (!process.env.JWT_REFRESH_EXPIRES_IN) missing.push('JWT_REFRESH_EXPIRES_IN');
  if (!process.env.BCRYPT_SALT_ROUNDS) missing.push('BCRYPT_SALT_ROUNDS');
  if (!process.env.ADMIN_EMAIL) missing.push('ADMIN_EMAIL');
  if (!process.env.ADMIN_PASSWORD) missing.push('ADMIN_PASSWORD');

  if (missing.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
    process.exit(1);
  }
}

const INSECURE_ADMIN_PASSWORDS = ['password123!', 'admin123', 'changeme', 'password'];

function validateAdminPassword() {
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  if (adminPassword.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters long.');
    process.exit(1);
  }
  if (INSECURE_ADMIN_PASSWORDS.includes(adminPassword.toLowerCase())) {
    console.error(`ADMIN_PASSWORD is set to a well-known default value ("${adminPassword}"). Set a strong, unique value.`);
    process.exit(1);
  }
}

validateEnv();
validateAdminPassword();


const env = {
  nodeEnv: process.env.NODE_ENV,
  port: Number(process.env.PORT),
  clientOrigin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.replace(/\/$/, '') : '',
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },

  db: {
    host: process.env.MYSQLHOST || process.env.DB_HOST,
    port: Number(process.env.MYSQLPORT || process.env.DB_PORT),
    user: process.env.MYSQLUSER || process.env.DB_USER,
    password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
    name: process.env.MYSQLDATABASE || process.env.DB_NAME,
    connectionLimit: process.env.DB_CONNECTION_LIMIT
      ? Number(process.env.DB_CONNECTION_LIMIT)
      : undefined,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
  },

  bcrypt: {
    saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS),
  },

  upload: {
    maxResumeSizeMb: Number(process.env.MAX_RESUME_SIZE_MB) || 5,
    maxLogoSizeMb: Number(process.env.MAX_LOGO_SIZE_MB) || 2,
  },

  isProduction: process.env.NODE_ENV === 'production',
};

module.exports = env;