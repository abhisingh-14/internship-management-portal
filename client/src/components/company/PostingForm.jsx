import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const DEFAULT_VALUES = {
  title: '',
  description: '',
  requiredSkills: '',
  location: '',
  duration: '',
  stipend: '',
  applicationDeadline: '',
  status: 'draft',
};

function toFormValues(internship) {
  if (!internship) {
    return DEFAULT_VALUES;
  }

  return {
    title: internship.title || '',
    description: internship.description || '',
    requiredSkills: Array.isArray(internship.requiredSkills)
      ? internship.requiredSkills.join(', ')
      : '',
    location: internship.location || '',
    duration: internship.duration || '',
    stipend: internship.stipend != null ? String(internship.stipend) : '',
    applicationDeadline: internship.applicationDeadline
      ? String(internship.applicationDeadline).slice(0, 10)
      : '',
    status: internship.status || 'draft',
  };
}

/**
 * Reusable create/edit form for internship postings. Renders itself from
 * `initialValues` when editing, or blank defaults when creating.
 */
function PostingForm({ initialValues, onSubmit, onCancel, isSubmitting, serverErrors }) {
  const [formValues, setFormValues] = useState(toFormValues(initialValues));

  useEffect(() => {
    setFormValues(toFormValues(initialValues));
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormValues((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = {
      title: formValues.title.trim(),
      description: formValues.description.trim(),
      requiredSkills: formValues.requiredSkills
        .split(',')
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 0),
      location: formValues.location.trim(),
      duration: formValues.duration.trim(),
      stipend: Number(formValues.stipend),
      applicationDeadline: formValues.applicationDeadline,
      status: formValues.status,
    };

    onSubmit(payload);
  };

  const fieldError = (field) => serverErrors.find((error) => error.field === field)?.message;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-3">
        <label htmlFor="title" className="form-label">
          Title
        </label>
        <input
          type="text"
          id="title"
          name="title"
          className={`form-control ${fieldError('title') ? 'is-invalid' : ''}`}
          value={formValues.title}
          onChange={handleChange}
          required
        />
        {fieldError('title') && <div className="invalid-feedback">{fieldError('title')}</div>}
      </div>

      <div className="mb-3">
        <label htmlFor="description" className="form-label">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          className={`form-control ${fieldError('description') ? 'is-invalid' : ''}`}
          rows="4"
          value={formValues.description}
          onChange={handleChange}
          required
        />
        {fieldError('description') && (
          <div className="invalid-feedback">{fieldError('description')}</div>
        )}
      </div>

      <div className="mb-3">
        <label htmlFor="requiredSkills" className="form-label">
          Required Skills (comma-separated)
        </label>
        <input
          type="text"
          id="requiredSkills"
          name="requiredSkills"
          className={`form-control ${fieldError('requiredSkills') ? 'is-invalid' : ''}`}
          value={formValues.requiredSkills}
          onChange={handleChange}
          placeholder="React, Node.js, SQL"
          required
        />
        {fieldError('requiredSkills') && (
          <div className="invalid-feedback">{fieldError('requiredSkills')}</div>
        )}
      </div>

      <div className="row">
        <div className="col-md-6 mb-3">
          <label htmlFor="location" className="form-label">
            Location
          </label>
          <input
            type="text"
            id="location"
            name="location"
            className={`form-control ${fieldError('location') ? 'is-invalid' : ''}`}
            value={formValues.location}
            onChange={handleChange}
            required
          />
          {fieldError('location') && (
            <div className="invalid-feedback">{fieldError('location')}</div>
          )}
        </div>

        <div className="col-md-6 mb-3">
          <label htmlFor="duration" className="form-label">
            Duration
          </label>
          <input
            type="text"
            id="duration"
            name="duration"
            className={`form-control ${fieldError('duration') ? 'is-invalid' : ''}`}
            value={formValues.duration}
            onChange={handleChange}
            placeholder="3 months"
            required
          />
          {fieldError('duration') && (
            <div className="invalid-feedback">{fieldError('duration')}</div>
          )}
        </div>
      </div>

      <div className="row">
        <div className="col-md-4 mb-3">
          <label htmlFor="stipend" className="form-label">
            Stipend
          </label>
          <input
            type="number"
            id="stipend"
            name="stipend"
            min="0"
            className={`form-control ${fieldError('stipend') ? 'is-invalid' : ''}`}
            value={formValues.stipend}
            onChange={handleChange}
            required
          />
          {fieldError('stipend') && <div className="invalid-feedback">{fieldError('stipend')}</div>}
        </div>

        <div className="col-md-4 mb-3">
          <label htmlFor="applicationDeadline" className="form-label">
            Application Deadline
          </label>
          <input
            type="date"
            id="applicationDeadline"
            name="applicationDeadline"
            className={`form-control ${fieldError('applicationDeadline') ? 'is-invalid' : ''}`}
            value={formValues.applicationDeadline}
            onChange={handleChange}
            required
          />
          {fieldError('applicationDeadline') && (
            <div className="invalid-feedback">{fieldError('applicationDeadline')}</div>
          )}
        </div>

        <div className="col-md-4 mb-3">
          <label htmlFor="status" className="form-label">
            Status
          </label>
          <select
            id="status"
            name="status"
            className="form-select"
            value={formValues.status}
            onChange={handleChange}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            {initialValues?.status === 'closed' && <option value="closed">Closed</option>}
          </select>
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-3">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Posting'}
        </button>
      </div>
    </form>
  );
}

PostingForm.propTypes = {
  initialValues: PropTypes.shape({
    title: PropTypes.string,
    description: PropTypes.string,
    requiredSkills: PropTypes.arrayOf(PropTypes.string),
    location: PropTypes.string,
    duration: PropTypes.string,
    stipend: PropTypes.number,
    applicationDeadline: PropTypes.string,
    status: PropTypes.string,
  }),
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  serverErrors: PropTypes.arrayOf(
    PropTypes.shape({ field: PropTypes.string, message: PropTypes.string })
  ),
};

PostingForm.defaultProps = {
  initialValues: null,
  isSubmitting: false,
  serverErrors: [],
};

export default PostingForm;
