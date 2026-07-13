import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../../components/common/Loader';
import AlertMessage from '../../components/common/AlertMessage';
import Pagination from '../../components/common/Pagination';
import { getSavedInternships, removeSavedInternship } from '../../services/savedInternshipService';
import { resolveFileUrl } from '../../utils/fileUrl';

const PAGE_SIZE = 10;

function SavedInternships() {
  const [bookmarks, setBookmarks] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [page, setPage] = useState(1);

  const fetchBookmarks = useCallback(async () => {
    setIsLoading(true);
    setAlert(null);
    try {
      const response = await getSavedInternships({
        page,
        limit: PAGE_SIZE,
      });
      setBookmarks(response.items);
      setMeta(response.meta || { page: 1, totalPages: 1 });
    } catch (error) {
      setAlert({ type: 'danger', message: error.message || 'Failed to load saved internships' });
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const handleRemoveBookmark = async (internshipId, title) => {
    const confirmed = window.confirm(`Are you sure you want to remove "${title}" from your saved internships?`);
    if (!confirmed) return;

    try {
      await removeSavedInternship(internshipId);
      setAlert({ type: 'success', message: 'Internship removed from saved list' });
      // Reset page if it was the last item on the page
      if (bookmarks.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchBookmarks();
      }
    } catch (error) {
      setAlert({ type: 'danger', message: error.message || 'Failed to remove saved internship' });
    }
  };

  function formatDate(dateString) {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function formatStipend(stipend) {
    if (stipend === undefined || stipend === null || stipend === 0) return 'Unpaid';
    return `₹${stipend.toLocaleString('en-IN')} / month`;
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Saved Internships</h2>
      </div>

      {alert && (
        <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
      )}

      {isLoading ? (
        <Loader label="Loading saved internships..." />
      ) : bookmarks.length === 0 ? (
        <div className="card text-center p-5 shadow-sm bg-light">
          <div className="card-body">
            <i className="bi bi-heart text-muted fs-1 mb-3" aria-hidden="true" />
            <h5 className="text-secondary">No saved internships</h5>
            <p className="text-muted">You haven't bookmarked any internships yet.</p>
            <Link to="/internships" className="btn btn-primary mt-2">
              Browse Internships
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="table-responsive shadow-sm rounded border bg-white">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Internship Title</th>
                  <th>Company</th>
                  <th>Stipend</th>
                  <th>Deadline</th>
                  <th>Saved On</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookmarks.map((bookmark) => (
                  <tr key={bookmark.id}>
                    <td>
                      <span className="fw-semibold text-dark">{bookmark.internship.title}</span>
                      <br />
                      <small className="text-muted">
                        <i className="bi bi-geo-alt me-1" aria-hidden="true" />
                        {bookmark.internship.location} ({bookmark.internship.duration})
                      </small>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        {bookmark.internship.companyLogoUrl ? (
                          <img
                            src={resolveFileUrl(bookmark.internship.companyLogoUrl)}
                            alt={`${bookmark.internship.companyName} logo`}
                            className="rounded me-2"
                            style={{ width: '24px', height: '24px', objectFit: 'cover' }}
                          />
                        ) : (
                          <i className="bi bi-building me-2 text-secondary" aria-hidden="true" />
                        )}
                        <span>{bookmark.internship.companyName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="fw-medium text-success">
                        {formatStipend(bookmark.internship.stipend)}
                      </span>
                    </td>
                    <td>{formatDate(bookmark.internship.applicationDeadline)}</td>
                    <td>{formatDate(bookmark.savedAt)}</td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm" role="group">
                        <Link
                          to={`/internships/${bookmark.internshipId}`}
                          className="btn btn-outline-primary"
                        >
                          View Details
                        </Link>
                        <button
                          type="button"
                          className="btn btn-outline-danger"
                          onClick={() => handleRemoveBookmark(bookmark.internshipId, bookmark.internship.title)}
                          title="Remove bookmark"
                        >
                          <i className="bi bi-trash" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <Pagination
              currentPage={meta.page || 1}
              totalPages={meta.totalPages || 1}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default SavedInternships;
