import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * InternshipFilterBar — a reusable, controlled filter form for the
 * internship browse/search page. Owns only its own input state and
 * reports changes to the parent via onSearch; it performs no data
 * fetching itself, per the "components receive data via props, pages own
 * data fetching" rule in docs/05_Coding_Standards.md §13.
 *
 * @param {object} props
 * @param {object} props.initialFilters - current filter values from the parent page.
 * @param {(filters: object) => void} props.onSearch - called with the new filter set on submit or reset.
 * @param {boolean} props.isLoading - disables the submit button while a search request is in flight.
 */
function InternshipFilterBar({ initialFilters, onSearch, isLoading }) {
  const [search, setSearch] = useState(initialFilters.search || '');
  const [location, setLocation] = useState(initialFilters.location || '');
  const [duration, setDuration] = useState(initialFilters.duration || '');
  const [minStipend, setMinStipend] = useState(initialFilters.minStipend || '');
  const [maxStipend, setMaxStipend] = useState(initialFilters.maxStipend || '');

  // Keep local form state in sync if the parent resets filters externally
  // (e.g. a "Clear all" action elsewhere on the page).
  useEffect(() => {
    setSearch(initialFilters.search || '');
    setLocation(initialFilters.location || '');
    setDuration(initialFilters.duration || '');
    setMinStipend(initialFilters.minStipend || '');
    setMaxStipend(initialFilters.maxStipend || '');
  }, [initialFilters]);

  function handleSubmit(event) {
    event.preventDefault();
    onSearch({
      search: search.trim(),
      location: location.trim(),
      duration: duration.trim(),
      minStipend: minStipend === '' ? undefined : Number(minStipend),
      maxStipend: maxStipend === '' ? undefined : Number(maxStipend),
    });
  }

  function handleReset() {
    setSearch('');
    setLocation('');
    setDuration('');
    setMinStipend('');
    setMaxStipend('');
    onSearch({});
  }

  return (
    <form className="card shadow-sm p-3 mb-4" onSubmit={handleSubmit} role="search">
      <div className="row g-3 align-items-end">
        <div className="col-12 col-md-4">
          <label htmlFor="internship-search" className="form-label">
            Keyword
          </label>
          <input
            id="internship-search"
            type="text"
            className="form-control"
            placeholder="Title or description"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="col-6 col-md-2">
          <label htmlFor="internship-location" className="form-label">
            Location
          </label>
          <input
            id="internship-location"
            type="text"
            className="form-control"
            placeholder="e.g. Remote"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
          />
        </div>

        <div className="col-6 col-md-2">
          <label htmlFor="internship-duration" className="form-label">
            Duration
          </label>
          <input
            id="internship-duration"
            type="text"
            className="form-control"
            placeholder="e.g. 3 months"
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
          />
        </div>

        <div className="col-6 col-md-2">
          <label htmlFor="internship-min-stipend" className="form-label">
            Min Stipend
          </label>
          <input
            id="internship-min-stipend"
            type="number"
            min="0"
            className="form-control"
            placeholder="0"
            value={minStipend}
            onChange={(event) => setMinStipend(event.target.value)}
          />
        </div>

        <div className="col-6 col-md-2">
          <label htmlFor="internship-max-stipend" className="form-label">
            Max Stipend
          </label>
          <input
            id="internship-max-stipend"
            type="number"
            min="0"
            className="form-control"
            placeholder="Any"
            value={maxStipend}
            onChange={(event) => setMaxStipend(event.target.value)}
          />
        </div>
      </div>

      <div className="mt-3 d-flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
              Searching...
            </>
          ) : (
            'Search'
          )}
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={handleReset} disabled={isLoading}>
          Clear Filters
        </button>
      </div>
    </form>
  );
}

InternshipFilterBar.propTypes = {
  initialFilters: PropTypes.shape({
    search: PropTypes.string,
    location: PropTypes.string,
    duration: PropTypes.string,
    minStipend: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    maxStipend: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  onSearch: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

InternshipFilterBar.defaultProps = {
  initialFilters: {},
  isLoading: false,
};

export default InternshipFilterBar;
