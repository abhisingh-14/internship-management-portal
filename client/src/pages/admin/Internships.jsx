import { useEffect, useState, useCallback } from 'react';
import * as adminService from '../../services/adminService';
import { resolveFileUrl } from '../../utils/fileUrl';

const STATUS_BADGE = {
  published: 'bg-success',
  draft: 'bg-secondary',
  closed: 'bg-warning text-dark',
  flagged: 'bg-info text-dark',
  removed: 'bg-danger',
};

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'closed', label: 'Closed' },
  { value: 'flagged', label: 'Flagged' },
  { value: 'removed', label: 'Removed' },
];

const MODERATION_ACTIONS = {
  flagged: { label: 'Flag', btnClass: 'btn-warning', icon: 'bi-flag-fill' },
  removed: { label: 'Remove', btnClass: 'btn-danger', icon: 'bi-trash-fill' },
  restored: { label: 'Restore', btnClass: 'btn-success', icon: 'bi-arrow-counterclockwise' },
};

function AdminInternships() {
  const [internships, setInternships] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Filters & Pagination
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Modal state
  const [selectedInternship, setSelectedInternship] = useState(null);
  const [moderationAction, setModerationAction] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [modalError, setModalError] = useState('');

  const loadInternships = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.fetchInternships({
        status: statusFilter || undefined,
        page,
        limit: 10,
      });
      setInternships(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(err.message || 'Failed to load internship postings');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    loadInternships();
  }, [loadInternships]);

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleOpenModal = (internship, action) => {
    setSelectedInternship(internship);
    setModerationAction(action);
    setReasonText('');
    setModalError('');
  };

  const handleModerationSubmit = async () => {
    if (!selectedInternship || !moderationAction) return;

    if ((moderationAction === 'flagged' || moderationAction === 'removed') && !reasonText.trim()) {
      setModalError('A reason is required for this action.');
      return;
    }

    setSubmitLoading(true);
    setModalError('');
    try {
      await adminService.moderateInternship(selectedInternship.id, {
        action: moderationAction,
        reason: reasonText,
      });
      setSelectedInternship(null);
      await loadInternships();
    } catch (err) {
      setModalError(err.message || 'Failed to apply moderation action');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getAvailableActions = (status) => {
    if (status === 'flagged') return ['removed', 'restored'];
    if (status === 'removed') return ['restored'];
    if (status === 'published' || status === 'draft') return ['flagged', 'removed'];
    return ['removed'];
  };

  const currentActionConfig = moderationAction ? MODERATION_ACTIONS[moderationAction] : null;

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-3">
        <div>
          <h1 className="h3 mb-1 fw-bold text-dark">Manage Internships</h1>
          <p className="text-secondary mb-0">
            Review, flag, or remove internship postings to maintain platform quality.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <label htmlFor="statusFilter" className="form-label mb-0 text-nowrap small fw-semibold">
            Filter by Status:
          </label>
          <select
            id="statusFilter"
            className="form-select form-select-sm"
            value={statusFilter}
            onChange={handleFilterChange}
            style={{ minWidth: '150px' }}
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Stats summary */}
      {meta && (
        <div className="mb-3 small text-secondary">
          Showing <strong>{internships.length}</strong> of <strong>{meta.totalItems}</strong> total postings
        </div>
      )}

      {/* Table card */}
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
          ) : internships.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <i className="bi bi-briefcase fs-1 d-block mb-2" aria-hidden="true" />
              No internship postings match the current filters.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Internship</th>
                    <th scope="col">Company</th>
                    <th scope="col">Location</th>
                    <th scope="col">Deadline</th>
                    <th scope="col">Status</th>
                    <th scope="col" className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {internships.map((internship) => {
                    const availableActions = getAvailableActions(internship.status);
                    return (
                      <tr key={internship.id}>
                        <td style={{ maxWidth: '280px' }}>
                          <span className="fw-semibold text-dark d-block text-truncate">{internship.title}</span>
                          <small className="text-muted">
                            {internship.stipend ? `₹${Number(internship.stipend).toLocaleString()}/mo` : 'Unpaid'} &middot;{' '}
                            {internship.duration || 'N/A'}
                          </small>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {internship.companyLogoUrl ? (
                              <img
                                src={resolveFileUrl(internship.companyLogoUrl)}
                                alt=""
                                className="rounded bg-light"
                                style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                              />
                            ) : (
                              <div
                                className="rounded bg-secondary text-white d-flex align-items-center justify-content-center fw-bold"
                                style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}
                              >
                                {internship.companyName?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="small">{internship.companyName}</span>
                          </div>
                        </td>
                        <td className="small">{internship.location || '—'}</td>
                        <td className="small">
                          {internship.applicationDeadline
                            ? new Date(internship.applicationDeadline).toLocaleDateString()
                            : '—'}
                        </td>
                        <td>
                          <span className={`badge ${STATUS_BADGE[internship.status] || 'bg-secondary'}`}>
                            {internship.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-flex gap-1 justify-content-end">
                            {availableActions.map((action) => (
                              <button
                                key={action}
                                type="button"
                                className={`btn btn-sm ${MODERATION_ACTIONS[action].btnClass}`}
                                onClick={() => handleOpenModal(internship, action)}
                                disabled={submitLoading}
                                title={MODERATION_ACTIONS[action].label}
                              >
                                <i className={`bi ${MODERATION_ACTIONS[action].icon}`} aria-hidden="true" />
                                <span className="ms-1 d-none d-xl-inline">{MODERATION_ACTIONS[action].label}</span>
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
            <nav aria-label="Internships pagination">
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

      {/* Moderation Confirmation Modal */}
      {selectedInternship && currentActionConfig && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div
                className={`modal-header ${
                  moderationAction === 'restored'
                    ? 'bg-success text-white'
                    : moderationAction === 'flagged'
                    ? 'bg-warning text-dark'
                    : 'bg-danger text-white'
                }`}
              >
                <h5 className="modal-title fw-bold">
                  <i className={`bi ${currentActionConfig.icon} me-2`} aria-hidden="true" />
                  {currentActionConfig.label} Internship Posting
                </h5>
                <button
                  type="button"
                  className={`btn-close ${moderationAction !== 'flagged' ? 'btn-close-white' : ''}`}
                  onClick={() => setSelectedInternship(null)}
                  aria-label="Close"
                />
              </div>
              <div className="modal-body">
                <p>
                  You are about to <strong>{moderationAction}</strong> the internship posting:{' '}
                  <strong>&ldquo;{selectedInternship.title}&rdquo;</strong> by{' '}
                  <strong>{selectedInternship.companyName}</strong>.
                </p>
                {moderationAction !== 'restored' && (
                  <div className="mb-3">
                    <label htmlFor="moderationReason" className="form-label small fw-semibold">
                      Reason <span className="text-danger">*</span>
                    </label>
                    <textarea
                      id="moderationReason"
                      className="form-control"
                      rows="3"
                      placeholder="Describe why this action is being taken. This reason will be sent to the company..."
                      value={reasonText}
                      onChange={(e) => setReasonText(e.target.value)}
                    />
                  </div>
                )}
                {moderationAction === 'restored' && (
                  <div className="alert alert-success py-2 small">
                    <i className="bi bi-info-circle-fill me-2" aria-hidden="true" />
                    Restoring this posting will set its status back to <strong>published</strong> and notify the company.
                  </div>
                )}
                {modalError && <div className="text-danger small mt-2">{modalError}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedInternship(null)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn ${currentActionConfig.btnClass}`}
                  onClick={handleModerationSubmit}
                  disabled={
                    submitLoading ||
                    (moderationAction !== 'restored' && !reasonText.trim())
                  }
                >
                  {submitLoading && (
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                  )}
                  Confirm {currentActionConfig.label}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInternships;
