import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCompanyProfile, updateCompanyProfile } from '../../services/companyService';
import Loader from '../../components/common/Loader';
import AlertMessage from '../../components/common/AlertMessage';

const INITIAL_FORM_STATE = {
  companyName: '',
  description: '',
  website: '',
  industry: '',
};

function EditCompanyProfile() {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(INITIAL_FORM_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await fetchCompanyProfile();
        if (isMounted) {
          setFormValues({
            companyName: data.companyName || '',
            description: data.description || '',
            website: data.website || '',
            industry: data.industry || '',
          });
        }
      } catch (fetchError) {
        if (isMounted) {
          setLoadError(fetchError);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setFormValues((previousValues) => ({ ...previousValues, [name]: value }));
  }

  function fieldErrorFor(fieldName) {
    const match = fieldErrors.find((entry) => entry.field === fieldName);
    return match ? match.message : null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitError(null);
    setFieldErrors([]);
    setIsSubmitting(true);

    try {
      await updateCompanyProfile({
        companyName: formValues.companyName.trim(),
        description: formValues.description.trim() || null,
        website: formValues.website.trim() || null,
        industry: formValues.industry.trim() || null,
      });
      navigate('/company/profile');
    } catch (submitException) {
      if (submitException.status === 422 && Array.isArray(submitException.errors)) {
        setFieldErrors(submitException.errors);
      } else {
        setSubmitError(submitException);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <Loader fullPage label="Loading profile..." />;
  }

  if (loadError) {
    return (
      <div className="container py-4">
        <AlertMessage
          type="danger"
          title="Unable to load profile"
          message={loadError.message || 'Something went wrong. Please try again.'}
          onClose={() => setLoadError(null)}
        />
      </div>
    );
  }

  return (
    <div className="container py-4">
      <h2 className="mb-4">Edit Company Profile</h2>

      {submitError && (
        <AlertMessage
          type="danger"
          title="Update failed"
          message={submitError.message || 'Something went wrong. Please try again.'}
          onClose={() => setSubmitError(null)}
        />
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-3">
          <label htmlFor="companyName" className="form-label">
            Company Name
          </label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            className={`form-control ${fieldErrorFor('companyName') ? 'is-invalid' : ''}`}
            value={formValues.companyName}
            onChange={handleChange}
            maxLength={150}
            required
          />
          {fieldErrorFor('companyName') && <div className="invalid-feedback">{fieldErrorFor('companyName')}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            className={`form-control ${fieldErrorFor('description') ? 'is-invalid' : ''}`}
            value={formValues.description}
            onChange={handleChange}
            rows={4}
            maxLength={2000}
          />
          {fieldErrorFor('description') && <div className="invalid-feedback">{fieldErrorFor('description')}</div>}
        </div>

        <div className="mb-3">
          <label htmlFor="website" className="form-label">
            Website
          </label>
          <input
            type="url"
            id="website"
            name="website"
            className={`form-control ${fieldErrorFor('website') ? 'is-invalid' : ''}`}
            value={formValues.website}
            onChange={handleChange}
            placeholder="https://example.com"
          />
          {fieldErrorFor('website') && <div className="invalid-feedback">{fieldErrorFor('website')}</div>}
        </div>

        <div className="mb-4">
          <label htmlFor="industry" className="form-label">
            Industry
          </label>
          <input
            type="text"
            id="industry"
            name="industry"
            className={`form-control ${fieldErrorFor('industry') ? 'is-invalid' : ''}`}
            value={formValues.industry}
            onChange={handleChange}
            maxLength={100}
          />
          {fieldErrorFor('industry') && <div className="invalid-feedback">{fieldErrorFor('industry')}</div>}
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => navigate('/company/profile')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditCompanyProfile;
