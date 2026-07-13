import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as adminService from '../../services/adminService';
import { getNotifications } from '../../services/notificationService';
import { resolveFileUrl } from '../../utils/fileUrl';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Rejection modal state
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, pendingData, notifData] = await Promise.all([
        adminService.fetchPlatformAnalytics(),
        adminService.fetchPendingCompanies({ limit: 5 }),
        getNotifications({ page: 1, limit: 5 }),
      ]);
      setStats(statsData);
      setPendingCompanies(pendingData.data);
      setRecentNotifications(notifData.items);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproval = async (companyId, decision, reason = '') => {
    setSubmitLoading(true);
    setRejectError('');
    try {
      await adminService.approveCompany(companyId, { decision, reason });
      // Reload stats and list
      const statsData = await adminService.fetchPlatformAnalytics();
      setStats(statsData);
      const pendingData = await adminService.fetchPendingCompanies({ limit: 5 });
      setPendingCompanies(pendingData.data);
      // Close modal if open
      setSelectedCompany(null);
      setRejectReason('');
    } catch (err) {
      console.error(err);
      if (decision === 'rejected') {
        setRejectError(err.message || 'Failed to reject company');
      } else {
        alert(err.message || 'Failed to approve company');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container-fluid py-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2" aria-hidden="true" />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      {/* Title */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1 fw-bold text-dark">Admin Dashboard</h1>
          <p className="text-secondary mb-0">Overview of platform status, moderation queues, and statistics.</p>
        </div>
        <button className="btn btn-outline-primary btn-sm d-flex align-items-center" onClick={loadData}>
          <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="row g-4 mb-5">
          {/* Total Students */}
          <div className="col-12 col-sm-6 col-md-4 col-xl-2">
            <div className="card border-0 shadow-sm h-100 bg-primary-subtle text-primary-emphasis">
              <div className="card-body d-flex flex-column justify-content-between p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="fw-semibold small text-uppercase">Students</span>
                  <div className="bg-white rounded p-2 text-primary">
                    <i className="bi bi-people fs-4" aria-hidden="true" />
                  </div>
                </div>
                <div>
                  <h2 className="display-6 fw-bold mb-0">{stats.totalStudents}</h2>
                  <Link to="/admin/users?role=student" className="small text-decoration-none text-primary-emphasis fw-medium d-block mt-2">
                    Manage Students &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Total Companies */}
          <div className="col-12 col-sm-6 col-md-4 col-xl-2">
            <div className="card border-0 shadow-sm h-100 bg-success-subtle text-success-emphasis">
              <div className="card-body d-flex flex-column justify-content-between p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="fw-semibold small text-uppercase">Companies</span>
                  <div className="bg-white rounded p-2 text-success">
                    <i className="bi bi-building fs-4" aria-hidden="true" />
                  </div>
                </div>
                <div>
                  <h2 className="display-6 fw-bold mb-0">{stats.totalCompanies}</h2>
                  <Link to="/admin/users?role=company" className="small text-decoration-none text-success-emphasis fw-medium d-block mt-2">
                    Manage Companies &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="col-12 col-sm-6 col-md-4 col-xl-2">
            <div className="card border-0 shadow-sm h-100 bg-warning-subtle text-warning-emphasis">
              <div className="card-body d-flex flex-column justify-content-between p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="fw-semibold small text-uppercase">Pending Verify</span>
                  <div className="bg-white rounded p-2 text-warning">
                    <i className="bi bi-shield-exclamation fs-4" aria-hidden="true" />
                  </div>
                </div>
                <div>
                  <h2 className="display-6 fw-bold mb-0">{stats.pendingCompanyApprovals}</h2>
                  <Link to="/admin/companies" className="small text-decoration-none text-warning-emphasis fw-medium d-block mt-2">
                    Verify Queue &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Active Postings */}
          <div className="col-12 col-sm-6 col-md-4 col-xl-2">
            <div className="card border-0 shadow-sm h-100 bg-info-subtle text-info-emphasis">
              <div className="card-body d-flex flex-column justify-content-between p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="fw-semibold small text-uppercase">Active Jobs</span>
                  <div className="bg-white rounded p-2 text-info">
                    <i className="bi bi-briefcase fs-4" aria-hidden="true" />
                  </div>
                </div>
                <div>
                  <h2 className="display-6 fw-bold mb-0">{stats.activeInternships}</h2>
                  <Link to="/admin/internships?status=published" className="small text-decoration-none text-info-emphasis fw-medium d-block mt-2">
                    Moderate Jobs &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Total Postings (All statuses) */}
          <div className="col-12 col-sm-6 col-md-4 col-xl-2">
            <div className="card border-0 shadow-sm h-100 bg-secondary-subtle text-secondary-emphasis">
              <div className="card-body d-flex flex-column justify-content-between p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="fw-semibold small text-uppercase">Total Jobs</span>
                  <div className="bg-white rounded p-2 text-secondary">
                    <i className="bi bi-file-post fs-4" aria-hidden="true" />
                  </div>
                </div>
                <div>
                  <h2 className="display-6 fw-bold mb-0">{stats.totalInternships}</h2>
                  <Link to="/admin/internships" className="small text-decoration-none text-secondary-emphasis fw-medium d-block mt-2">
                    View All Jobs &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Total Applications */}
          <div className="col-12 col-sm-6 col-md-4 col-xl-2">
            <div className="card border-0 shadow-sm h-100 bg-danger-subtle text-danger-emphasis">
              <div className="card-body d-flex flex-column justify-content-between p-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <span className="fw-semibold small text-uppercase">Applications</span>
                  <div className="bg-white rounded p-2 text-danger">
                    <i className="bi bi-file-earmark-text fs-4" aria-hidden="true" />
                  </div>
                </div>
                <div>
                  <h2 className="display-6 fw-bold mb-0">{stats.totalApplications}</h2>
                  <Link to="/admin/applications" className="small text-decoration-none text-danger-emphasis fw-medium d-block mt-2">
                    View Applications &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Approvals Summary */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <h2 className="h5 mb-0 fw-bold text-dark">Company Registrations Awaiting Verification</h2>
          <Link to="/admin/companies" className="btn btn-primary btn-sm">
            View Verification Queue
          </Link>
        </div>
        <div className="card-body p-0">
          {pendingCompanies.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <i className="bi bi-check-circle text-success fs-1 mb-2 d-block" aria-hidden="true" />
              No company profiles are pending verification.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Company Name</th>
                    <th scope="col">Contact Person</th>
                    <th scope="col">Website</th>
                    <th scope="col">Registered Date</th>
                    <th scope="col" className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCompanies.map((company) => (
                    <tr key={company.companyId}>
                      <td>
                        <div className="d-flex align-items-center">
                          {company.logoUrl ? (
                            <img src={resolveFileUrl(company.logoUrl)} alt="Logo" className="rounded-circle me-2 bg-light" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
                          ) : (
                            <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                              {company.companyName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="fw-semibold">{company.companyName}</span>
                        </div>
                      </td>
                      <td>
                        <div>{company.contactName}</div>
                        <small className="text-secondary">{company.contactEmail}</small>
                      </td>
                      <td>
                        {company.website ? (
                          <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-decoration-none text-truncate d-inline-block" style={{ maxWidth: '150px' }}>
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
                          onClick={() => handleApproval(company.companyId, 'approved')}
                          disabled={submitLoading}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => setSelectedCompany(company)}
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
      </div>

      {/* Rejection Reason Modal */}
      {selectedCompany && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Reject Company Profile</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedCompany(null)} aria-label="Close" />
              </div>
              <div className="modal-body">
                <p>Please provide a reason for rejecting the registration of <strong>{selectedCompany.companyName}</strong>.</p>
                <div className="mb-3">
                  <label htmlFor="rejectReasonText" className="form-label">Rejection Reason</label>
                  <textarea
                    id="rejectReasonText"
                    className="form-control"
                    rows="4"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter details on why this company profile is not accepted (e.g., incomplete description, invalid website)..."
                  />
                  {rejectError && <div className="text-danger small mt-2">{rejectError}</div>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedCompany(null)}>Cancel</button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleApproval(selectedCompany.companyId, 'rejected', rejectReason)}
                  disabled={submitLoading || !rejectReason.trim()}
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Notifications */}
      <div className="card border-0 shadow-sm mt-5">
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <h2 className="h5 mb-0 fw-bold text-dark">Recent Notifications</h2>
          <Link to="/notifications" className="btn btn-outline-secondary btn-sm">
            View All
          </Link>
        </div>
        <div className="card-body p-0">
          {recentNotifications.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <i className="bi bi-bell-slash fs-2 mb-2 d-block" aria-hidden="true" />
              No notifications yet.
            </div>
          ) : (
            <ul className="list-group list-group-flush">
              {recentNotifications.map((notif) => (
                <li
                  key={notif.id}
                  className={`list-group-item px-4 py-3 ${!notif.isRead ? 'border-start border-4 border-primary' : ''}`}
                >
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <p className={`mb-0 small flex-grow-1 ${!notif.isRead ? 'fw-semibold' : ''}`}>
                      {notif.message}
                    </p>
                    <span className="text-muted small flex-shrink-0">
                      {new Date(notif.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
