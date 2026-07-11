// client/src/components/common/RoleRoute.jsx

import { Navigate, Outlet } from 'react-router-dom';
import PropTypes from 'prop-types';
import useAuth from '../../hooks/useAuth';

/**
 * Guards nested routes behind a specific set of allowed roles. Must be
 * rendered inside a ProtectedRoute branch, since it assumes the user is
 * already authenticated.
 */
function RoleRoute({ allowedRoles }) {
  const { role } = useAuth();

  if (!allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

RoleRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.oneOf(['student', 'company', 'admin']))
    .isRequired,
};

export default RoleRoute;