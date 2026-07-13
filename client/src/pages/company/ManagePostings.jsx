import { useCallback, useEffect, useState } from 'react';
import Loader from '../../components/common/Loader';
import AlertMessage from '../../components/common/AlertMessage';
import Pagination from '../../components/common/Pagination';
import PostingsTable from '../../components/company/PostingsTable';
import PostingForm from '../../components/company/PostingForm';
import {
  getMyInternships,
  createInternship,
  updateInternship,
  updateInternshipStatus,
  deleteInternship,
} from '../../services/internshipService';

const STATUS_FILTER_OPTIONS = ['', 'draft', 'published', 'closed', 'flagged', 'removed'];
const PAGE_SIZE = 10;

/**
 * Company-facing page for managing internship postings: create, view own,
 * search/filter, edit, toggle status, and delete (hard or soft, decided
 * server-side based on whether applications exist).
 */
function ManagePostings() {
  const [internships, setInternships] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alert, setAlert] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingInternship, setEditingInternship] = useState(null);
  const [formErrors, setFormErrors] = useState([]);

  const fetchInternships = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getMyInternships({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
        page,
        limit: PAGE_SIZE,
        sort: '-createdAt',
      });
      setInternships(response.data);
      setMeta(response.meta || { page: 1, totalPages: 1 });
    } catch (error) {
      setAlert({ type: 'danger', message: error.message || 'Failed to load internship postings' });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter, page]);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
  };

  const openCreateModal = () => {
    setEditingInternship(null);
    setFormErrors([]);
    setShowFormModal(true);
  };

  const openEditModal = (internship) => {
    setEditingInternship(internship);
    setFormErrors([]);
    setShowFormModal(true);
  };

  const closeModal = () => {
    setShowFormModal(false);
    setEditingInternship(null);
    setFormErrors([]);
  };

  const handleFormSubmit = async (payload) => {
    setIsSubmitting(true);
    setFormErrors([]);
    try {
      if (editingInternship) {
        await updateInternship(editingInternship.id, payload);
        setAlert({ type: 'success', message: 'Internship posting updated successfully' });
      } else {
        await createInternship(payload);
        setAlert({ type: 'success', message: 'Internship posting created successfully' });
      }
      closeModal();
      await fetchInternships();
    } catch (error) {
      setFormErrors(error.errors || []);
      setAlert({ type: 'danger', message: error.message || 'Failed to save internship posting' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (internship) => {
    const confirmed = window.confirm(`Delete "${internship.title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteInternship(internship.id);
      setAlert({ type: 'success', message: 'Internship posting deleted successfully' });
      await fetchInternships();
    } catch (error) {
      setAlert({ type: 'danger', message: error.message || 'Failed to delete internship posting' });
    }
  };

  const handleToggleStatus = async (internship, newStatus) => {
    try {
      await updateInternshipStatus(internship.id, newStatus);
      setAlert({ type: 'success', message: `Posting status updated to ${newStatus}` });
      await fetchInternships();
    } catch (error) {
      setAlert({ type: 'danger', message: error.message || 'Failed to update posting status' });
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Manage Internship Postings</h2>
        <button type="button" className="btn btn-primary" onClick={openCreateModal}>
          + New Posting
        </button>
      </div>

      {alert && (
        <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
      )}

      <form className="row g-2 mb-4" onSubmit={handleSearchSubmit}>
        <div className="col-md-6">
          <input
            type="text"
            className="form-control"
            placeholder="Search by title or keyword"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="col-md-3">
          <select
            className="form-select"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option || 'all'} value={option}>
                {option ? option.charAt(0).toUpperCase() + option.slice(1) : 'All statuses'}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <button type="submit" className="btn btn-outline-primary w-100">
            Search
          </button>
        </div>
      </form>

      {isLoading ? (
        <Loader label="Loading internship postings..." />
      ) : (
        <>
          <PostingsTable
            internships={internships}
            onEdit={openEditModal}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
          <div className="mt-3">
            <Pagination
              currentPage={meta.page || 1}
              totalPages={meta.totalPages || 1}
              onPageChange={setPage}
            />
          </div>
        </>
      )}

      {showFormModal && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingInternship ? 'Edit Internship Posting' : 'Create Internship Posting'}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal} aria-label="Close" />
              </div>
              <div className="modal-body">
                <PostingForm
                  initialValues={editingInternship}
                  onSubmit={handleFormSubmit}
                  onCancel={closeModal}
                  isSubmitting={isSubmitting}
                  serverErrors={formErrors}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagePostings;
