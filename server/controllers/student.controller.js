const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { NotFoundError, ConflictError } = require('../utils/apiError');
const { buildResumeUrl, deleteResumeFileIfExists } = require('../utils/fileStorage');

const userModel = require('../models/user.model');
const studentProfileModel = require('../models/studentProfile.model');
const studentEducationModel = require('../models/studentEducation.model');
const studentSkillModel = require('../models/studentSkill.model');

/**
 * Resolves the `student_profiles.id` for the currently authenticated
 * user. `authenticate` + `authorize('student')` guarantee `req.user.role
 * === 'student'` and that the user still exists/is active, so a missing
 * profile here would indicate a data-integrity bug rather than a normal
 * user error — it is still surfaced as 404 rather than 500 so it fails
 * loudly without leaking internals.
 *
 * @param {number} userId
 * @returns {Promise<number>}
 */
async function resolveStudentId(userId) {
  const studentId = await studentProfileModel.findIdByUserId(userId);
  if (!studentId) {
    throw new NotFoundError('Student profile not found');
  }
  return studentId;
}

/**
 * GET /students/dashboard
 * Returns the authenticated student's dashboard summary: profile
 * snapshot, education/skill counts, resume status, and a simple profile
 * completeness percentage. Application/bookmark statistics are
 * intentionally not included here — they belong to the Applications and
 * Analytics modules (later components) and are not yet implemented.
 */
const getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const profile = await studentProfileModel.findByUserId(userId);
  if (!profile) {
    throw new NotFoundError('Student profile not found');
  }

  const [education, skills] = await Promise.all([
    studentEducationModel.findAllByStudentId(profile.id),
    studentSkillModel.findAllByStudentId(profile.id),
  ]);

  const completenessChecks = [
    Boolean(profile.bio),
    Boolean(profile.resumeUrl),
    education.length > 0,
    skills.length > 0,
  ];
  const profileCompleteness = Math.round(
    (completenessChecks.filter(Boolean).length / completenessChecks.length) * 100
  );

  sendSuccess(res, {
    message: 'Dashboard retrieved',
    data: {
      profile: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        bio: profile.bio,
        resumeUrl: profile.resumeUrl,
      },
      educationCount: education.length,
      skillsCount: skills.length,
      profileCompleteness,
    },
  });
});

/**
 * GET /students/profile
 * Returns the authenticated student's full profile, including nested
 * education and skills collections.
 */
const getProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const profile = await studentProfileModel.findByUserId(userId);
  if (!profile) {
    throw new NotFoundError('Student profile not found');
  }

  const [education, skills] = await Promise.all([
    studentEducationModel.findAllByStudentId(profile.id),
    studentSkillModel.findAllByStudentId(profile.id),
  ]);

  sendSuccess(res, {
    message: 'Profile retrieved',
    data: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      bio: profile.bio,
      resumeUrl: profile.resumeUrl,
      education,
      skills,
    },
  });
});

/**
 * PUT /students/profile
 * Updates the authenticated student's name (users table) and/or bio
 * (student_profiles table). Education and skills are managed through
 * their own dedicated endpoints, not through this one.
 */
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, bio } = req.body;

  if (name !== undefined) {
    await userModel.updateName(userId, name);
  }
  if (bio !== undefined) {
    await studentProfileModel.updateBio(userId, bio);
  }

  const profile = await studentProfileModel.findByUserId(userId);
  if (!profile) {
    throw new NotFoundError('Student profile not found');
  }

  sendSuccess(res, {
    message: 'Profile updated successfully',
    data: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      bio: profile.bio,
      resumeUrl: profile.resumeUrl,
    },
  });
});

/**
 * POST /students/resume
 * multipart/form-data, field name "resume". Requires the `uploadResume`
 * and `requireUploadedFile` middleware to have already run (see
 * student.routes.js), so req.file is guaranteed to be present and valid
 * (correct MIME type, within size limit) by the time this handler runs.
 */
const uploadResume = asyncHandler(async (req, res) => {
  const previousResumeUrl = await studentProfileModel.findResumeUrlByUserId(req.user.userId);

  // Persist the new file's URL first so a failure deleting the old file
  // never leaves the student without a resume on record.
  const newResumeUrl = buildResumeUrl(req.file.filename);
  await studentProfileModel.updateResumeUrl(req.user.userId, newResumeUrl);

  if (previousResumeUrl) {
    await deleteResumeFileIfExists(previousResumeUrl);
  }

  sendSuccess(res, {
    message: 'Resume uploaded successfully',
    data: { resumeUrl: newResumeUrl },
  });
});

/**
 * DELETE /students/resume
 */
const deleteResume = asyncHandler(async (req, res, next) => {
  const currentResumeUrl = await studentProfileModel.findResumeUrlByUserId(req.user.userId);

  if (!currentResumeUrl) {
    next(new NotFoundError('No resume is currently on file.'));
    return;
  }

  await studentProfileModel.clearResumeUrl(req.user.userId);
  await deleteResumeFileIfExists(currentResumeUrl);

  res.status(204).send();
});

/**
 * GET /students/education
 * Returns every education entry belonging to the authenticated student.
 */
const getEducationList = asyncHandler(async (req, res) => {
  const studentId = await resolveStudentId(req.user.id);
  const education = await studentEducationModel.findAllByStudentId(studentId);
  sendSuccess(res, { message: 'Education entries retrieved', data: education });
});

/**
 * POST /students/education
 * Creates a new education entry for the authenticated student.
 */
const addEducation = asyncHandler(async (req, res) => {
  const studentId = await resolveStudentId(req.user.id);
  const educationId = await studentEducationModel.create(studentId, req.body);
  const created = await studentEducationModel.findByIdAndStudentId(educationId, studentId);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Education entry created successfully',
    data: created,
  });
});

/**
 * PUT /students/education/:educationId
 * Updates an existing education entry owned by the authenticated student.
 */
const updateEducation = asyncHandler(async (req, res) => {
  const studentId = await resolveStudentId(req.user.id);
  const { educationId } = req.params;

  const updated = await studentEducationModel.update(educationId, studentId, req.body);
  if (!updated) {
    throw new NotFoundError('Education entry not found');
  }

  const education = await studentEducationModel.findByIdAndStudentId(educationId, studentId);
  sendSuccess(res, { message: 'Education entry updated successfully', data: education });
});

/**
 * DELETE /students/education/:educationId
 * Deletes an education entry owned by the authenticated student.
 */
const deleteEducation = asyncHandler(async (req, res) => {
  const studentId = await resolveStudentId(req.user.id);
  const { educationId } = req.params;

  const deleted = await studentEducationModel.deleteById(educationId, studentId);
  if (!deleted) {
    throw new NotFoundError('Education entry not found');
  }

  res.status(204).send();
});

/**
 * GET /students/skills
 * Returns every skill belonging to the authenticated student.
 */
const getSkillsList = asyncHandler(async (req, res) => {
  const studentId = await resolveStudentId(req.user.id);
  const skills = await studentSkillModel.findAllByStudentId(studentId);
  sendSuccess(res, { message: 'Skills retrieved', data: skills });
});

/**
 * POST /students/skills
 * Creates a new skill entry for the authenticated student. Rejects
 * duplicate skill names for the same student (application-layer check,
 * backed by the `uq_student_skills_student_skill` unique constraint as a
 * second line of defense against race conditions).
 */
const addSkill = asyncHandler(async (req, res) => {
  const studentId = await resolveStudentId(req.user.id);
  const { skillName, proficiencyLevel } = req.body;

  const alreadyExists = await studentSkillModel.existsByStudentAndName(studentId, skillName);
  if (alreadyExists) {
    throw new ConflictError('This skill has already been added to your profile');
  }

  const skillId = await studentSkillModel.create(studentId, { skillName, proficiencyLevel });
  const created = await studentSkillModel.findByIdAndStudentId(skillId, studentId);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Skill added successfully',
    data: created,
  });
});

/**
 * PUT /students/skills/:skillId
 * Updates the proficiency level of a skill owned by the authenticated
 * student.
 */
const updateSkill = asyncHandler(async (req, res) => {
  const studentId = await resolveStudentId(req.user.id);
  const { skillId } = req.params;
  const { proficiencyLevel } = req.body;

  const updated = await studentSkillModel.updateProficiency(skillId, studentId, proficiencyLevel);
  if (!updated) {
    throw new NotFoundError('Skill not found');
  }

  const skill = await studentSkillModel.findByIdAndStudentId(skillId, studentId);
  sendSuccess(res, { message: 'Skill updated successfully', data: skill });
});

/**
 * DELETE /students/skills/:skillId
 * Deletes a skill owned by the authenticated student.
 */
const deleteSkill = asyncHandler(async (req, res) => {
  const studentId = await resolveStudentId(req.user.id);
  const { skillId } = req.params;

  const deleted = await studentSkillModel.deleteById(skillId, studentId);
  if (!deleted) {
    throw new NotFoundError('Skill not found');
  }

  res.status(204).send();
});

module.exports = {
  getDashboard,
  getProfile,
  updateProfile,
  uploadResume,
  deleteResume,
  getEducationList,
  addEducation,
  updateEducation,
  deleteEducation,
  getSkillsList,
  addSkill,
  updateSkill,
  deleteSkill,
};
