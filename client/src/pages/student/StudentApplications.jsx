import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import AlertMessage from '../../components/common/AlertMessage';
import Pagination from '../../components/common/Pagination';
import { getStudentApplications, withdrawApplication } from '../../services/applicationService';
import api from '../../services/api';
import { AUTH_TOKEN_KEY } from '../../context/AuthContext';

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

const PAGE_SIZE = 10;

function StudentApplications() {
  const [applications, setApplications] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedApplication, setSelectedApplication] = useState(null);

  // Resume states
  const [resumeUrl, setResumeUrl] = useState(null);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeError, setResumeError] = useState(null);

  // Resolve server base origin for resume links
  const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const serverOrigin = apiBaseUrl.replace('/api/v1', '');

  const fetchResumeInfo = useCallback(async () => {
    try {
      const response = await api.get('/students/profile');
      setResumeUrl(response.data.data.resumeUrl);
    } catch (err) {
      console.error('Failed to load resume info:', err);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setAlert(null);
    try {
      const response = await getStudentApplications({
        status: statusFilter || undefined,
        page,
        limit: PAGE_SIZE,
        sort: '-appliedAt',
      });
      setApplications(response.items);
      setMeta(response.meta || { page: 1, totalPages: 1 });
    } catch (error) {
      setAlert({ type: 'danger', message: error.message || 'Failed to load application history' });
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchApplications();
    fetchResumeInfo();
  }, [fetchApplications, fetchResumeInfo]);

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingResume(true);
    setResumeError(null);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const response = await api.post('/students/resume', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setResumeUrl(response.data.data.resumeUrl);
      setAlert({ type: 'success', message: 'Resume uploaded successfully' });
    } catch (err) {
      setResumeError(err.message || 'Failed to upload resume');
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleResumeDelete = async () => {
    const confirmed = window.confirm('Are you sure you want to delete your current resume?');
    if (!confirmed) return;

    setResumeError(null);
    try {
      await api.delete('/students/resume');
      setResumeUrl(null);
      setAlert({ type: 'success', message: 'Resume deleted successfully' });
    } catch (err) {
      setResumeError(err.message || 'Failed to delete resume');
    }
  };

  const handleWithdraw = async (applicationId, title) => {
    const confirmed = window.confirm(`Are you sure you want to withdraw your application for "${title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await withdrawApplication(applicationId);
      setAlert({ type: 'success', message: 'Application withdrawn successfully' });
      await fetchApplications();
    } catch (error) {
      setAlert({ type: 'danger', message: error.message || 'Failed to withdraw application' });
    }
  };

  const handleViewCoverLetter = (app) => {
    setSelectedApplication(app);
  };

  function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatStipend(stipend) {
    if (stipend === undefined || stipend === null || stipend === 0) return 'Unpaid';
    return `₹${stipend.toLocaleString('en-IN')} / month`;
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Applications</h2>
      </div>

      {alert && (
        <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
      )}

      {/* Resume Management Section */}
      {resumeUrl ? (
        <div className="card shadow-sm mb-4">
          <div className="card-body d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
              <h5 className="card-title h6 fw-semibold mb-1">
                <i className="bi bi-file-earmark-pdf text-danger me-2" aria-hidden="true" />
                My Resume
              </h5>
              <p className="card-text small text-muted mb-0">
                Your resume is uploaded and ready for internship applications.
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              <a
                href={`${serverOrigin}${resumeUrl}?token=${encodeURIComponent(token)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center"
              >
                <i className="bi bi-eye me-1" aria-hidden="true" />
                View Resume
              </a>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center"
                onClick={handleResumeDelete}
              >
                <i className="bi bi-trash me-1" aria-hidden="true" />
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card shadow-sm mb-4 border-warning bg-light-subtle">
          <div className="card-body">
            <h5 className="card-title h6 fw-semibold text-warning mb-1">
              <i className="bi bi-exclamation-triangle-fill me-2" aria-hidden="true" />
              No Resume Uploaded
            </h5>
            <p className="card-text small text-muted mb-3">
              You must upload a resume (PDF or DOCX, max 5MB) before you can apply to any internship.
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
            {resumeError && (
              <div className="text-danger small mt-2 fw-medium">{resumeError}</div>
            )}
          </div>
        </div>
      )}

      <div className="row g-2 mb-4 align-items-center">
        <div className="col-md-4">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="applied">Applied</option>
            <option value="under_review">Under Review</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Not Selected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <Loader label="Loading application history..." />
      ) : applications.length === 0 ? (
        <div className="card text-center p-5 shadow-sm bg-light">
          <div className="card-body">
            <i className="bi bi-file-earmark-text text-muted fs-1 mb-3" aria-hidden="true" />
            <h5 className="text-secondary">No applications found</h5>
            <p className="text-muted">You have not submitted any applications yet.</p>
            <Link to="/internships" className="btn btn-primary mt-2">
              Browse Internships
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="table-responsive shadow-sm rounded border bg-white">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Internship Title</th>
                  <th>Company</th>
                  <th>Applied Date</th>
                  <th>Stipend</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <span className="fw-semibold text-dark">{app.internship.title}</span>
                      <br />
                      <small className="text-muted">
                        <i className="bi bi-geo-alt me-1" aria-hidden="true" />
                        {app.internship.location}
                      </small>
                    </td>
                    <td>{app.internship.companyName}</td>
                    <td>{formatDate(app.appliedAt)}</td>
                    <td>{formatStipend(app.internship.stipend)}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE_CLASSES[app.status] || 'bg-secondary'} px-2 py-1`}>
                        {STATUS_TEXTS[app.status] || app.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          type="button"
                          className="btn btn-outline-primary"
                          onClick={() => handleViewCoverLetter(app)}
                        >
                          Cover Letter
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          disabled={app.status !== 'applied'}
                          onClick={() => handleWithdraw(app.id, app.internship.title)}
                          title={app.status !== 'applied' ? 'Only applications with status "Applied" can be withdrawn' : ''}
                        >
                          Withdraw
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <Pagination
              currentPage={meta.page || 1}
              totalPages={meta.totalPages || 1}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      {/* Cover Letter Modal */}
      {selectedApplication && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cover Letter for {selectedApplication.internship.title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedApplication(null)}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <p className="fw-medium mb-1 text-secondary">Submitted Cover Letter:</p>
                <div className="p-3 bg-light rounded border text-pre-wrap" style={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
                  {selectedApplication.coverLetter || <em className="text-muted">No cover letter was submitted with this application.</em>}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setSelectedApplication(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentApplications;
