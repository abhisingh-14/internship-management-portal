import { useEffect, useState, useCallback, useRef } from 'react';
import Loader from '../../components/common/Loader';
import AlertMessage from '../../components/common/AlertMessage';
import useAuth from '../../hooks/useAuth';
import { AUTH_TOKEN_KEY } from '../../context/AuthContext';
import {
  fetchStudentProfile,
  updateStudentProfile,
  uploadStudentResume,
  deleteStudentResume,
  addStudentEducation,
  updateStudentEducation,
  deleteStudentEducation,
  addStudentSkill,
  updateStudentSkill,
  deleteStudentSkill,
} from '../../services/studentService';

// Must match the backend validator exactly (lowercase)
const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];
const PROFICIENCY_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced', expert: 'Expert' };

const BLANK_EDUCATION = { institution: '', degree: '', fieldOfStudy: '', startYear: '', endYear: '', grade: '' };
const BLANK_SKILL = { skillName: '', proficiencyLevel: 'intermediate' };

function currentYear() { return new Date().getFullYear(); }
function yearRange(from, to) { return Array.from({ length: to - from + 1 }, (_, i) => to - i); }

function FlashAlert({ flash, onClose }) {
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [flash, onClose]);
  if (!flash) return null;
  return <AlertMessage type={flash.type} message={flash.message} onClose={onClose} />;
}

function EducationModal({ entry, onClose, onSave }) {
  const [form, setForm] = useState(entry ?? BLANK_EDUCATION);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const years = yearRange(1970, currentYear() + 6);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.institution.trim()) e.institution = 'Institution is required.';
    if (!form.degree.trim()) e.degree = 'Degree is required.';
    if (!form.startYear) e.startYear = 'Start year is required.';
    if (form.endYear && Number(form.endYear) < Number(form.startYear)) e.endYear = 'End year must be >= start year.';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      // Transform form's year numbers into ISO date strings expected by the backend
      await onSave({
        institutionName: form.institution.trim(),
        degree: form.degree.trim(),
        fieldOfStudy: form.fieldOfStudy.trim() || null,
        startDate: `${form.startYear}-01-01`,
        endDate: form.endYear ? `${form.endYear}-01-01` : null,
        grade: form.grade.trim() || null,
      });
    } finally { setSaving(false); }
  }

  return (
    <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-header">
              <h5 className="modal-title fw-bold">{entry ? 'Edit Education' : 'Add Education'}</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="edu-institution" className="form-label">Institution <span className="text-danger">*</span></label>
                <input id="edu-institution" name="institution" type="text"
                  className={`form-control ${errors.institution ? 'is-invalid' : ''}`}
                  value={form.institution} onChange={handleChange} maxLength={200} />
                {errors.institution && <div className="invalid-feedback">{errors.institution}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="edu-degree" className="form-label">Degree / Certificate <span className="text-danger">*</span></label>
                <input id="edu-degree" name="degree" type="text"
                  className={`form-control ${errors.degree ? 'is-invalid' : ''}`}
                  value={form.degree} onChange={handleChange} maxLength={150} />
                {errors.degree && <div className="invalid-feedback">{errors.degree}</div>}
              </div>
              <div className="mb-3">
                <label htmlFor="edu-fieldOfStudy" className="form-label">Field of Study</label>
                <input id="edu-fieldOfStudy" name="fieldOfStudy" type="text"
                  className="form-control" value={form.fieldOfStudy} onChange={handleChange} maxLength={150} />
              </div>
              <div className="row g-3 mb-3">
                <div className="col-6">
                  <label htmlFor="edu-startYear" className="form-label">Start Year <span className="text-danger">*</span></label>
                  <select id="edu-startYear" name="startYear"
                    className={`form-select ${errors.startYear ? 'is-invalid' : ''}`}
                    value={form.startYear} onChange={handleChange}>
                    <option value="">- Select -</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  {errors.startYear && <div className="invalid-feedback">{errors.startYear}</div>}
                </div>
                <div className="col-6">
                  <label htmlFor="edu-endYear" className="form-label">End Year</label>
                  <select id="edu-endYear" name="endYear"
                    className={`form-select ${errors.endYear ? 'is-invalid' : ''}`}
                    value={form.endYear} onChange={handleChange}>
                    <option value="">- Present -</option>
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  {errors.endYear && <div className="invalid-feedback">{errors.endYear}</div>}
                </div>
              </div>
              <div className="mb-2">
                <label htmlFor="edu-grade" className="form-label">Grade / CGPA</label>
                <input id="edu-grade" name="grade" type="text" className="form-control"
                  value={form.grade} onChange={handleChange} maxLength={20} placeholder="e.g. 8.5 / 10 or A+" />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Saving...</> : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function SkillModal({ entry, onClose, onSave }) {
  const [form, setForm] = useState(entry ?? BLANK_SKILL);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.skillName.trim()) { setErrors({ skillName: 'Skill name is required.' }); return; }
    setSaving(true);
    try {
      await onSave({ skillName: form.skillName.trim(), proficiencyLevel: form.proficiencyLevel || null });
    } finally { setSaving(false); }
  }

  return (
    <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          <form onSubmit={handleSubmit} noValidate>
            <div className="modal-header">
              <h5 className="modal-title fw-bold">{entry ? 'Edit Skill' : 'Add Skill'}</h5>
              <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="skill-name" className="form-label">Skill Name <span className="text-danger">*</span></label>
                <input id="skill-name" name="skillName" type="text"
                  className={`form-control ${errors.skillName ? 'is-invalid' : ''}`}
                  value={form.skillName} onChange={handleChange} maxLength={100}
                  placeholder="e.g. React, Python, Figma" />
                {errors.skillName && <div className="invalid-feedback">{errors.skillName}</div>}
              </div>
              <div className="mb-2">
                <label htmlFor="skill-proficiency" className="form-label">Proficiency Level</label>
                <select id="skill-proficiency" name="proficiencyLevel"
                  className="form-select" value={form.proficiencyLevel} onChange={handleChange}>
                  {PROFICIENCY_LEVELS.map(l => <option key={l} value={l}>{PROFICIENCY_LABEL[l]}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Saving...</> : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const PROFICIENCY_BADGE = {
  beginner:     'bg-secondary-subtle text-secondary-emphasis',
  intermediate: 'bg-primary-subtle text-primary-emphasis',
  advanced:     'bg-warning-subtle text-warning-emphasis',
  expert:       'bg-success-subtle text-success-emphasis',
};

function StudentProfile() {
  const { user } = useAuth();
  const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const serverOrigin = apiBaseUrl.replace('/api/v1', '');

  const [profile, setProfile] = useState(null);
  const [education, setEducation] = useState([]);
  const [skills, setSkills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [flash, setFlash] = useState(null);

  const [bioEditMode, setBioEditMode] = useState(false);
  const [bioValue, setBioValue] = useState('');
  const [bioSaving, setBioSaving] = useState(false);

  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeDeleting, setResumeDeleting] = useState(false);
  const resumeInputRef = useRef(null);

  const [eduModal, setEduModal] = useState(null);
  const [skillModal, setSkillModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showFlash = useCallback((type, message) => setFlash({ type, message }), []);
  const clearFlash = useCallback(() => setFlash(null), []);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchStudentProfile();
      setProfile(data);
      setBioValue(data.bio || '');
      setEducation(data.education || []);
      setSkills(data.skills || []);
    } catch (err) {
      showFlash('danger', err.message || 'Failed to load profile.');
    } finally {
      setIsLoading(false);
    }
  }, [showFlash]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  async function handleBioSave() {
    setBioSaving(true);
    try {
      const updated = await updateStudentProfile({ bio: bioValue.trim() || null });
      setProfile(prev => ({ ...prev, bio: updated.bio }));
      setBioEditMode(false);
      showFlash('success', 'Bio updated successfully.');
    } catch (err) {
      showFlash('danger', err.message || 'Failed to update bio.');
    } finally { setBioSaving(false); }
  }

  function handleBioCancel() { setBioValue(profile?.bio || ''); setBioEditMode(false); }

  async function handleResumeUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('resume', file);
    setResumeUploading(true);
    try {
      const updated = await uploadStudentResume(formData);
      setProfile(prev => ({ ...prev, resumeUrl: updated.resumeUrl }));
      showFlash('success', 'Resume uploaded successfully.');
    } catch (err) {
      showFlash('danger', err.message || 'Failed to upload resume.');
    } finally {
      setResumeUploading(false);
      if (resumeInputRef.current) resumeInputRef.current.value = '';
    }
  }

  async function handleResumeDelete() {
    setResumeDeleting(true);
    try {
      await deleteStudentResume();
      setProfile(prev => ({ ...prev, resumeUrl: null }));
      showFlash('success', 'Resume deleted.');
    } catch (err) {
      showFlash('danger', err.message || 'Failed to delete resume.');
    } finally { setResumeDeleting(false); }
  }

  async function handleEducationSave(data) {
    try {
      if (eduModal?.id) {
        const updated = await updateStudentEducation(eduModal.id, data);
        setEducation(prev => prev.map(e => e.id === eduModal.id ? updated : e));
        showFlash('success', 'Education updated.');
      } else {
        const created = await addStudentEducation(data);
        setEducation(prev => [...prev, created]);
        showFlash('success', 'Education added.');
      }
      setEduModal(null);
    } catch (err) {
      showFlash('danger', err.message || 'Failed to save education entry.');
      throw err;
    }
  }

  async function handleSkillSave(data) {
    try {
      if (skillModal?.id) {
        const updated = await updateStudentSkill(skillModal.id, data);
        setSkills(prev => prev.map(s => s.id === skillModal.id ? updated : s));
        showFlash('success', 'Skill updated.');
      } else {
        const created = await addStudentSkill(data);
        setSkills(prev => [...prev, created]);
        showFlash('success', 'Skill added.');
      }
      setSkillModal(null);
    } catch (err) {
      showFlash('danger', err.message || 'Failed to save skill.');
      throw err;
    }
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      if (deleteTarget.type === 'education') {
        await deleteStudentEducation(deleteTarget.id);
        setEducation(prev => prev.filter(e => e.id !== deleteTarget.id));
        showFlash('success', 'Education entry removed.');
      } else {
        await deleteStudentSkill(deleteTarget.id);
        setSkills(prev => prev.filter(s => s.id !== deleteTarget.id));
        showFlash('success', 'Skill removed.');
      }
      setDeleteTarget(null);
    } catch (err) {
      showFlash('danger', err.message || 'Failed to delete entry.');
    } finally { setDeleteLoading(false); }
  }

  if (isLoading) return <Loader fullPage label="Loading profile..." />;

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h1 className="h3 fw-bold text-dark mb-1">My Profile</h1>
        <p className="text-secondary mb-0">Manage your bio, resume, education, and skills.</p>
      </div>

      <FlashAlert flash={flash} onClose={clearFlash} />

      {/* Bio / Identity */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <h2 className="h5 mb-0 fw-bold text-dark">
            <i className="bi bi-person-circle me-2 text-primary" aria-hidden="true" />
            Personal Info
          </h2>
          {!bioEditMode && (
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setBioEditMode(true)}>
              <i className="bi bi-pencil me-1" aria-hidden="true" />Edit Bio
            </button>
          )}
        </div>
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3 flex-shrink-0"
              style={{ width: '56px', height: '56px', fontSize: '1.4rem', fontWeight: 600 }}
              aria-hidden="true"
            >
              {(user?.name || profile?.name || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="fw-semibold mb-0 text-dark">{user?.name || profile?.name}</p>
              <small className="text-secondary">{user?.email || profile?.email}</small>
            </div>
          </div>
          {bioEditMode ? (
            <>
              <label htmlFor="bio-textarea" className="form-label fw-semibold small">Bio</label>
              <textarea id="bio-textarea" className="form-control mb-3" rows={4} maxLength={1000}
                value={bioValue} onChange={e => setBioValue(e.target.value)}
                placeholder="Write a short bio about yourself..." />
              <div className="d-flex gap-2">
                <button type="button" className="btn btn-primary btn-sm" disabled={bioSaving} onClick={handleBioSave}>
                  {bioSaving ? <><span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />Saving...</> : 'Save Bio'}
                </button>
                <button type="button" className="btn btn-outline-secondary btn-sm" disabled={bioSaving} onClick={handleBioCancel}>Cancel</button>
              </div>
            </>
          ) : (
            profile?.bio
              ? <p className="text-secondary mb-0 small">{profile.bio}</p>
              : <p className="text-muted fst-italic small mb-0">No bio added yet. Click <strong>Edit Bio</strong> to add one.</p>
          )}
        </div>
      </div>

      {/* Resume */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white border-bottom py-3">
          <h2 className="h5 mb-0 fw-bold text-dark">
            <i className="bi bi-file-earmark-person me-2 text-primary" aria-hidden="true" />Resume
          </h2>
        </div>
        <div className="card-body">
          {profile?.resumeUrl ? (
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
              <div>
                <p className="fw-semibold mb-1 text-success">
                  <i className="bi bi-file-earmark-check-fill me-2" aria-hidden="true" />Resume uploaded
                </p>
                <p className="small text-muted mb-0">Your resume is ready for internship applications.</p>
              </div>
              <div className="d-flex gap-2 flex-wrap">
                <a href={`${serverOrigin}${profile.resumeUrl}?token=${encodeURIComponent(token)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-primary d-inline-flex align-items-center">
                  <i className="bi bi-eye me-1" aria-hidden="true" />View
                </a>
                <label className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center mb-0" htmlFor="resume-replace-input">
                  <i className="bi bi-arrow-repeat me-1" aria-hidden="true" />
                  {resumeUploading ? 'Uploading...' : 'Replace'}
                  <input id="resume-replace-input" type="file" accept=".pdf,.docx" className="d-none"
                    ref={resumeInputRef} onChange={handleResumeUpload} disabled={resumeUploading} />
                </label>
                <button type="button" className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
                  onClick={handleResumeDelete} disabled={resumeDeleting}>
                  <i className="bi bi-trash me-1" aria-hidden="true" />{resumeDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-warning fw-semibold mb-1">
                <i className="bi bi-exclamation-triangle-fill me-2" aria-hidden="true" />No resume uploaded
              </p>
              <p className="small text-muted mb-3">Upload a PDF or DOCX file (max 5 MB) to apply to internships.</p>
              <label className="btn btn-primary btn-sm d-inline-flex align-items-center mb-0" htmlFor="resume-upload-input">
                <i className="bi bi-cloud-upload me-1" aria-hidden="true" />
                {resumeUploading ? 'Uploading...' : 'Upload Resume'}
                <input id="resume-upload-input" type="file" accept=".pdf,.docx" className="d-none"
                  ref={resumeInputRef} onChange={handleResumeUpload} disabled={resumeUploading} />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Education */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <h2 className="h5 mb-0 fw-bold text-dark">
            <i className="bi bi-mortarboard me-2 text-primary" aria-hidden="true" />Education
          </h2>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setEduModal({ isNew: true })}>
            <i className="bi bi-plus-lg me-1" aria-hidden="true" />Add
          </button>
        </div>
        <div className="card-body p-0">
          {education.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <i className="bi bi-mortarboard fs-2 mb-2 d-block" aria-hidden="true" />
              No education entries yet. Click <strong>Add</strong> to get started.
            </div>
          ) : (
            <ul className="list-group list-group-flush">
              {education.map((edu) => {
                // API returns ISO date strings; extract year for display
                const startYr = edu.startDate ? edu.startDate.slice(0, 4) : edu.startYear || '';
                const endYr   = edu.endDate   ? edu.endDate.slice(0, 4)   : (edu.endYear || null);
                const label   = edu.institutionName || edu.institution || '';
                return (
                  <li key={edu.id} className="list-group-item px-4 py-3">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <p className="fw-semibold mb-0 text-dark">{label}</p>
                        <p className="small text-secondary mb-0">
                          {edu.degree}{edu.fieldOfStudy ? ` - ${edu.fieldOfStudy}` : ''}
                        </p>
                        <p className="small text-muted mb-0">
                          {startYr} – {endYr ?? 'Present'}
                          {edu.grade ? ` | Grade: ${edu.grade}` : ''}
                        </p>
                      </div>
                      <div className="d-flex gap-2 flex-shrink-0">
                        <button type="button" className="btn btn-sm btn-outline-secondary"
                          onClick={() => setEduModal({
                            id: edu.id,
                            institution: edu.institutionName || edu.institution || '',
                            degree: edu.degree || '',
                            fieldOfStudy: edu.fieldOfStudy || '',
                            startYear: startYr,
                            endYear: endYr || '',
                            grade: edu.grade || '',
                          })}
                          aria-label={`Edit ${label}`}>
                          <i className="bi bi-pencil" aria-hidden="true" />
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-danger"
                          onClick={() => setDeleteTarget({ type: 'education', id: edu.id, label })}
                          aria-label={`Delete ${label}`}>
                          <i className="bi bi-trash" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <h2 className="h5 mb-0 fw-bold text-dark">
            <i className="bi bi-tools me-2 text-primary" aria-hidden="true" />Skills
          </h2>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => setSkillModal({ isNew: true })}>
            <i className="bi bi-plus-lg me-1" aria-hidden="true" />Add
          </button>
        </div>
        <div className="card-body">
          {skills.length === 0 ? (
            <div className="text-center py-4 text-secondary">
              <i className="bi bi-tools fs-2 mb-2 d-block" aria-hidden="true" />
              No skills added yet. Click <strong>Add</strong> to get started.
            </div>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              {skills.map((skill) => (
                <div key={skill.id}
                  className={`d-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill small fw-medium ${PROFICIENCY_BADGE[skill.proficiencyLevel] ?? 'bg-secondary-subtle text-secondary-emphasis'}`}>
                  <span>{skill.skillName}</span>
                  {skill.proficiencyLevel && (
                    <span className="opacity-75" style={{ fontSize: '0.8em' }}>({PROFICIENCY_LABEL[skill.proficiencyLevel] ?? skill.proficiencyLevel})</span>
                  )}
                  <button type="button" className="btn p-0 border-0 bg-transparent lh-1 ms-1" style={{ fontSize: '0.9em', opacity: 0.7 }}
                    onClick={() => setSkillModal(skill)} aria-label={`Edit ${skill.skillName}`}>
                    <i className="bi bi-pencil-fill" aria-hidden="true" />
                  </button>
                  <button type="button" className="btn p-0 border-0 bg-transparent lh-1" style={{ fontSize: '0.9em', opacity: 0.7 }}
                    onClick={() => setDeleteTarget({ type: 'skill', id: skill.id, label: skill.skillName })}
                    aria-label={`Remove ${skill.skillName}`}>
                    <i className="bi bi-x-circle-fill" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {eduModal && (
        <EducationModal entry={eduModal.isNew ? null : eduModal}
          onClose={() => setEduModal(null)} onSave={handleEducationSave} />
      )}

      {skillModal && (
        <SkillModal entry={skillModal.isNew ? null : skillModal}
          onClose={() => setSkillModal(null)} onSave={handleSkillSave} />
      )}

      {deleteTarget && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-sm" role="document">
            <div className="modal-content">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-danger">Confirm Delete</h5>
                <button type="button" className="btn-close" onClick={() => setDeleteTarget(null)} aria-label="Close" />
              </div>
              <div className="modal-body pt-2">
                <p className="mb-0">Are you sure you want to remove <strong>{deleteTarget.label}</strong>? This cannot be undone.</p>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>Cancel</button>
                <button type="button" className="btn btn-danger btn-sm" onClick={handleDeleteConfirm} disabled={deleteLoading}>
                  {deleteLoading ? <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" /> : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentProfile;
