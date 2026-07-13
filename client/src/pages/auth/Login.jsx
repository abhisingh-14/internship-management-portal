// client/src/pages/auth/Login.jsx

import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import AlertMessage from '../../components/common/AlertMessage';
import Loader from '../../components/common/Loader';

function Login() {
  const { login, logout, isSubmitting } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ email: '', password: '', role: 'student' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const validateForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    setFieldErrors({});

    const clientErrors = validateForm();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    try {
      const user = await login({ email: formData.email, password: formData.password });
      
      // Post-auth validation: verify that the user's role matches the selected role
      // Admin accounts are exempt and can log in as either role
      if (user.role !== 'admin' && user.role !== formData.role) {
        await logout(); // Clear context state and stored local session
        const actualRoleLabel = user.role === 'student' ? 'Student' : 'Company';
        setFormError(`This email is registered as a ${actualRoleLabel}. Please select '${actualRoleLabel}' to log in.`);
        return;
      }

      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      if (error.errors) {
        const mappedErrors = {};
        error.errors.forEach((fieldError) => {
          mappedErrors[fieldError.field] = fieldError.message;
        });
        setFieldErrors(mappedErrors);
      } else {
        setFormError(error.message);
      }
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-5">
          <h1 className="h3 mb-4 text-center">Log In</h1>

          {formError && (
            <AlertMessage type="danger" message={formError} onClose={() => setFormError(null)} />
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label d-block">Log in as...</label>
              <div className="btn-group w-100" role="group" aria-label="Role type">
                <input
                  type="radio"
                  className="btn-check"
                  name="role"
                  id="roleStudent"
                  value="student"
                  checked={formData.role === 'student'}
                  onChange={handleChange}
                />
                <label className="btn btn-outline-primary" htmlFor="roleStudent">
                  Student
                </label>

                <input
                  type="radio"
                  className="btn-check"
                  name="role"
                  id="roleCompany"
                  value="company"
                  checked={formData.role === 'company'}
                  onChange={handleChange}
                />
                <label className="btn btn-outline-primary" htmlFor="roleCompany">
                  Company
                </label>
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                value={formData.email}
                onChange={handleChange}
                required
              />
              {fieldErrors.email && (
                <div className="invalid-feedback">{fieldErrors.email}</div>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                value={formData.password}
                onChange={handleChange}
                required
              />
              {fieldErrors.password && (
                <div className="invalid-feedback">{fieldErrors.password}</div>
              )}
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
              {isSubmitting ? <Loader size="sm" label="Logging in..." /> : 'Log In'}
            </button>
          </form>

          <p className="text-center mt-3 mb-0">
            Don&apos;t have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;