import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { resolveFileUrl } from '../../utils/fileUrl';

/**
 * Formats an ISO date string ("2026-09-01") into a short, readable form
 * ("Sep 1, 2026") without pulling in a date-formatting library.
 * @param {string} isoDate
 * @returns {string}
 */
function formatDate(isoDate) {
  if (!isoDate) return 'N/A';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Formats an integer stipend value as a currency-style string.
 * @param {number} stipend
 * @returns {string}
 */
function formatStipend(stipend) {
  if (stipend === undefined || stipend === null) return 'Unpaid';
  if (stipend === 0) return 'Unpaid';
  return `₹${stipend.toLocaleString('en-IN')} / month`;
}

/**
 * InternshipCard — a reusable, presentational card summarizing a single
 * internship posting. Receives all data via props and renders no data
 * fetching or business logic of its own, per docs/05_Coding_Standards.md
 * §13 ("Data fetching happens in pages, not in reusable components").
 */
function InternshipCard({ internship }) {
  const skillsToShow = internship.requiredSkills.slice(0, 4);
  const remainingSkillCount = internship.requiredSkills.length - skillsToShow.length;

  return (
    <div className="col-12 col-md-6 col-lg-4 mb-4">
      <div className="card h-100 shadow-sm">
        <div className="card-body d-flex flex-column">
          <div className="d-flex align-items-center mb-2">
            {internship.companyLogoUrl ? (
              <img
                src={resolveFileUrl(internship.companyLogoUrl)}
                alt={`${internship.companyName} logo`}
                className="rounded me-2"
                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
              />
            ) : (
              <div
                className="rounded bg-light d-flex align-items-center justify-content-center me-2 text-secondary"
                style={{ width: '40px', height: '40px' }}
              >
                <i className="bi bi-building" aria-hidden="true" />
              </div>
            )}
            <span className="text-muted small text-truncate">{internship.companyName}</span>
          </div>

          <h5 className="card-title mb-1 text-truncate" title={internship.title}>
            {internship.title}
          </h5>

          <div className="mb-2 text-muted small">
            <span className="me-3">
              <i className="bi bi-geo-alt me-1" aria-hidden="true" />
              {internship.location}
            </span>
            <span>
              <i className="bi bi-clock me-1" aria-hidden="true" />
              {internship.duration}
            </span>
          </div>

          <div className="mb-2">
            {skillsToShow.map((skill) => (
              <span key={skill} className="badge text-bg-light border me-1 mb-1">
                {skill}
              </span>
            ))}
            {remainingSkillCount > 0 && (
              <span className="badge text-bg-light border me-1 mb-1">+{remainingSkillCount} more</span>
            )}
          </div>

          <div className="mt-auto">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="fw-semibold text-success">{formatStipend(internship.stipend)}</span>
              <span className="text-muted small">Apply by {formatDate(internship.applicationDeadline)}</span>
            </div>
            <Link to={`/internships/${internship.id}`} className="btn btn-primary w-100">
              View Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

InternshipCard.propTypes = {
  internship: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    title: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    duration: PropTypes.string.isRequired,
    stipend: PropTypes.number,
    applicationDeadline: PropTypes.string,
    requiredSkills: PropTypes.arrayOf(PropTypes.string).isRequired,
    companyName: PropTypes.string.isRequired,
    companyLogoUrl: PropTypes.string,
  }).isRequired,
};

export default InternshipCard;
