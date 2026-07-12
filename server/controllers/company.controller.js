const companyProfileModel = require('../models/companyProfile.model');
const internshipModel = require('../models/internship.model');
const { NotFoundError } = require('../utils/apiError');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Fields considered when computing profile completeness. logoUrl is
 * included since the column already exists on company_profiles even
 * though logo upload itself ships in Component 08 — a company that has
 * not yet uploaded a logo simply scores lower until they do.
 */
function calculateProfileCompleteness(profile) {
  const trackedFields = [profile.description, profile.website, profile.industry, profile.logoUrl];
  const filledFieldCount = trackedFields.filter(
    (value) => value !== null && value !== undefined && String(value).trim() !== ''
  ).length;

  return Math.round((filledFieldCount / trackedFields.length) * 100);
}

/**
 * Maps a raw company_profiles row (snake_case columns) to the camelCase
 * API contract shape defined in docs/03_API_Design.md §8.3.
 */
function toPublicProfile(profileRow) {
  return {
    id: profileRow.id,
    companyName: profileRow.company_name,
    description: profileRow.description,
    website: profileRow.website,
    industry: profileRow.industry,
    logoUrl: profileRow.logo_url,
    approvalStatus: profileRow.approval_status,
    createdAt: profileRow.created_at,
    updatedAt: profileRow.updated_at,
  };
}

/**
 * GET /companies/dashboard
 * Returns a summary view for the company's dashboard landing page:
 * a slim profile snapshot, profile completeness percentage, and
 * internship posting counts by status.
 */
const getDashboard = asyncHandler(async (req, res) => {
  const profileRow = await companyProfileModel.findByUserId(req.user.id);
  if (!profileRow) {
    throw new NotFoundError('Company profile not found');
  }

  const publicProfile = toPublicProfile(profileRow);
  const internshipStats = await internshipModel.getInternshipStatsByCompanyId(publicProfile.id);
  const profileCompleteness = calculateProfileCompleteness(publicProfile);

  sendSuccess(res, {
    message: 'Dashboard retrieved',
    data: {
      profile: {
        id: publicProfile.id,
        companyName: publicProfile.companyName,
        approvalStatus: publicProfile.approvalStatus,
        logoUrl: publicProfile.logoUrl,
      },
      profileCompleteness,
      internshipStats,
    },
  });
});

/**
 * GET /companies/profile
 * Returns the authenticated company's full profile.
 */
const getProfile = asyncHandler(async (req, res) => {
  const profileRow = await companyProfileModel.findByUserId(req.user.id);
  if (!profileRow) {
    throw new NotFoundError('Company profile not found');
  }

  sendSuccess(res, {
    message: 'Profile retrieved',
    data: toPublicProfile(profileRow),
  });
});

/**
 * PUT /companies/profile
 * Updates the authenticated company's editable profile fields.
 * approvalStatus and logoUrl are never accepted here — approvalStatus is
 * Admin-only (Component 09), logoUrl is managed by the File Upload
 * component (Component 08).
 */
const updateProfile = asyncHandler(async (req, res) => {
  const existingProfileRow = await companyProfileModel.findByUserId(req.user.id);
  if (!existingProfileRow) {
    throw new NotFoundError('Company profile not found');
  }

  const { companyName, description, website, industry } = req.body;

  const updatedProfileRow = await companyProfileModel.updateProfile(req.user.id, {
    companyName: companyName !== undefined ? companyName : existingProfileRow.company_name,
    description: description !== undefined ? description : existingProfileRow.description,
    website: website !== undefined ? website : existingProfileRow.website,
    industry: industry !== undefined ? industry : existingProfileRow.industry,
  });

  sendSuccess(res, {
    message: 'Profile updated successfully',
    data: toPublicProfile(updatedProfileRow),
  });
});

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
};
