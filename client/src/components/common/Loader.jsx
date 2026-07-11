import PropTypes from 'prop-types';

/**
 * Generic loading indicator built on Bootstrap's spinner component.
 *
 * Presentational only — it holds no data-fetching logic of its own. Future
 * data-fetching pages (internship listings, applicant tables, dashboards,
 * etc.) render this while a request is in flight, then swap it out once
 * data or an error has arrived.
 */
const Loader = ({ label = 'Loading...', fullPage = false, size = 'md' }) => {
  const spinner = (
    <div className="d-flex flex-column align-items-center justify-content-center gap-2">
      <div
        className={`spinner-border text-primary${size === 'sm' ? ' spinner-border-sm' : ''}`}
        role="status"
      >
        <span className="visually-hidden">{label}</span>
      </div>
      {size !== 'sm' && <span className="text-muted small">{label}</span>}
    </div>
  );

  if (fullPage) {
    return (
      <div
        className="d-flex align-items-center justify-content-center w-100"
        style={{ minHeight: '60vh' }}
      >
        {spinner}
      </div>
    );
  }

  return spinner;
};

Loader.propTypes = {
  label: PropTypes.string,
  fullPage: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md']),
};

export default Loader;
