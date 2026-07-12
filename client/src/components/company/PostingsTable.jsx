import PropTypes from 'prop-types';

const STATUS_BADGE_CLASSES = {
  draft: 'bg-secondary',
  published: 'bg-success',
  closed: 'bg-dark',
  flagged: 'bg-warning text-dark',
  removed: 'bg-danger',
};

function formatDate(dateString) {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString();
}

function formatStipend(stipend) {
  if (stipend === undefined || stipend === null || stipend === 0) return 'Unpaid';
  return `₹${stipend.toLocaleString('en-IN')} / month`;
}

/**
 * Presentational table listing a company's own internship postings.
 * Receives data and callbacks via props only; performs no data fetching.
 */
function PostingsTable({ internships, onEdit, onDelete, onToggleStatus }) {
  if (internships.length === 0) {
    return <p className="text-muted">No internship postings found.</p>;
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle">
        <thead>
          <tr>
            <th>Title</th>
            <th>Location</th>
            <th>Stipend</th>
            <th>Deadline</th>
            <th>Status</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {internships.map((internship) => (
            <tr key={internship.id}>
              <td>{internship.title}</td>
              <td>{internship.location}</td>
              <td>{formatStipend(internship.stipend)}</td>
              <td>{formatDate(internship.applicationDeadline)}</td>
              <td>
                <span className={`badge ${STATUS_BADGE_CLASSES[internship.status] || 'bg-secondary'}`}>
                  {internship.status}
                </span>
              </td>
              <td className="text-end">
                <div className="btn-group btn-group-sm" role="group">
                  <button type="button" className="btn btn-outline-primary" onClick={() => onEdit(internship)}>
                    Edit
                  </button>

                  {internship.status === 'draft' && (
                    <button
                      type="button"
                      className="btn btn-outline-success"
                      onClick={() => onToggleStatus(internship, 'published')}
                    >
                      Publish
                    </button>
                  )}

                  {internship.status === 'published' && (
                    <button
                      type="button"
                      className="btn btn-outline-dark"
                      onClick={() => onToggleStatus(internship, 'closed')}
                    >
                      Close
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={() => onDelete(internship)}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

PostingsTable.propTypes = {
  internships: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      location: PropTypes.string,
      stipend: PropTypes.number,
      applicationDeadline: PropTypes.string,
      status: PropTypes.string,
    })
  ).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
};

export default PostingsTable;
