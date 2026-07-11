import { Link } from 'react-router-dom';

/**
 * Generic "access denied" page.
 *
 * Not yet wired into a route guard — the `RoleRoute` component that
 * redirects here when a user's role doesn't permit access is introduced by
 * the Authentication component (Component 05). This page itself is a
 * static, role-agnostic view, so it belongs to this boilerplate component.
 */
const Unauthorized = () => (
  <div className="py-5 text-center">
    <h1 className="display-4 fw-bold">403</h1>
    <p className="lead text-muted">You do not have permission to access this page.</p>
    <Link to="/" className="btn btn-primary mt-2">
      Back to Home
    </Link>
  </div>
);

export default Unauthorized;
