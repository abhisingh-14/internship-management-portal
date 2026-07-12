import { useEffect, useState, useCallback } from 'react';
import Loader from '../../components/common/Loader';
import AlertMessage from '../../components/common/AlertMessage';
import Pagination from '../../components/common/Pagination';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../../services/notificationService';

const PAGE_SIZE = 10;

function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, totalItems: 0 });
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setAlert(null);
    try {
      const response = await getNotifications({
        unreadOnly: unreadOnly || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setNotifications(response.items);
      setMeta(response.meta || { page: 1, totalPages: 1, totalItems: 0 });
    } catch (error) {
      setAlert({ type: 'danger', message: error.message || 'Failed to load notifications' });
    } finally {
      setIsLoading(false);
    }
  }, [page, unreadOnly]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      // Dispatch global event so Navbar unread count updates
      window.dispatchEvent(new CustomEvent('notifications:updated'));
      await fetchNotifications();
    } catch (error) {
      setAlert({ type: 'danger', message: error.message || 'Failed to mark notification as read' });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      window.dispatchEvent(new CustomEvent('notifications:updated'));
      setAlert({ type: 'success', message: 'All notifications marked as read' });
      await fetchNotifications();
    } catch (error) {
      setAlert({ type: 'danger', message: error.message || 'Failed to mark all as read' });
    }
  };

  const handleDelete = async (notificationId) => {
    const confirmed = window.confirm('Are you sure you want to delete this notification?');
    if (!confirmed) return;

    try {
      await deleteNotification(notificationId);
      window.dispatchEvent(new CustomEvent('notifications:updated'));
      setAlert({ type: 'success', message: 'Notification deleted successfully' });
      
      // Handle page decrement if last item deleted
      if (notifications.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await fetchNotifications();
      }
    } catch (error) {
      setAlert({ type: 'danger', message: error.message || 'Failed to delete notification' });
    }
  };

  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }) + ' ' + date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="container py-4">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h2>Notifications</h2>
          <p className="text-muted mb-0">Stay updated on your application status changes and announcements.</p>
        </div>
        {notifications.some(n => !n.isRead) && (
          <button
            type="button"
            className="btn btn-outline-primary btn-sm align-self-start align-self-md-center"
            onClick={handleMarkAllRead}
          >
            <i className="bi bi-check-all me-1" aria-hidden="true" />
            Mark All as Read
          </button>
        )}
      </div>

      {alert && (
        <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />
      )}

      {/* Filter and Tab Section */}
      <div className="d-flex gap-2 mb-3">
        <button
          type="button"
          className={`btn btn-sm ${!unreadOnly ? 'btn-secondary' : 'btn-outline-secondary'}`}
          onClick={() => {
            setUnreadOnly(false);
            setPage(1);
          }}
        >
          All Notifications
        </button>
        <button
          type="button"
          className={`btn btn-sm ${unreadOnly ? 'btn-secondary' : 'btn-outline-secondary'}`}
          onClick={() => {
            setUnreadOnly(true);
            setPage(1);
          }}
        >
          Unread Only
        </button>
      </div>

      {isLoading ? (
        <Loader label="Loading notifications..." />
      ) : notifications.length === 0 ? (
        <div className="card text-center p-5 shadow-sm bg-light">
          <div className="card-body">
            <i className="bi bi-bell-slash text-muted fs-1 mb-3" aria-hidden="true" />
            <h5 className="text-secondary">No notifications found</h5>
            <p className="text-muted">You are all caught up!</p>
          </div>
        </div>
      ) : (
        <>
          <div className="d-flex flex-column gap-3 mb-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`card shadow-sm border-0 ${
                  !notification.isRead
                    ? 'border-start border-primary border-4 bg-white'
                    : 'bg-light text-muted'
                }`}
              >
                <div className="card-body py-3 d-flex justify-content-between align-items-start gap-3">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <h5 className={`card-title h6 mb-0 ${!notification.isRead ? 'fw-bold text-dark' : 'fw-semibold text-secondary'}`}>
                        {notification.title}
                      </h5>
                      {!notification.isRead && (
                        <span className="badge bg-primary rounded-pill small" style={{ fontSize: '0.65rem' }}>
                          New
                        </span>
                      )}
                    </div>
                    <p className="card-text mb-2 small text-dark" style={{ whiteSpace: 'pre-wrap' }}>
                      {notification.message}
                    </p>
                    <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                      <i className="bi bi-clock me-1" aria-hidden="true" />
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  <div className="d-flex gap-2">
                    {!notification.isRead && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success py-1 px-2"
                        onClick={() => handleMarkAsRead(notification.id)}
                        title="Mark as read"
                      >
                        <i className="bi bi-check-lg" aria-hidden="true" />
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger py-1 px-2"
                      onClick={() => handleDelete(notification.id)}
                      title="Delete notification"
                    >
                      <i className="bi bi-trash" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={meta.page || 1}
            totalPages={meta.totalPages || 1}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

export default Notifications;
