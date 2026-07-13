import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInternshipById } from '../../services/internshipService';
import { applyForInternship, getStudentApplications } from '../../services/applicationService';
import { getSavedInternships, saveInternship, removeSavedInternship } from '../../services/savedInternshipService';
import api from '../../services/api';
import useAuth from '../../hooks/useAuth';
import Loader from '../../components/common/Loader';
import AlertMessage from '../../components/common/AlertMessage';
import { resolveFileUrl } from '../../utils/fileUrl';

/**
 * Formats an ISO date string into a readable, locale-aware form.
 * @param {string} isoDate
 * @returns {string}
 */
function formatDate(isoDate) {
  if (!isoDate) return 'N/A';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Formats an integer stipend value as a currency-style string.
 * @param {number} stipend
 * @returns {string}
 */
function formatStipend(stipend) {
  if (stipend === undefined || stipend === null || stipend === 0) return 'Unpaid';
  return `₹${stipend.toLocaleString('en-IN')} / month`;
}

const STATUS_BADGE_CLASSES = {
  applied: 'bg-primary text-white',
  under_review: 'bg-info text-dark',
  shortlisted: 'bg-warning text-dark',
  accepted: 'bg-success text-white',
  rejected: 'bg-danger text-white',
  withdrawn: 'bg-secondary text-white',
};

const STATUS_TEXTS = {
  applied: 'Applied',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  accepted: 'Accepted',
  rejected: 'Not Selected',
  withdrawn: 'Withdrawn',
};

/**
 * InternshipDetails — public detail page (Component 10 & 11) for a single
 * internship posting. Enables students to submit applications with an optional
 * cover letter and displays current application status.
 */
function InternshipDetails() {
  const { internshipId } = useParams();
  const { isAuthenticated, user } = useAuth();

  const [internship, setInternship] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Student specific application states
  const [hasApplied, setHasApplied] = useState(null); // application status string, e.g. 'applied', 'under_review', ...
  const [resumeUrl, setResumeUrl] = useState(null);
  const [resumeChecked, setResumeChecked] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationError, setApplicationError] = useState(null);

  // Resume upload states
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeUploadError, setResumeUploadError] = useState(null);

  // Student bookmark states
  const [isSaved, setIsSaved] = useState(false);
  const [isSavingBookmark, setIsSavingBookmark] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchInternship() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getInternshipById(internshipId);
        if (isMounted) {
          setInternship(data);
        }
      } catch (fetchError) {
        if (isMounted) {
          const status = fetchError.status;
          setError(
            status === 404
               ? 'This internship posting could not be found. It may have been removed or closed.'
               : fetchError.message || 'Unable to load this internship. Please try again.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchInternship();

    return () => {
      isMounted = false;
    };
  }, [internshipId]);

  // Load student-specific application status
  useEffect(() => {
    let isMounted = true;

    async function checkStudentStatus() {
      if (isAuthenticated && user?.role === 'student') {
        try {
          // Fetch student profile to verify resumeUrl
          const profileResponse = await api.get('/students/profile');
          if (isMounted) {
            setResumeUrl(profileResponse.data.data.resumeUrl);
            setResumeChecked(true);
          }

          // Fetch student applications to check duplicate
          const { items } = await getStudentApplications({ limit: 100 });
          if (isMounted) {
            const existingApp = items.find((app) => Number(app.internshipId) === Number(internshipId));
            if (existingApp) {
              setHasApplied(existingApp.status);
            }
          }

          // Fetch student bookmarks to check if saved
          const { items: savedItems } = await getSavedInternships({ limit: 100 });
          if (isMounted) {
            const isBookmarked = savedItems.some((item) => Number(item.internshipId) === Number(internshipId));
            setIsSaved(isBookmarked);
          }
        } catch (err) {
          console.error('Error fetching student applications or profile info:', err);
        }
      }
    }

    checkStudentStatus();

    return () => {
      isMounted = false;
    };
  }, [internshipId, isAuthenticated, user]);

  const handleBookmarkToggle = async () => {
    if (isSavingBookmark) return;
    setIsSavingBookmark(true);
    try {
      if (isSaved) {
        await removeSavedInternship(internshipId);
        setIsSaved(false);
      } else {
        await saveInternship(internshipId);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
    } finally {
      setIsSavingBookmark(false);
    }
  };

  const handleApplyClick = () => {
    setApplicationError(null);
    setShowApplyModal(true);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApplicationError(null);

    try {
      await applyForInternship(internshipId, coverLetter.trim() || null);
      setHasApplied('applied');
      setShowApplyModal(false);
      setCoverLetter('');
    } catch (err) {
      setApplicationError(err.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingResume(true);
    setResumeUploadError(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await api.post('/students/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResumeUrl(response.data.data.resumeUrl);
    } catch (err) {
      setResumeUploadError(err.message || 'Failed to upload resume');
    } finally {
      setIsUploadingResume(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-4">
        <Loader label="Loading internship details..." />
      </div>
    );
  }

  if (error || !internship) {
    return (
      <div className="container py-4">
        <AlertMessage type="danger" message={error || 'Internship not found.'} onClose={() => {}} />
        <Link to="/internships" className="btn btn-outline-primary mt-2">
          Back to Browse Internships
        </Link>
      </div>
    );
  }

  const isStudent = isAuthenticated && user?.role === 'student';

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/internships">Internships</Link>
          </li>
          <li className="breadcrumb-item active text-truncate" aria-current="page">
            {internship.title}
          </li>
        </ol>
      </nav>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start mb-3">
            <div className="d-flex align-items-center mb-3 mb-md-0">
              {internship.company.logoUrl ? (
                <img
                  src={resolveFileUrl(internship.company.logoUrl)}
                  alt={`${internship.company.companyName} logo`}
                  className="rounded me-3"
                  style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="rounded bg-light d-flex align-items-center justify-content-center me-3 text-secondary"
                  style={{ width: '64px', height: '64px' }}
                >
                  <i className="bi bi-building fs-3" aria-hidden="true" />
                </div>
              )}
              <div>
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <h1 className="h4 mb-1">{internship.title}</h1>
                  {isStudent && (
                    <button
                      type="button"
                      className={`btn btn-sm ${isSaved ? 'btn-danger' : 'btn-outline-danger'} d-inline-flex align-items-center py-1 px-2`}
                      onClick={handleBookmarkToggle}
                      disabled={isSavingBookmark}
                      title={isSaved ? 'Remove from Saved' : 'Save Internship'}
                    >
                      <i className={`bi ${isSaved ? 'bi-heart-fill' : 'bi-heart'} me-1`} aria-hidden="true" />
                      {isSaved ? 'Saved' : 'Save'}
                    </button>
                  )}
                </div>
                <p className="text-muted mb-0">{internship.company.companyName}</p>
              </div>
            </div>

            <div className="text-md-end">
              <span className="fs-5 fw-semibold text-success d-block">
                {formatStipend(internship.stipend)}
              </span>
              <span className="text-muted small">
                Application deadline: {formatDate(internship.applicationDeadline)}
              </span>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-6 col-md-3 mb-2">
              <div className="text-muted small">Location</div>
              <div className="fw-medium">
                <i className="bi bi-geo-alt me-1" aria-hidden="true" />
                {internship.location}
              </div>
            </div>
            <div className="col-6 col-md-3 mb-2">
              <div className="text-muted small">Duration</div>
              <div className="fw-medium">
                <i className="bi bi-clock me-1" aria-hidden="true" />
                {internship.duration}
              </div>
            </div>
            <div className="col-6 col-md-3 mb-2">
              <div className="text-muted small">Industry</div>
              <div className="fw-medium">{internship.company.industry || 'N/A'}</div>
            </div>
            <div className="col-6 col-md-3 mb-2">
              <div className="text-muted small">Posted</div>
              <div className="fw-medium">{formatDate(internship.createdAt)}</div>
            </div>
          </div>

          <h2 className="h5">Required Skills</h2>
          <div className="mb-4">
            {internship.requiredSkills.map((skill) => (
              <span key={skill} className="badge text-bg-light border me-1 mb-1">
                {skill}
              </span>
            ))}
          </div>

          <h2 className="h5">Description</h2>
          <p className="mb-4" style={{ whiteSpace: 'pre-wrap' }}>
            {internship.description}
          </p>

          {internship.company.description && (
            <>
              <h2 className="h5">About {internship.company.companyName}</h2>
              <p className="mb-4" style={{ whiteSpace: 'pre-wrap' }}>
                {internship.company.description}
              </p>
              {internship.company.website && (
                <p className="mb-4">
                  <a href={internship.company.website} target="_blank" rel="noopener noreferrer">
                    {internship.company.website}
                  </a>
                </p>
              )}
            </>
          )}

          <hr />

          {isStudent ? (
            <div>
              {hasApplied ? (
                <div className="d-flex align-items-center">
                  <span className="me-2 fw-medium text-secondary">Application Status:</span>
                  <span className={`badge ${STATUS_BADGE_CLASSES[hasApplied] || 'bg-secondary'} fs-6 px-3 py-2`}>
                    {STATUS_TEXTS[hasApplied] || hasApplied}
                  </span>
                  {hasApplied === 'applied' && (
                    <Link to="/student/applications" className="btn btn-link ms-3">
                      Withdraw or manage application
                    </Link>
                  )}
                </div>
              ) : resumeChecked && !resumeUrl ? (
                <div className="alert alert-warning mb-0 p-3 shadow-sm rounded border">
                  <h5 className="alert-heading h6 fw-semibold mb-2">
                    <i className="bi bi-exclamation-triangle-fill me-2" aria-hidden="true" />
                    Resume Required
                  </h5>
                  <p className="mb-2 small text-dark">
                    You must upload a resume (PDF or DOCX, max 5MB) before you can apply to this internship.
                  </p>
                  <div className="d-flex align-items-center gap-2">
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      className="form-control form-control-sm"
                      style={{ maxWidth: '300px' }}
                      onChange={handleResumeUpload}
                      disabled={isUploadingResume}
                    />
                    {isUploadingResume && (
                      <span className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true" />
                    )}
                  </div>
                  {resumeUploadError && (
                    <div className="text-danger small mt-2 fw-medium">{resumeUploadError}</div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={handleApplyClick}
                >
                  Apply Now
                </button>
              )}
            </div>
          ) : isAuthenticated ? (
            <AlertMessage
              type="info"
              message="Only student accounts can apply to internships."
              onClose={() => {}}
            />
          ) : (
            <div>
              <p className="mb-2">Sign in as a student to apply for this internship.</p>
              <Link to="/login" className="btn btn-primary">
                Log In to Apply
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Application Form Modal */}
      {showApplyModal && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <form onSubmit={handleApplySubmit}>
                <div className="modal-header">
                  <h5 className="modal-title">Apply to {internship.title}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowApplyModal(false)}
                    aria-label="Close"
                    disabled={isSubmitting}
                  />
                </div>
                <div className="modal-body">
                  {applicationError && (
                    <AlertMessage
                      type="danger"
                      message={applicationError}
                      onClose={() => setApplicationError(null)}
                    />
                  )}

                  <div className="mb-3">
                    <label htmlFor="coverLetter" className="form-label fw-medium">
                      Cover Letter <span className="text-muted">(Optional)</span>
                    </label>
                    <textarea
                      id="coverLetter"
                      className="form-control"
                      rows="6"
                      maxLength="3000"
                      placeholder="Explain why you are a good fit for this role..."
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      disabled={isSubmitting}
                    />
                    <div className="form-text text-end">
                      {coverLetter.length} / 3000 characters
                    </div>
                  </div>

                  <p className="small text-muted mb-0">
                    <i className="bi bi-file-earmark-pdf me-1" aria-hidden="true" />
                    Your uploaded resume will be submitted automatically with this application.
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowApplyModal(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InternshipDetails;
