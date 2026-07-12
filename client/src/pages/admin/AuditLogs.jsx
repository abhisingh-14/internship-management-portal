import { useEffect, useState, useCallback } from 'react';
import * as adminService from '../../services/adminService';

const ACTION_CONFIG = {
  user_status_change: { label: 'User Status Change', icon: 'bi-person-gear', colorClass: 'text-warning' },
  user_delete: { label: 'User Deleted', icon: 'bi-person-x-fill', colorClass: 'text-danger' },
  company_approval: { label: 'Company Approval', icon: 'bi-building-check', colorClass: 'text-success' },
  internship_moderation: { label: 'Internship Moderation', icon: 'bi-shield-exclamation', colorClass: 'text-primary' },
};

const ACTION_FILTER_OPTIONS = [
  { value: '', label: 'All Actions' },
  { value: 'user_status_change', label: 'User Status Change' },
  { value: 'user_delete', label: 'User Deleted' },
  { value: 'company_approval', label: 'Company Approval' },
  { value: 'internship_moderation', label: 'Internship Moderation' },
];

function formatRelativeTime(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.fetchAuditLogs({
        action: actionFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 20,
      });
      setLogs(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  }, [actionFilter, startDate, endDate, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleActionFilterChange = (e) => {
    setActionFilter(e.target.value);
    setPage(1);
  };

  const handleDateChange = (field, value) => {
    if (field === 'start') setStartDate(value);
    else setEndDate(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setActionFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasFilters = actionFilter || startDate || endDate;

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="h3 mb-1 fw-bold text-dark">Audit Logs</h1>
        <p className="text-secondary mb-0">
          A tamper-evident trail of all administrative actions taken on the platform.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body py-3">
          <div className="row g-3 align-items-end">
            <div className="col-sm-auto">
              <label htmlFor="auditActionFilter" className="form-label small fw-semibold mb-1">
                Action Type
              </label>
              <select
                id="auditActionFilter"
                className="form-select form-select-sm"
                value={actionFilter}
                onChange={handleActionFilterChange}
                style={{ minWidth: '180px' }}
              >
                {ACTION_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="col-sm-auto">
              <label htmlFor="auditStartDate" className="form-label small fw-semibold mb-1">
                From Date
              </label>
              <input
                id="auditStartDate"
                type="date"
                className="form-control form-control-sm"
                value={startDate}
                onChange={(e) => handleDateChange('start', e.target.value)}
                max={endDate || undefined}
              />
            </div>
            <div className="col-sm-auto">
              <label htmlFor="auditEndDate" className="form-label small fw-semibold mb-1">
                To Date
              </label>
              <input
                id="auditEndDate"
                type="date"
                className="form-control form-control-sm"
                value={endDate}
                onChange={(e) => handleDateChange('end', e.target.value)}
                min={startDate || undefined}
              />
            </div>
            {hasFilters && (
              <div className="col-sm-auto">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={handleClearFilters}
                >
                  <i className="bi bi-x-lg me-1" aria-hidden="true" />
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Logs */}
      {meta && (
        <div className="mb-3 small text-secondary">
          Showing <strong>{logs.length}</strong> of <strong>{meta.totalItems}</strong> log entries
        </div>
      )}

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
          ) : logs.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <i className="bi bi-journal-text fs-1 d-block mb-2" aria-hidden="true" />
              {hasFilters
                ? 'No audit logs match the current filters.'
                : 'No administrative actions have been recorded yet.'}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th scope="col" style={{ width: '40px' }}></th>
                    <th scope="col">Action</th>
                    <th scope="col">Performed By</th>
                    <th scope="col">Target ID</th>
                    <th scope="col">Details</th>
                    <th scope="col">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const config = ACTION_CONFIG[log.action] || {
                      label: log.action,
                      icon: 'bi-activity',
                      colorClass: 'text-secondary',
                    };
                    return (
                      <tr key={log.id}>
                        <td className="text-center">
                          <i
                            className={`bi ${config.icon} fs-5 ${config.colorClass}`}
                            aria-hidden="true"
                            title={config.label}
                          />
                        </td>
                        <td>
                          <span className="fw-semibold small">{config.label}</span>
                          <br />
                          <code className="text-muted" style={{ fontSize: '0.7rem' }}>{log.action}</code>
                        </td>
                        <td>
                          <span className="d-block small fw-semibold">{log.actor?.name || '—'}</span>
                          <small className="text-muted">{log.actor?.email || ''}</small>
                        </td>
                        <td>
                          <code className="small text-secondary">#{log.targetId}</code>
                        </td>
                        <td style={{ maxWidth: '320px' }}>
                          <span className="small text-secondary text-truncate d-block" title={log.details}>
                            {log.details || '—'}
                          </span>
                        </td>
                        <td className="text-nowrap">
                          <span className="small text-secondary" title={new Date(log.createdAt).toLocaleString()}>
                            {formatRelativeTime(log.createdAt)}
                          </span>
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
            <nav aria-label="Audit logs pagination">
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

export default AdminAuditLogs;
