import { useEffect, useState, useCallback, Fragment } from 'react';
import * as adminService from '../../services/adminService';

const STATUS_BADGE = {
  applied: 'bg-primary',
  under_review: 'bg-info text-dark',
  shortlisted: 'bg-warning text-dark',
  accepted: 'bg-success',
  rejected: 'bg-danger',
  withdrawn: 'bg-secondary',
};

const APPLICATION_STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'applied', label: 'Applied' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Expanded detail
  const [expandedId, setExpandedId] = useState(null);

  const loadApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Re-use the admin users endpoint with role=student to then show their applications.
      // The admin applications endpoint fetches all applications platform-wide.
      const data = await adminService.fetchAllApplications({
        status: statusFilter || undefined,
        page,
        limit: 15,
      });
      setApplications(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(err.message || 'Failed to load applications');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h1 className="h3 mb-1 fw-bold text-dark">View Applications</h1>
          <p className="text-secondary mb-0">
            Browse all internship applications submitted across the platform.
          </p>
        </div>

        {/* Status filter */}
        <div className="d-flex align-items-center gap-2">
          <label htmlFor="appStatusFilter" className="form-label mb-0 text-nowrap small fw-semibold">
            Status:
          </label>
          <select
            id="appStatusFilter"
            className="form-select form-select-sm"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            style={{ minWidth: '140px' }}
          >
            {APPLICATION_STATUS_FILTERS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {meta && (
        <div className="mb-3 small text-secondary">
          Showing <strong>{applications.length}</strong> of <strong>{meta.totalItems}</strong> applications
        </div>
      )}

      {/* Main content */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger m-3" role="alert">{error}</div>
          ) : applications.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <i className="bi bi-inbox fs-1 d-block mb-2" aria-hidden="true" />
              No applications found matching the current filter.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Student</th>
                    <th scope="col">Internship</th>
                    <th scope="col">Company</th>
                    <th scope="col">Applied On</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-end">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, idx) => (
                    // key belongs on Fragment, not on the inner <tr>
                    <Fragment key={app.id}>
                      <tr>
                        <td className="text-secondary small">{((page - 1) * 15) + idx + 1}</td>
                        <td>
                          <span className="fw-semibold text-dark d-block">{app.studentName}</span>
                          <small className="text-muted">{app.studentEmail}</small>
                        </td>
                        <td style={{ maxWidth: '220px' }}>
                          <span className="text-truncate d-block small fw-semibold">{app.internshipTitle}</span>
                        </td>
                        <td className="small">{app.companyName}</td>
                        <td className="small">{new Date(app.appliedAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${STATUS_BADGE[app.status] || 'bg-secondary'}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={() => toggleExpand(app.id)}
                            aria-expanded={expandedId === app.id}
                          >
                            <i
                              className={`bi ${expandedId === app.id ? 'bi-chevron-up' : 'bi-chevron-down'}`}
                              aria-hidden="true"
                            />
                          </button>
                        </td>
                      </tr>

                      {/* Expanded details row */}
                      {expandedId === app.id && (
                        <tr className="table-light">
                          <td colSpan="7" className="px-4 py-3">
                            <div className="row g-3">
                              <div className="col-md-6">
                                <span className="small fw-semibold text-secondary d-block mb-1">Cover Letter</span>
                                <p className="small mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                                  {app.coverLetter || <em className="text-muted">Not provided</em>}
                                </p>
                              </div>
                              <div className="col-md-6">
                                <span className="small fw-semibold text-secondary d-block mb-1">Resume</span>
                                {app.resumeUrl ? (
                                  <a
                                    href={app.resumeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-primary btn-sm"
                                  >
                                    <i className="bi bi-file-earmark-pdf me-1" aria-hidden="true" />
                                    View Resume
                                  </a>
                                ) : (
                                  <span className="text-muted small">Not uploaded</span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="card-footer bg-white border-top py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <span className="small text-secondary">
              Page <strong>{meta.page}</strong> of <strong>{meta.totalPages}</strong>
            </span>
            <nav aria-label="Applications pagination">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${meta.page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((p) => p - 1)} disabled={meta.page === 1}>
                    Previous
                  </button>
                </li>
                {[...Array(meta.totalPages).keys()].map((x) => (
                  <li key={x + 1} className={`page-item ${meta.page === x + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(x + 1)}>{x + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${meta.page === meta.totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage((p) => p + 1)} disabled={meta.page === meta.totalPages}>
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminApplications;
