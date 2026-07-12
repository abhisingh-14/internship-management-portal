import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInternshipById } from '../../services/internshipService';
import useAuth from '../../hooks/useAuth';
import Loader from '../../components/common/Loader';
import AlertMessage from '../../components/common/AlertMessage';

/**
 * Formats an ISO date string into a readable, locale-aware form.
 * @param {string} isoDate
 * @returns {string}
 */
function formatDate(isoDate) {
  if (!isoDate) return 'N/A';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Formats an integer stipend value as a currency-style string.
 * @param {number} stipend
 * @returns {string}
 */
function formatStipend(stipend) {
  if (stipend === undefined || stipend === null || stipend === 0) return 'Unpaid';
  return `₹${stipend.toLocaleString('en-IN')} / month`;
}

/**
 * InternshipDetails — public detail page (Component 10) for a single
 * internship posting. Reachable without authentication for published
 * postings; the "Apply Now" action below is intentionally a disabled
 * placeholder pointing students toward the not-yet-built Applications
 * module (a future component), rather than silently omitted, so the
 * page's information hierarchy already reflects the eventual apply flow.
 */
function InternshipDetails() {
  const { internshipId } = useParams();
  const { isAuthenticated, user } = useAuth();

  const [internship, setInternship] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchInternship() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getInternshipById(internshipId);
        if (isMounted) {
          setInternship(data);
        }
      } catch (fetchError) {
        if (isMounted) {
          const status = fetchError.status;
          setError(
            status === 404
              ? 'This internship posting could not be found. It may have been removed or closed.'
              : fetchError.message || 'Unable to load this internship. Please try again.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchInternship();

    return () => {
      isMounted = false;
    };
  }, [internshipId]);

  if (isLoading) {
    return (
      <div className="container py-4">
        <Loader label="Loading internship details..." />
      </div>
    );
  }

  if (error || !internship) {
    return (
      <div className="container py-4">
        <AlertMessage type="danger" message={error || 'Internship not found.'} onClose={() => {}} />
        <Link to="/internships" className="btn btn-outline-primary mt-2">
          Back to Browse Internships
        </Link>
      </div>
    );
  }

  const isStudent = isAuthenticated && user?.role === 'student';

  return (
    <div className="container py-4">
      <nav aria-label="breadcrumb">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/internships">Internships</Link>
          </li>
          <li className="breadcrumb-item active text-truncate" aria-current="page">
            {internship.title}
          </li>
        </ol>
      </nav>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start mb-3">
            <div className="d-flex align-items-center mb-3 mb-md-0">
              {internship.company.logoUrl ? (
                <img
                  src={internship.company.logoUrl}
                  alt={`${internship.company.companyName} logo`}
                  className="rounded me-3"
                  style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="rounded bg-light d-flex align-items-center justify-content-center me-3 text-secondary"
                  style={{ width: '64px', height: '64px' }}
                >
                  <i className="bi bi-building fs-3" aria-hidden="true" />
                </div>
              )}
              <div>
                <h1 className="h4 mb-1">{internship.title}</h1>
                <p className="text-muted mb-0">{internship.company.companyName}</p>
              </div>
            </div>

            <div className="text-md-end">
              <span className="fs-5 fw-semibold text-success d-block">
                {formatStipend(internship.stipend)}
              </span>
              <span className="text-muted small">
                Application deadline: {formatDate(internship.applicationDeadline)}
              </span>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-6 col-md-3 mb-2">
              <div className="text-muted small">Location</div>
              <div className="fw-medium">
                <i className="bi bi-geo-alt me-1" aria-hidden="true" />
                {internship.location}
              </div>
            </div>
            <div className="col-6 col-md-3 mb-2">
              <div className="text-muted small">Duration</div>
              <div className="fw-medium">
                <i className="bi bi-clock me-1" aria-hidden="true" />
                {internship.duration}
              </div>
            </div>
            <div className="col-6 col-md-3 mb-2">
              <div className="text-muted small">Industry</div>
              <div className="fw-medium">{internship.company.industry || 'N/A'}</div>
            </div>
            <div className="col-6 col-md-3 mb-2">
              <div className="text-muted small">Posted</div>
              <div className="fw-medium">{formatDate(internship.createdAt)}</div>
            </div>
          </div>

          <h2 className="h5">Required Skills</h2>
          <div className="mb-4">
            {internship.requiredSkills.map((skill) => (
              <span key={skill} className="badge text-bg-light border me-1 mb-1">
                {skill}
              </span>
            ))}
          </div>

          <h2 className="h5">Description</h2>
          <p className="mb-4" style={{ whiteSpace: 'pre-wrap' }}>
            {internship.description}
          </p>

          {internship.company.description && (
            <>
              <h2 className="h5">About {internship.company.companyName}</h2>
              <p className="mb-4" style={{ whiteSpace: 'pre-wrap' }}>
                {internship.company.description}
              </p>
              {internship.company.website && (
                <p className="mb-4">
                  <a href={internship.company.website} target="_blank" rel="noopener noreferrer">
                    {internship.company.website}
                  </a>
                </p>
              )}
            </>
          )}

          <hr />

          {isStudent ? (
            <button type="button" className="btn btn-primary btn-lg" disabled title="Coming soon">
              Apply Now
            </button>
          ) : isAuthenticated ? (
            <AlertMessage
              type="info"
              message="Only student accounts can apply to internships."
              onClose={() => {}}
            />
          ) : (
            <div>
              <p className="mb-2">Sign in as a student to apply for this internship.</p>
              <Link to="/login" className="btn btn-primary">
                Log In to Apply
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InternshipDetails;
