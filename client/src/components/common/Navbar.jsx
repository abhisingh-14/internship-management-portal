// client/src/components/common/Navbar.jsx

import { Link, useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import useAuth from '../../hooks/useAuth';

function Navbar({ onSidebarToggle }) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        {isAuthenticated && (
          <button
            type="button"
            className="btn btn-outline-light me-2 d-lg-none"
            onClick={onSidebarToggle}
            aria-label="Toggle sidebar"
          >
            <span className="navbar-toggler-icon" />
          </button>
        )}

        <Link className="navbar-brand" to="/">
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
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">
          <ul className="navbar-nav ms-auto align-items-lg-center">
            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <span className="navbar-text text-white me-lg-3">
                    Signed in as <strong>{user?.name}</strong>
                  </span>
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
                  <Link className="nav-link" to="/login">
                    Log In
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-primary ms-lg-2" to="/register">
                    Register
                  </Link>
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