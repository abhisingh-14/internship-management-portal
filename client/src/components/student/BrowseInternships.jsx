import { useState, useEffect, useCallback } from 'react';
import { getPublishedInternships } from '../../services/internshipService';
import InternshipCard from '../../components/student/InternshipCard';
import InternshipFilterBar from '../../components/student/InternshipFilterBar';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';
import AlertMessage from '../../components/common/AlertMessage';

const DEFAULT_LIMIT = 9;

/**
 * BrowseInternships — public, student-facing page (Component 10) for
 * browsing and searching all active (published, non-expired) internship
 * postings. Owns data fetching and pagination/filter state locally, per
 * the "pages own data fetching" convention in
 * docs/04_Project_Architecture.md §12. No authentication is required to
 * view this page; students may browse before logging in.
 */
function BrowseInternships() {
  const [internships, setInternships] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: DEFAULT_LIMIT, totalItems: 0, totalPages: 1 });
  const [filters, setFilters] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInternships = useCallback(async (page, activeFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const { items, meta: responseMeta } = await getPublishedInternships({
        ...activeFilters,
        page,
        limit: DEFAULT_LIMIT,
        sort: '-createdAt',
      });
      setInternships(items);
      setMeta(responseMeta);
    } catch (fetchError) {
      setError(fetchError.message || 'Unable to load internships. Please try again.');
      setInternships([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInternships(currentPage, filters);
  }, [fetchInternships, currentPage, filters]);

  function handleSearch(newFilters) {
    setFilters(newFilters);
    setCurrentPage(1);
  }

  function handlePageChange(page) {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h1 className="h3 mb-1">Browse Internships</h1>
        <p className="text-muted mb-0">
          Explore active internship opportunities from verified companies.
        </p>
      </div>

      <InternshipFilterBar initialFilters={filters} onSearch={handleSearch} isLoading={isLoading} />

      {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}

      {isLoading ? (
        <Loader label="Loading internships..." />
      ) : internships.length === 0 ? (
        <div className="text-center py-5 text-muted">
          <i className="bi bi-search display-4 d-block mb-3" aria-hidden="true" />
          <p className="mb-0">No internships match your search. Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <p className="text-muted small mb-3">
            Showing {internships.length} of {meta.totalItems} internship{meta.totalItems === 1 ? '' : 's'}
          </p>
          <div className="row">
            {internships.map((internship) => (
              <InternshipCard key={internship.id} internship={internship} />
            ))}
          </div>
          <Pagination
            currentPage={meta.page}
            totalPages={meta.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
}

export default BrowseInternships;
