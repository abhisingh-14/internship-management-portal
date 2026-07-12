const express = require('express');
const authenticate = require('../middleware/authenticate');
const { serveResume, serveLogo } = require('../controllers/file.controller');

const router = express.Router();

// Resumes may contain personal data, so serving one requires a valid,
// authenticated session; ownership/role checks happen inside the
// controller (student owner or admin only, for now).
router.get('/resumes/:filename', authenticate, serveResume);

// Logos are public-facing branding assets shown on public company
// profiles, so no authentication is required to view one.
router.get('/logos/:filename', serveLogo);

module.exports = router;
