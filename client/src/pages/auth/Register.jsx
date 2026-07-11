// client/src/pages/auth/Register.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import AlertMessage from '../../components/common/AlertMessage';
import Loader from '../../components/common/Loader';

const INITIAL_FORM_STATE = {
  role: 'student',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  companyName: '',
};

function Register() {
  const { register, isSubmitting } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const validateClientSide = () => {
    const errors = {};

    if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (!/[A-Za-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      errors.password = 'Password must include at least one letter and one number';
    }

    if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (formData.role === 'company' && formData.companyName.trim().length < 2) {
      errors.companyName = 'Company name is required for company accounts';
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);

    const clientErrors = validateClientSide();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }
    setFieldErrors({});

    const { confirmPassword, ...payload } = formData;

    try {
      const user = await register(payload);
      if (user.role === 'company') {
        navigate('/', { replace: true, state: { justRegisteredCompany: true } });
      } else {
        navigate('/', { replace: true });
      }
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
        <div className="col-12 col-md-7 col-lg-6">
          <h1 className="h3 mb-4 text-center">Create an Account</h1>

          {formError && (
            <AlertMessage type="danger" message={formError} onClose={() => setFormError(null)} />
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label d-block">I am a...</label>
              <div className="btn-group w-100" role="group" aria-label="Account type">
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
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={`form-control ${fieldErrors.name ? 'is-invalid' : ''}`}
                value={formData.name}
                onChange={handleChange}
                required
              />
              {fieldErrors.name && <div className="invalid-feedback">{fieldErrors.name}</div>}
            </div>

            {formData.role === 'company' && (
              <div className="mb-3">
                <label htmlFor="companyName" className="form-label">
                  Company Name
                </label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  className={`form-control ${fieldErrors.companyName ? 'is-invalid' : ''}`}
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
                {fieldErrors.companyName && (
                  <div className="invalid-feedback">{fieldErrors.companyName}</div>
                )}
              </div>
            )}

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
              {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
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
              <div className="form-text">
                At least 8 characters, including one letter and one number.
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                className={`form-control ${fieldErrors.confirmPassword ? 'is-invalid' : ''}`}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
              {fieldErrors.confirmPassword && (
                <div className="invalid-feedback">{fieldErrors.confirmPassword}</div>
              )}
            </div>

            <button type="submit" className="btn btn-primary w-100" disabled={isSubmitting}>
              {isSubmitting ? <Loader size="sm" label="Creating account..." /> : 'Register'}
            </button>
          </form>

          <p className="text-center mt-3 mb-0">
            Already have an account? <Link to="/login">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;