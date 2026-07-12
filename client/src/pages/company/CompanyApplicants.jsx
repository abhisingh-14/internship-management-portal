import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import AlertMessage from '../../components/common/AlertMessage';
import Pagination from '../../components/common/Pagination';
import { getMyInternships } from '../../services/internshipService';
import {
  getCompanyApplicants,
  getInternshipApplications,
  updateApplicationStatus,
} from '../../services/applicationService';
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

function CompanyApplicants() {
  const { internshipId } = useParams();
  const navigate = useNavigate();

  const [applicants, setApplicants] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [postings, setPostings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [alert, setAlert] = useState(null);

  // Filter States
  const [selectedPostingId, setSelectedPostingId] = useState(internshipId || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const [selectedApplicant, setSelectedApplicant] = useState(null);

  // Resolve server base origin for resume links
  const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const serverOrigin = apiBaseUrl.replace('/api/v1', '');

  // Fetch postings to populate the dropdown
  useEffect(() => {
    async function fetchPostings() {
      try {
        const response = await getMyInternships({ limit: 100 });
        setPostings(response.data || []);
      } catch (err) {
        console.error('Failed to load company postings for filters:', err);
      }
    }
    fetchPostings();
  }, []);

  // Update selectedPostingId if route parameter changes
  useEffect(() => {
    if (internshipId) {
      setSelectedPostingId(internshipId);
    }
  }, [internshipId]);

  const fetchApplicants = useCallback(async () => {
    setIsLoading(true);
    setAlert(null);
    try {
      let response;
      const filters = {
        status: statusFilter || undefined,
        page,
        limit: PAGE_SIZE,
        sort: '-appliedAt',
      };

      if (selectedPostingId) {
        response = await getInternshipApplications(selectedPostingId, filters);
      } else {
        response = await getCompanyApplicants(filters);
      }

      setApplicants(response.items || []);
      setMeta(response.meta || { page: 1, totalPages: 1 });
    } catch (error) {
      setAlert({ type: 'danger', message: error.message || 'Failed to load applicants list' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedPostingId, statusFilter, page]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  const handlePostingChange = (e) => {
    const value = e.target.value;
    setSelectedPostingId(value);
    setPage(1);
    if (value) {
      navigate(`/company/postings/${value}/applicants`);
    } else {
      navigate('/company/applicants');
    }
  };

  const handleStatusUpdate = async (applicationId, targetStatus) => {
    setIsUpdating(true);
    setAlert(null);
    try {
      await updateApplicationStatus(applicationId, targetStatus);
      setAlert({ type: 'success', message: `Application status updated to ${STATUS_TEXTS[targetStatus]}` });
      await fetchApplicants();
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Failed to update status' });
    } finally {
      setIsUpdating(false);
    }
  };

  const canTransitionTo = (currentStatus, targetStatus) => {
    const transitions = {
      applied: ['under_review', 'shortlisted', 'accepted', 'rejected'],
      under_review: ['shortlisted', 'accepted', 'rejected'],
      shortlisted: ['accepted', 'rejected'],
      accepted: [],
      rejected: [],
      withdrawn: [],
    };
    return (transitions[currentStatus] || []).includes(targetStatus);
  };

  function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Applicant Management</h2>
      </div>

      {alert && (
        <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
      )}

      {/* Filter Row */}
      <div className="row g-2 mb-4">
        <div className="col-md-6">
          <label className="form-label small fw-semibold text-muted">Filter by Posting</label>
          <select
            className="form-select"
            value={selectedPostingId}
            onChange={handlePostingChange}
          >
            <option value="">All Postings</option>
            {postings.map((post) => (
              <option key={post.id} value={post.id}>
                {post.title} ({post.location})
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label small fw-semibold text-muted">Filter by Status</label>
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
        <Loader label="Loading applicants..." />
      ) : applicants.length === 0 ? (
        <div className="card text-center p-5 shadow-sm bg-light">
          <div className="card-body">
            <i className="bi bi-people text-muted fs-1 mb-3" aria-hidden="true" />
            <h5 className="text-secondary">No applicants found</h5>
            <p className="text-muted">There are no applications matching the selected filters.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="table-responsive shadow-sm rounded border bg-white">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Candidate</th>
                  <th>Posting</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                  <th>Materials</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((app) => (
                  <tr key={app.id}>
                    <td>
                      <span className="fw-semibold text-dark">{app.student.name}</span>
                      <br />
                      <small className="text-muted">{app.student.email}</small>
                      {app.student.bio && (
                        <div className="small text-muted text-truncate" style={{ maxWidth: '250px' }}>
                          {app.student.bio}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="fw-medium">{app.internship.title}</span>
                    </td>
                    <td>{formatDate(app.appliedAt)}</td>
                    <td>
                      <span className={`badge ${STATUS_BADGE_CLASSES[app.status] || 'bg-secondary'} px-2 py-1`}>
                        {STATUS_TEXTS[app.status] || app.status}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1 align-items-start">
                        {app.student.resumeUrl ? (
                          <a
                            href={`${serverOrigin}${app.student.resumeUrl}?token=${encodeURIComponent(token)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-link btn-sm p-0 d-inline-flex align-items-center"
                          >
                            <i className="bi bi-file-earmark-pdf me-1" aria-hidden="true" />
                            Resume
                          </a>
                        ) : (
                          <span className="text-muted small">No Resume</span>
                        )}
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0 d-inline-flex align-items-center text-decoration-none"
                          onClick={() => setSelectedApplicant(app)}
                        >
                          <i className="bi bi-chat-left-text me-1" aria-hidden="true" />
                          Cover Letter
                        </button>
                      </div>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1">
                        {canTransitionTo(app.status, 'under_review') && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-info"
                            disabled={isUpdating}
                            onClick={() => handleStatusUpdate(app.id, 'under_review')}
                          >
                            Review
                          </button>
                        )}
                        {canTransitionTo(app.status, 'shortlisted') && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-warning"
                            disabled={isUpdating}
                            onClick={() => handleStatusUpdate(app.id, 'shortlisted')}
                          >
                            Shortlist
                          </button>
                        )}
                        {canTransitionTo(app.status, 'accepted') && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            disabled={isUpdating}
                            onClick={() => handleStatusUpdate(app.id, 'accepted')}
                          >
                            Accept
                          </button>
                        )}
                        {canTransitionTo(app.status, 'rejected') && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            disabled={isUpdating}
                            onClick={() => handleStatusUpdate(app.id, 'rejected')}
                          >
                            Reject
                          </button>
                        )}
                        {!canTransitionTo(app.status, 'under_review') &&
                          !canTransitionTo(app.status, 'shortlisted') &&
                          !canTransitionTo(app.status, 'accepted') &&
                          !canTransitionTo(app.status, 'rejected') && (
                            <span className="text-muted small">Evaluated</span>
                          )}
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
      {selectedApplicant && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cover Letter from {selectedApplicant.student.name}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedApplicant(null)}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <p className="fw-medium mb-1 text-secondary">
                  Applied for: <span className="text-dark">{selectedApplicant.internship.title}</span>
                </p>
                <div className="p-3 bg-light rounded border text-pre-wrap" style={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
                  {selectedApplicant.coverLetter || <em className="text-muted">No cover letter was submitted with this application.</em>}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setSelectedApplicant(null)}
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

export default CompanyApplicants;
