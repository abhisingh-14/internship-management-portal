import PropTypes from 'prop-types';

const STATUS_STYLES = {
  pending: { label: 'Pending Approval', className: 'bg-warning text-dark' },
  approved: { label: 'Approved', className: 'bg-success' },
  rejected: { label: 'Rejected', className: 'bg-danger' },
};

function ApprovalStatusBadge({ status }) {
  const style = STATUS_STYLES[status] || { label: status, className: 'bg-secondary' };

  return <span className={`badge ${style.className}`}>{style.label}</span>;
}

ApprovalStatusBadge.propTypes = {
  status: PropTypes.oneOf(['pending', 'approved', 'rejected']).isRequired,
};

export default ApprovalStatusBadge;
