// server/routes/index.js

const express = require('express');
const authRoutes = require('./auth.routes');

const router = express.Router();

router.use('/auth', authRoutes);

// Reserved for upcoming components:
// router.use('/students', studentRoutes);
// router.use('/companies', companyRoutes);
// router.use('/internships', internshipRoutes);
// router.use('/internships', internshipApplicationRoutes); // nested applications
// router.use('/applications', applicationRoutes);
// router.use('/bookmarks', savedInternshipRoutes);
// router.use('/notifications', notificationRoutes);
// router.use('/admin', adminRoutes);
// router.use('/analytics', analyticsRoutes);

module.exports = router;