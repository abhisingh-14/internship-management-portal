/**
 * server/scripts/createAdmin.js
 *
 * Standalone CLI utility for creating additional admin accounts on demand.
 *
 * Admin accounts are intentionally excluded from public registration
 * (docs/05_Authentication.md — "no code path in this component can create
 * a role: 'admin' user"), and there is no HTTP endpoint for creating one,
 * since exposing "create admin" over the API would itself be a security
 * hole. This script is the deliberate, out-of-band replacement: it must be
 * run manually (locally against a tunnel, or via `railway run` against the
 * production database), never invoked by the running Express application.
 *
 * This script is intentionally NOT part of the MVC request pipeline —
 * it does not go through routes/controllers/middleware, since it has no
 * HTTP caller and no authenticated request context to authorize against.
 * Per docs/05_Coding_Standards.md §1 ("no direct SQL in controllers — all
 * SQL lives in models"), this rule applies to request-handling code; a
 * maintenance script with its own scoped, parameterized query is treated
 * the same way server/database/*.sql migration tooling is — infrastructure,
 * not application code.
 *
 * Usage:
 *   node server/scripts/createAdmin.js --name "Jane Admin" --email jane.admin@example.com --password "StrongPass123!"
 *
 * Or via the npm script (see package.json):
 *   npm run create-admin -- --name "Jane Admin" --email jane.admin@example.com --password "StrongPass123!"
 *
 * On Railway:
 *   railway run node server/scripts/createAdmin.js --name "Jane Admin" --email jane.admin@example.com --password "StrongPass123!"
 */

const bcrypt = require('bcrypt');
const env = require('../config/env');
const { pool } = require('../config/db');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
// At least one letter and one number, mirroring the registration password
// rule documented in docs/03_API_Design.md §8.1.
const PASSWORD_STRENGTH_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;

/**
 * Parses `--key value` / `--key=value` style CLI arguments into a plain
 * object. Supports both `--name "Jane Admin"` and `--name="Jane Admin"`.
 */
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      continue;
    }

    const eqIndex = token.indexOf('=');
    if (eqIndex !== -1) {
      const key = token.slice(2, eqIndex);
      const value = token.slice(eqIndex + 1);
      args[key] = value;
    } else {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--')) {
        args[key] = next;
        i += 1;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function validateInput({ name, email, password }) {
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 100) {
    errors.push('--name is required and must be between 2 and 100 characters.');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('--email is required and must be a valid email address.');
  }

  if (!password || typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`--password is required and must be at least ${PASSWORD_MIN_LENGTH} characters long.`);
  } else if (!PASSWORD_STRENGTH_REGEX.test(password)) {
    errors.push('--password must include at least one letter and one number.');
  }

  return errors;
}

async function createAdmin({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();

  // Guard against accidentally colliding with the environment-managed
  // default admin account, which server/config/db.js's initializeDatabase()
  // re-enforces on every server boot. Creating a second row with that same
  // email is not possible anyway (UNIQUE constraint on users.email), but
  // failing early here gives a much clearer error message.
  if (normalizedEmail === env.admin.email.trim().toLowerCase()) {
    throw new Error(
      `"${normalizedEmail}" is the environment-managed default admin account ` +
      '(ADMIN_EMAIL). Its credentials are controlled exclusively via the ' +
      'ADMIN_EMAIL/ADMIN_PASSWORD environment variables, not this script. ' +
      'Choose a different email for this new admin account.'
    );
  }

  const connection = await pool.getConnection();
  try {
    const [existingRows] = await connection.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );

    if (existingRows.length > 0) {
      throw new Error(`A user with email "${normalizedEmail}" already exists.`);
    }

    const passwordHash = await bcrypt.hash(password, env.bcrypt.saltRounds || 10);

    const [result] = await connection.execute(
      `INSERT INTO users (name, email, password_hash, role, account_status)
       VALUES (?, ?, ?, 'admin', 'active')`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    return { id: result.insertId, name: name.trim(), email: normalizedEmail };
  } finally {
    connection.release();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const input = {
    name: typeof args.name === 'string' ? args.name : undefined,
    email: typeof args.email === 'string' ? args.email : undefined,
    password: typeof args.password === 'string' ? args.password : undefined,
  };

  const validationErrors = validateInput(input);
  if (validationErrors.length > 0) {
    console.error('Cannot create admin account — invalid input:');
    validationErrors.forEach((message) => console.error(`  - ${message}`));
    console.error(
      '\nUsage: node server/scripts/createAdmin.js --name "Full Name" --email admin@example.com --password "StrongPass123!"'
    );
    process.exitCode = 1;
    return;
  }

  try {
    const created = await createAdmin(input);
    console.log('Admin account created successfully:');
    console.log(`  id:    ${created.id}`);
    console.log(`  name:  ${created.name}`);
    console.log(`  email: ${created.email}`);
  } catch (error) {
    console.error(`Failed to create admin account: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();
