import PropTypes from 'prop-types';

function ProfileCompletenessBar({ percentage }) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const variantClassName =
    clampedPercentage >= 75 ? 'bg-success' : clampedPercentage >= 40 ? 'bg-warning' : 'bg-danger';

  return (
    <div>
      <div className="d-flex justify-content-between mb-1">
        <span className="small fw-semibold">Profile Completeness</span>
        <span className="small text-muted">{clampedPercentage}%</span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label="Profile completeness"
        aria-valuenow={clampedPercentage}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div className={`progress-bar ${variantClassName}`} style={{ width: `${clampedPercentage}%` }} />
      </div>
    </div>
  );
}

ProfileCompletenessBar.propTypes = {
  percentage: PropTypes.number.isRequired,
};

export default ProfileCompletenessBar;
