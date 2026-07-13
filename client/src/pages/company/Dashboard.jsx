import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchCompanyDashboard } from '../../services/companyService';
import { fetchCompanyPostingsAnalytics } from '../../services/adminService';
import { getNotifications } from '../../services/notificationService';
import Loader from '../../components/common/Loader';
import AlertMessage from '../../components/common/AlertMessage';
import ApprovalStatusBadge from '../../components/company/ApprovalStatusBadge';
import ProfileCompletenessBar from '../../components/company/ProfileCompletenessBar';

const APPROVAL_MESSAGES = {
  pending: {
    type: 'warning',
    title: 'Approval pending',
    message: 'Your company account is awaiting admin approval. You will be able to post internships once approved.',
  },
  rejected: {
    type: 'danger',
    title: 'Registration rejected',
    message: 'Your company registration was rejected. Please contact support for more information.',
  },
};

const MAX_RECENT_NOTIFICATIONS = 5;

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [totalApplicationsReceived, setTotalApplicationsReceived] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);
      try {
        const [data, postingsAnalytics, notifData] = await Promise.all([
          fetchCompanyDashboard(),
          fetchCompanyPostingsAnalytics().catch(() => []),
          getNotifications({ page: 1, limit: MAX_RECENT_NOTIFICATIONS }),
        ]);

        if (isMounted) {
          setDashboardData(data);

          // Sum up total applications received across all postings
          const totalApps = Array.isArray(postingsAnalytics)
            ? postingsAnalytics.reduce((sum, p) => sum + (p.applicantCount || 0), 0)
            : 0;
          setTotalApplicationsReceived(totalApps);
          setNotifications(notifData.items);
        }
      } catch (fetchError) {
        if (isMounted) {
          setError(fetchError);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return <Loader fullPage label="Loading dashboard..." />;
  }

  if (error) {
    return (
      <div className="container py-4">
        <AlertMessage
          type="danger"
          title="Unable to load dashboard"
          message={error.message || 'Something went wrong. Please try again.'}
          onClose={() => setError(null)}
        />
      </div>
    );
  }

  const { profile, profileCompleteness, internshipStats } = dashboardData;
  const approvalNotice = APPROVAL_MESSAGES[profile.approvalStatus];

  function formatNotifDate(dateString) {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="container py-4">
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="h3 mb-1 fw-bold text-dark">{profile.companyName}</h1>
          <ApprovalStatusBadge status={profile.approvalStatus} />
        </div>
        <Link to="/company/profile" className="btn btn-outline-primary">
          View Profile
        </Link>
      </div>

      {approvalNotice && (
        <AlertMessage type={approvalNotice.type} title={approvalNotice.title} message={approvalNotice.message} />
      )}

      {/* Profile Completeness */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <ProfileCompletenessBar percentage={profileCompleteness} />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        {/* Total Internships */}
        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 bg-primary-subtle text-primary-emphasis">
            <div className="card-body d-flex flex-column justify-content-between p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="fw-semibold small text-uppercase">Total Postings</span>
                <div className="bg-white rounded p-2 text-primary">
                  <i className="bi bi-briefcase fs-4" aria-hidden="true" />
                </div>
              </div>
              <div>
                <h2 className="display-6 fw-bold mb-0">{internshipStats.total}</h2>
                <Link
                  to="/company/postings"
                  className="small text-decoration-none text-primary-emphasis fw-medium d-block mt-2"
                >
                  Manage Postings &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Total Applications Received */}
        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 bg-success-subtle text-success-emphasis">
            <div className="card-body d-flex flex-column justify-content-between p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="fw-semibold small text-uppercase">Applications</span>
                <div className="bg-white rounded p-2 text-success">
                  <i className="bi bi-people fs-4" aria-hidden="true" />
                </div>
              </div>
              <div>
                <h2 className="display-6 fw-bold mb-0">{totalApplicationsReceived}</h2>
                <Link
                  to="/company/applicants"
                  className="small text-decoration-none text-success-emphasis fw-medium d-block mt-2"
                >
                  View Applicants &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Published */}
        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 bg-info-subtle text-info-emphasis">
            <div className="card-body d-flex flex-column justify-content-between p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="fw-semibold small text-uppercase">Published</span>
                <div className="bg-white rounded p-2 text-info">
                  <i className="bi bi-broadcast fs-4" aria-hidden="true" />
                </div>
              </div>
              <div>
                <h2 className="display-6 fw-bold mb-0">{internshipStats.published}</h2>
                <span className="small text-info-emphasis fw-medium d-block mt-2">
                  Active listings
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Draft / Closed */}
        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 bg-secondary-subtle text-secondary-emphasis">
            <div className="card-body d-flex flex-column justify-content-between p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="fw-semibold small text-uppercase">Draft / Closed</span>
                <div className="bg-white rounded p-2 text-secondary">
                  <i className="bi bi-archive fs-4" aria-hidden="true" />
                </div>
              </div>
              <div>
                <h2 className="display-6 fw-bold mb-0">
                  {(internshipStats.draft || 0) + (internshipStats.closed || 0)}
                </h2>
                <span className="small text-secondary-emphasis fw-medium d-block mt-2">
                  {internshipStats.draft || 0} draft, {internshipStats.closed || 0} closed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="card shadow-sm">
        <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
          <h2 className="h5 mb-0 fw-bold text-dark">Recent Notifications</h2>
          <Link to="/notifications" className="btn btn-sm btn-outline-secondary">
            View All
          </Link>
        </div>
        <div className="card-body p-0">
          {notifications.length === 0 ? (
            <div className="text-center py-5 text-secondary">
              <i className="bi bi-bell-slash fs-2 mb-2 d-block" aria-hidden="true" />
              No notifications yet.
            </div>
          ) : (
            <ul className="list-group list-group-flush">
              {notifications.map((notif) => (
                <li
                  key={notif.id}
                  className={`list-group-item px-4 py-3 ${!notif.isRead ? 'border-start border-4 border-primary' : ''}`}
                >
                  <div className="d-flex justify-content-between align-items-start gap-2">
                    <p className={`mb-0 small flex-grow-1 ${!notif.isRead ? 'fw-semibold' : ''}`}>
                      {notif.message}
                    </p>
                    <span className="text-muted small flex-shrink-0">
                      {formatNotifDate(notif.createdAt)}
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

export default Dashboard;
