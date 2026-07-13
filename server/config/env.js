// server/config/env.js

const dotenv = require('dotenv');

dotenv.config();

const REQUIRED_ENV_VARS = [
  'NODE_ENV',
  'PORT',
  'CLIENT_ORIGIN',
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'JWT_REFRESH_SECRET',
  'JWT_REFRESH_EXPIRES_IN',
  'BCRYPT_SALT_ROUNDS',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
];

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter(
    (key) => process.env[key] === undefined || process.env[key] === ''
  );

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
  clientOrigin: process.env.CLIENT_ORIGIN,
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),

  admin: {
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },

  db: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    name: process.env.DB_NAME,
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