import api from './api';

/**
 * Fetches the authenticated student's dashboard summary.
 * Returns profile snapshot and profile completeness percentage.
 */
export async function fetchStudentDashboard() {
  const response = await api.get('/students/dashboard');
  return response.data.data;
}

/**
 * Fetches activity analytics for the authenticated student:
 * total applications submitted, shortlisted, accepted, and bookmarks.
 */
export async function fetchStudentActivity() {
  const response = await api.get('/analytics/students/activity');
  return response.data.data;
}

// ─── Profile ─────────────────────────────────────────────────────────────────

/**
 * Fetches the full profile of the authenticated student,
 * including bio, resumeUrl, education list, and skills list.
 */
export async function fetchStudentProfile() {
  const response = await api.get('/students/profile');
  return response.data.data;
}

/**
 * Updates the authenticated student's profile fields (name, bio).
 * @param {{ name?: string, bio?: string }} data
 */
export async function updateStudentProfile(data) {
  const response = await api.put('/students/profile', data);
  return response.data.data;
}

// ─── Resume ──────────────────────────────────────────────────────────────────

/**
 * Uploads a resume file (PDF / DOCX, max 5 MB) for the authenticated student.
 * @param {FormData} formData  Must contain field named "resume".
 */
export async function uploadStudentResume(formData) {
  const response = await api.post('/students/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

/**
 * Deletes the authenticated student's currently uploaded resume.
 */
export async function deleteStudentResume() {
  const response = await api.delete('/students/resume');
  return response.data;
}

// ─── Education ───────────────────────────────────────────────────────────────

/**
 * Fetches the authenticated student's education history list.
 */
export async function fetchStudentEducation() {
  const response = await api.get('/students/education');
  return response.data.data;
}

/**
 * Adds a new education entry for the authenticated student.
 * @param {{ institution: string, degree: string, fieldOfStudy?: string, startYear: number, endYear?: number, grade?: string }} data
 */
export async function addStudentEducation(data) {
  const response = await api.post('/students/education', data);
  return response.data.data;
}

/**
 * Updates an existing education entry.
 * @param {number} educationId
 * @param {{ institution?: string, degree?: string, fieldOfStudy?: string, startYear?: number, endYear?: number, grade?: string }} data
 */
export async function updateStudentEducation(educationId, data) {
  const response = await api.put(`/students/education/${educationId}`, data);
  return response.data.data;
}

/**
 * Deletes an education entry by ID.
 * @param {number} educationId
 */
export async function deleteStudentEducation(educationId) {
  const response = await api.delete(`/students/education/${educationId}`);
  return response.data;
}

// ─── Skills ──────────────────────────────────────────────────────────────────

/**
 * Fetches the authenticated student's skills list.
 */
export async function fetchStudentSkills() {
  const response = await api.get('/students/skills');
  return response.data.data;
}

/**
 * Adds a new skill for the authenticated student.
 * @param {{ skillName: string, proficiencyLevel?: string }} data
 */
export async function addStudentSkill(data) {
  const response = await api.post('/students/skills', data);
  return response.data.data;
}

/**
 * Updates an existing skill entry.
 * @param {number} skillId
 * @param {{ skillName?: string, proficiencyLevel?: string }} data
 */
export async function updateStudentSkill(skillId, data) {
  const response = await api.put(`/students/skills/${skillId}`, data);
  return response.data.data;
}

/**
 * Deletes a skill entry by ID.
 * @param {number} skillId
 */
export async function deleteStudentSkill(skillId) {
  const response = await api.delete(`/students/skills/${skillId}`);
  return response.data;
}

