const express = require('express');

const authRoutes = require('./auth.routes');
const studentRoutes = require('./student.routes');
const companyRoutes = require('./company.routes');
const internshipRoutes = require('./internship.routes');

// Reserved placeholders for future resource routers, added by later
// components as each resource is implemented:
const applicationRoutes = require('./application.routes');
const savedInternshipRoutes = require('./savedInternship.routes');
// const notificationRoutes = require('./notification.routes');
// const adminRoutes = require('./admin.routes');
// const analyticsRoutes = require('./analytics.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);

router.use('/companies', companyRoutes);
router.use('/internships', internshipRoutes);

router.use('/applications', applicationRoutes);
router.use('/bookmarks', savedInternshipRoutes);
// router.use('/notifications', notificationRoutes);
// router.use('/admin', adminRoutes);
// router.use('/analytics', analyticsRoutes);

module.exports = router;
