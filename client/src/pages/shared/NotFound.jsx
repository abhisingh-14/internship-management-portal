import { Link } from 'react-router-dom';

/**
 * Generic 404 page, rendered by the catch-all route in `AppRoutes` for any
 * URL that does not match a defined route.
 */
const NotFound = () => (
  <div className="py-5 text-center">
    <h1 className="display-4 fw-bold">404</h1>
    <p className="lead text-muted">The page you are looking for does not exist.</p>
    <Link to="/" className="btn btn-primary mt-2">
      Back to Home
    </Link>
  </div>
);

export default NotFound;
