import { useCallback, useEffect, useState } from 'react';
import * as adminService from '../../services/adminService';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Pagination & Filtering state
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchVal, setSearchVal] = useState('');
  const [querySearch, setQuerySearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Modals/Alert States
  const [confirmUserStatus, setConfirmUserStatus] = useState(null); // { user, newStatus }
  const [confirmUserDelete, setConfirmUserDelete] = useState(null); // user

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.fetchUsers({
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        search: querySearch || undefined,
        page,
        limit: 10,
      });
      setUsers(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [roleFilter, statusFilter, querySearch, page]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setQuerySearch(searchVal);
    setPage(1);
  };

  const handleClearFilters = () => {
    setRoleFilter('');
    setStatusFilter('');
    setSearchVal('');
    setQuerySearch('');
    setPage(1);
  };

  const handleStatusChangeSubmit = async () => {
    if (!confirmUserStatus) return;
    const { user, newStatus } = confirmUserStatus;
    setSubmitLoading(true);
    try {
      await adminService.updateUserStatus(user.id, newStatus);
      // Reload current list
      await loadUsers();
      setConfirmUserStatus(null);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to update user status');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!confirmUserDelete) return;
    const { id } = confirmUserDelete;
    setSubmitLoading(true);
    try {
      await adminService.deleteUser(id);
      // Reload current list
      await loadUsers();
      setConfirmUserDelete(null);
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to delete user');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="container-fluid py-4">
      {/* Title */}
      <div className="mb-4">
        <h1 className="h3 mb-1 fw-bold text-dark">Manage Users</h1>
        <p className="text-secondary">View and moderate all student and company accounts registered on the platform.</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <form onSubmit={handleSearchSubmit} className="row g-3 align-items-end">
            <div className="col-12 col-md-4">
              <label htmlFor="searchVal" className="form-label small fw-semibold">Search User</label>
              <div className="input-group">
                <input
                  type="text"
                  id="searchVal"
                  className="form-control"
                  placeholder="Search by name, email, company..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                />
                <button className="btn btn-primary" type="submit">Search</button>
              </div>
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <label htmlFor="roleFilter" className="form-label small fw-semibold">Filter by Role</label>
              <select
                id="roleFilter"
                className="form-select"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="company">Company</option>
              </select>
            </div>
            <div className="col-12 col-sm-6 col-md-3">
              <label htmlFor="statusFilter" className="form-label small fw-semibold">Filter by Status</label>
              <select
                id="statusFilter"
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="deactivated">Deactivated</option>
              </select>
            </div>
            <div className="col-12 col-md-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* User List Table */}
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
          ) : users.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <i className="bi bi-people text-muted fs-1 mb-2 d-block" aria-hidden="true" />
              No users match the search criteria.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Role</th>
                    <th scope="col">Account Status</th>
                    <th scope="col">Verification Status</th>
                    <th scope="col">Joined Date</th>
                    <th scope="col" className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <span className="fw-semibold text-dark">{user.name}</span>
                        {user.companyProfile && (
                          <div className="small text-secondary">{user.companyProfile.companyName}</div>
                        )}
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge text-capitalize ${user.role === 'student' ? 'bg-primary-subtle text-primary' : 'bg-info-subtle text-info-emphasis'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${user.accountStatus === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                          {user.accountStatus}
                        </span>
                      </td>
                      <td>
                        {user.role === 'company' && user.companyProfile ? (
                          <span className={`badge ${
                            user.companyProfile.approvalStatus === 'approved' ? 'bg-success' :
                            user.companyProfile.approvalStatus === 'pending' ? 'bg-warning text-dark' : 'bg-danger'
                          }`}>
                            {user.companyProfile.approvalStatus}
                          </span>
                        ) : (
                          <span className="text-secondary">-</span>
                        )}
                      </td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td className="text-end">
                        {user.accountStatus === 'active' ? (
                          <button
                            type="button"
                            className="btn btn-outline-warning btn-sm me-2"
                            onClick={() => setConfirmUserStatus({ user, newStatus: 'deactivated' })}
                            disabled={submitLoading}
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-outline-success btn-sm me-2"
                            onClick={() => setConfirmUserStatus({ user, newStatus: 'active' })}
                            disabled={submitLoading}
                          >
                            Activate
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => setConfirmUserDelete(user)}
                          disabled={submitLoading}
                        >
                          Delete
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
              Showing page <strong>{meta.page}</strong> of <strong>{meta.totalPages}</strong> (Total {meta.totalItems} items)
            </span>
            <nav aria-label="Users pagination">
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

      {/* Account status change confirmation modal */}
      {confirmUserStatus && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Confirm Status Change</h5>
                <button type="button" className="btn-close" onClick={() => setConfirmUserStatus(null)} aria-label="Close" />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to <strong>{confirmUserStatus.newStatus}</strong> the user account for <strong>{confirmUserStatus.user.name}</strong> ({confirmUserStatus.user.email})?</p>
                {confirmUserStatus.newStatus === 'deactivated' && (
                  <div className="alert alert-warning py-2 small mb-0">
                    <i className="bi bi-exclamation-triangle-fill me-2" aria-hidden="true" />
                    Deactivating the user will prevent them from logging into the portal until reactivated.
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setConfirmUserStatus(null)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleStatusChangeSubmit} disabled={submitLoading}>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account deletion confirmation modal */}
      {confirmUserDelete && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-danger text-white">
                <h5 className="modal-title fw-bold">Permanently Delete Account</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setConfirmUserDelete(null)} aria-label="Close" />
              </div>
              <div className="modal-body bg-light">
                <p className="text-danger fw-bold">This action cannot be undone.</p>
                <p>Are you sure you want to permanently delete the account of <strong>{confirmUserDelete.name}</strong> ({confirmUserDelete.email})?</p>
                <div className="alert alert-danger py-2 small mb-0">
                  <i className="bi bi-exclamation-triangle-fill me-2" aria-hidden="true" />
                  <strong>Warning:</strong> Deleting the user will cascade-delete their profile, as well as any applications, bookmarks, postings, and notifications.
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setConfirmUserDelete(null)}>Cancel</button>
                <button type="button" className="btn btn-danger" onClick={handleDeleteSubmit} disabled={submitLoading}>
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
