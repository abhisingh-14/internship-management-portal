// client/src/components/common/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import useAuth from '../../hooks/useAuth';
import { getUnreadCount } from '../../services/notificationService';

function Navbar({ onSidebarToggle }) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchCount = async () => {
      try {
        const count = await getUnreadCount();
        setUnreadCount(count);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };

    fetchCount();

    // Listen for manual updates (e.g. from Notifications page)
    window.addEventListener('notifications:updated', fetchCount);

    // Poll count every 30 seconds
    const interval = setInterval(fetchCount, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications:updated', fetchCount);
    };
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  function dashboardPathForRole(role) {
    if (role === 'student') return '/student/dashboard';
    if (role === 'company') return '/company/dashboard';
    if (role === 'admin') return '/admin/dashboard';
    return '/';
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
      <div className="container-fluid">
        {onSidebarToggle && (
          <button
            type="button"
            className="btn btn-outline-light me-2 d-lg-none"
            onClick={onSidebarToggle}
            aria-label="Toggle sidebar"
          >
            <span className="navbar-toggler-icon" />
          </button>
        )}

        <Link className="navbar-brand fw-semibold" to="/" onClick={closeMobileMenu}>
          Internship Portal
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className={`collapse navbar-collapse ${isMobileMenuOpen ? 'show' : ''}`} id="navbarContent">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/" end onClick={closeMobileMenu}>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/internships" onClick={closeMobileMenu}>
                Browse Internships
              </NavLink>
            </li>
          </ul>

          <ul className="navbar-nav ms-auto align-items-lg-center">
            {isAuthenticated ? (
              <>
                 <li className="nav-item">
                  <NavLink
                    className="nav-link"
                    to={dashboardPathForRole(user?.role)}
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </NavLink>
                </li>
                <li className="nav-item me-lg-3">
                  <NavLink
                    className="nav-link d-flex align-items-center position-relative py-2 py-lg-1"
                    to="/notifications"
                    onClick={closeMobileMenu}
                    title="Notifications"
                  >
                    <i className="bi bi-bell fs-5" aria-hidden="true" />
                    {unreadCount > 0 && (
                      <span
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                        style={{ fontSize: '0.65rem' }}
                      >
                        {unreadCount}
                      </span>
                    )}
                    <span className="d-lg-none ms-2">Notifications</span>
                  </NavLink>
                </li>
                <li className="nav-item text-light small me-lg-3 py-2 py-lg-0">
                  Signed in as <span className="fw-semibold">{user?.name}</span>
                </li>
                <li className="nav-item">
                  <button type="button" className="btn btn-outline-light" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className="nav-link" to="/login" onClick={closeMobileMenu}>
                    Login
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink className="btn btn-primary btn-sm ms-lg-2" to="/register" onClick={closeMobileMenu}>
                    Register
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

Navbar.propTypes = {
  onSidebarToggle: PropTypes.func,
};

Navbar.defaultProps = {
  onSidebarToggle: () => {},
};

export default Navbar;