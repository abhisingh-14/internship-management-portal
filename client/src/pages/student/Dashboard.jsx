import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import AlertMessage from '../../components/common/AlertMessage';
import { fetchStudentDashboard, fetchStudentActivity } from '../../services/studentService';
import { getNotifications } from '../../services/notificationService';

const MAX_RECENT_NOTIFICATIONS = 5;

function StudentDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [activity, setActivity] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setError(null);
      try {
        const [profileData, activityData, notifData] = await Promise.all([
          fetchStudentDashboard(),
          fetchStudentActivity(),
          getNotifications({ page: 1, limit: MAX_RECENT_NOTIFICATIONS }),
        ]);
        if (isMounted) {
          setDashboardData(profileData);
          setActivity(activityData);
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

  const { profile, profileCompleteness } = dashboardData;
  const completenessColor =
    profileCompleteness >= 75 ? 'bg-success' : profileCompleteness >= 40 ? 'bg-warning' : 'bg-danger';

  function formatNotifDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return (
    <div className="container py-4">
      {/* Page Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="h3 mb-1 fw-bold text-dark">
            Welcome back, {profile.name}!
          </h1>
          <p className="text-secondary mb-0">{profile.email}</p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/student/profile" className="btn btn-primary">
            Edit Profile
          </Link>
          <Link to="/student/applications" className="btn btn-outline-primary">
            My Applications
          </Link>
        </div>
      </div>

      {/* Profile Completeness */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between mb-1">
            <span className="small fw-semibold">Profile Completeness</span>
            <span className="small text-muted">{profileCompleteness}%</span>
          </div>
          <div
            className="progress"
            role="progressbar"
            aria-label="Profile completeness"
            aria-valuenow={profileCompleteness}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div
              className={`progress-bar ${completenessColor}`}
              style={{ width: `${profileCompleteness}%` }}
            />
          </div>
          {profileCompleteness < 100 ? (
            <p className="small text-muted mt-2 mb-0">
              Complete your profile to increase your chances of being noticed by companies.{' '}
              <Link to="/student/profile" className="fw-semibold">
                Edit Profile &rarr;
              </Link>
            </p>
          ) : (
            <p className="small text-success mt-2 mb-0">
              Your profile is fully complete!{' '}
              <Link to="/student/profile" className="fw-semibold">
                View Profile &rarr;
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        {/* Total Applications */}
        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 bg-primary-subtle text-primary-emphasis">
            <div className="card-body d-flex flex-column justify-content-between p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="fw-semibold small text-uppercase">Applications</span>
                <div className="bg-white rounded p-2 text-primary">
                  <i className="bi bi-file-earmark-text fs-4" aria-hidden="true" />
                </div>
              </div>
              <div>
                <h2 className="display-6 fw-bold mb-0">{activity?.applicationsSubmitted ?? 0}</h2>
                <Link
                  to="/student/applications"
                  className="small text-decoration-none text-primary-emphasis fw-medium d-block mt-2"
                >
                  View Applications &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Internships */}
        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 bg-success-subtle text-success-emphasis">
            <div className="card-body d-flex flex-column justify-content-between p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="fw-semibold small text-uppercase">Saved</span>
                <div className="bg-white rounded p-2 text-success">
                  <i className="bi bi-bookmark-heart fs-4" aria-hidden="true" />
                </div>
              </div>
              <div>
                <h2 className="display-6 fw-bold mb-0">{activity?.bookmarksCount ?? 0}</h2>
                <Link
                  to="/student/saved"
                  className="small text-decoration-none text-success-emphasis fw-medium d-block mt-2"
                >
                  View Saved &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Shortlisted */}
        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 bg-warning-subtle text-warning-emphasis">
            <div className="card-body d-flex flex-column justify-content-between p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="fw-semibold small text-uppercase">Shortlisted</span>
                <div className="bg-white rounded p-2 text-warning">
                  <i className="bi bi-star fs-4" aria-hidden="true" />
                </div>
              </div>
              <div>
                <h2 className="display-6 fw-bold mb-0">{activity?.shortlisted ?? 0}</h2>
                <span className="small text-warning-emphasis fw-medium d-block mt-2">
                  Applications shortlisted
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Accepted */}
        <div className="col-sm-6 col-lg-3">
          <div className="card border-0 shadow-sm h-100 bg-info-subtle text-info-emphasis">
            <div className="card-body d-flex flex-column justify-content-between p-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="fw-semibold small text-uppercase">Accepted</span>
                <div className="bg-white rounded p-2 text-info">
                  <i className="bi bi-check-circle fs-4" aria-hidden="true" />
                </div>
              </div>
              <div>
                <h2 className="display-6 fw-bold mb-0">{activity?.accepted ?? 0}</h2>
                <span className="small text-info-emphasis fw-medium d-block mt-2">
                  Applications accepted
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Profile Summary + Recent Notifications */}
      <div className="row g-4">
        {/* Profile Summary */}
        <div className="col-lg-5">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
              <h2 className="h5 mb-0 fw-bold text-dark">Profile Summary</h2>
              <Link to="/internships" className="btn btn-sm btn-outline-secondary">
                Browse Internships
              </Link>
            </div>
            <div className="card-body">
              <div className="d-flex align-items-center mb-3">
                <div
                  className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                  style={{ width: '52px', height: '52px', fontSize: '1.3rem', fontWeight: 600 }}
                  aria-hidden="true"
                >
                  {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
                </div>
                <div>
                  <h3 className="h6 fw-bold mb-0">{profile.name}</h3>
                  <small className="text-secondary">{profile.email}</small>
                </div>
              </div>
              {profile.bio ? (
                <p className="text-secondary small mb-3">{profile.bio}</p>
              ) : (
                <p className="text-muted small fst-italic mb-3">No bio added yet.</p>
              )}
              <div className="d-flex flex-wrap gap-2">
                <span className={`badge ${profile.resumeUrl ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>
                  <i className={`bi ${profile.resumeUrl ? 'bi-file-earmark-check' : 'bi-file-earmark-x'} me-1`} aria-hidden="true" />
                  {profile.resumeUrl ? 'Resume Uploaded' : 'No Resume'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="col-lg-7">
          <div className="card shadow-sm h-100">
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
                        <div className="flex-grow-1">
                          <p className={`mb-0 small ${!notif.isRead ? 'fw-semibold' : ''}`}>
                            {notif.message}
                          </p>
                        </div>
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
      </div>
    </div>
  );
}

export default StudentDashboard;
