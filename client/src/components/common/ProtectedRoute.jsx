// client/src/components/common/ProtectedRoute.jsx

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import Loader from './Loader';

/**
 * Guards nested routes behind authentication only (no role check).
 * Renders a full-page Loader while the initial session restore is in
 * flight, so an authenticated user is never flashed to /login on refresh.
 */
function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loader fullPage label="Checking your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;