import PropTypes from 'prop-types';

/**
 * Reusable, dismissible Bootstrap alert used to surface success, error,
 * warning, or informational messages throughout the app.
 *
 * Presentational only: the calling page/component owns the message state
 * (typically populated from the normalized error shape produced by
 * `services/api.js`) and passes an `onClose` handler to dismiss it. This
 * component never manages its own visibility or fetches anything itself.
 */
const AlertMessage = ({ type = 'info', message = '', title = '', onClose = null }) => {
  if (!message) {
    return null;
  }

  return (
    <div
      className={`alert alert-${type}${onClose ? ' alert-dismissible' : ''} fade show`}
      role="alert"
    >
      {title && <strong className="me-1">{title}</strong>}
      {message}
      {onClose && (
        <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
      )}
    </div>
  );
};

AlertMessage.propTypes = {
  type: PropTypes.oneOf(['success', 'danger', 'warning', 'info', 'primary', 'secondary']),
  message: PropTypes.string,
  title: PropTypes.string,
  onClose: PropTypes.func,
};

export default AlertMessage;
