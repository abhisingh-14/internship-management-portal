import { useCallback, useEffect, useState } from 'react';
import * as adminService from '../../services/adminService';
import { resolveFileUrl } from '../../utils/fileUrl';

function AdminCompanies() {
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Modal State
  const [selectedCompany, setSelectedCompany] = useState(null); // company
  const [decisionType, setDecisionType] = useState(''); // 'approved' or 'rejected'
  const [reasonText, setReasonText] = useState('');
  const [modalError, setModalError] = useState('');

  const loadPending = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.fetchPendingCompanies({
        page,
        limit: 10,
      });
      setPendingCompanies(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load pending registrations');
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const handleOpenModal = (company, decision) => {
    setSelectedCompany(company);
    setDecisionType(decision);
    setReasonText('');
    setModalError('');
  };

  const handleDecisionSubmit = async () => {
    if (!selectedCompany || !decisionType) return;
    
    if (decisionType === 'rejected' && !reasonText.trim()) {
      setModalError('Rejection reason is required');
      return;
    }

    setSubmitLoading(true);
    setModalError('');
    try {
      await adminService.approveCompany(selectedCompany.companyId, {
        decision: decisionType,
        reason: reasonText,
      });
      // Close modal
      setSelectedCompany(null);
      // Reload queue
      await loadPending();
    } catch (err) {
      console.error(err);
      setModalError(err.message || 'Failed to submit decision');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Title */}
      <div className="mb-4">
        <h1 className="h3 mb-1 fw-bold text-dark">Verify Companies</h1>
        <p className="text-secondary">Approve or reject new company profiles to control which accounts can post internships.</p>
      </div>

      {/* Main Listing */}
      <div className="card border-0 shadow-sm">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger m-3" role="alert">
              {error}
            </div>
          ) : pendingCompanies.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <i className="bi bi-shield-check text-success fs-1 mb-2 d-block" aria-hidden="true" />
              All company profiles have been verified. No pending items in the queue!
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Company Info</th>
                    <th scope="col">Industry</th>
                    <th scope="col">Contact</th>
                    <th scope="col">Website</th>
                    <th scope="col">Registered</th>
                    <th scope="col" className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCompanies.map((company) => (
                    <tr key={company.companyId}>
                      <td>
                        <div className="d-flex align-items-center">
                          {company.logoUrl ? (
                            <img src={resolveFileUrl(company.logoUrl)} alt="Logo" className="rounded-circle me-3 bg-light" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                          ) : (
                            <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-3" style={{ width: '40px', height: '40px', fontSize: '1rem', fontWeight: 'bold' }}>
                              {company.companyName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <span className="fw-semibold text-dark d-block">{company.companyName}</span>
                            <small className="text-muted text-truncate d-inline-block" style={{ maxWidth: '300px' }}>
                              {company.description || 'No description provided.'}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>{company.industry || '-'}</td>
                      <td>
                        <div>{company.contactName}</div>
                        <small className="text-secondary">{company.contactEmail}</small>
                      </td>
                      <td>
                        {company.website ? (
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                            {company.website.replace(/^https?:\/\//, '')}
                          </a>
                        ) : (
                          <span className="text-secondary">-</span>
                        )}
                      </td>
                      <td>{new Date(company.registeredAt).toLocaleDateString()}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-success btn-sm me-2"
                          onClick={() => handleOpenModal(company, 'approved')}
                          disabled={submitLoading}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleOpenModal(company, 'rejected')}
                          disabled={submitLoading}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="card-footer bg-white border-top py-3 d-flex justify-content-between align-items-center">
            <span className="small text-secondary">
              Showing page <strong>{meta.page}</strong> of <strong>{meta.totalPages}</strong> (Total {meta.totalItems} pending registrations)
            </span>
            <nav aria-label="Pending companies pagination">
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${meta.page === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p => p - 1)} disabled={meta.page === 1}>Previous</button>
                </li>
                {[...Array(meta.totalPages).keys()].map(x => (
                  <li key={x + 1} className={`page-item ${meta.page === x + 1 ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => setPage(x + 1)}>{x + 1}</button>
                  </li>
                ))}
                <li className={`page-item ${meta.page === meta.totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => setPage(p => p + 1)} disabled={meta.page === meta.totalPages}>Next</button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      {/* Approve/Reject Confirmation Modal */}
      {selectedCompany && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className={`modal-header ${decisionType === 'approved' ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                <h5 className="modal-title fw-bold">
                  {decisionType === 'approved' ? 'Approve Company Verification' : 'Reject Company Verification'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedCompany(null)} aria-label="Close" />
              </div>
              <div className="modal-body">
                <p>
                  Are you sure you want to <strong>{decisionType === 'approved' ? 'APPROVE' : 'REJECT'}</strong> the company profile verification request for <strong>{selectedCompany.companyName}</strong>?
                </p>

                {decisionType === 'approved' ? (
                  <div className="alert alert-success py-2 small">
                    <i className="bi bi-info-circle-fill me-2" aria-hidden="true" />
                    Once approved, the company will receive a notification and will be immediately allowed to post new internship opportunities.
                  </div>
                ) : (
                  <div className="mb-3">
                    <label htmlFor="reasonField" className="form-label small fw-semibold">Rejection Reason (Required)</label>
                    <textarea
                      id="reasonField"
                      className="form-control"
                      rows="4"
                      placeholder="Please details the reasons why this verification is being rejected, which will be sent to the company..."
                      value={reasonText}
                      onChange={(e) => setReasonText(e.target.value)}
                    />
                  </div>
                )}
                {modalError && <div className="text-danger small">{modalError}</div>}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedCompany(null)}>Cancel</button>
                <button
                  type="button"
                  className={`btn ${decisionType === 'approved' ? 'btn-success' : 'btn-danger'}`}
                  onClick={handleDecisionSubmit}
                  disabled={submitLoading || (decisionType === 'rejected' && !reasonText.trim())}
                >
                  {decisionType === 'approved' ? 'Confirm Approval' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminCompanies;
