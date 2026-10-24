import { useQueue } from '../context/QueueContext';

export default function NotificationToast() {
  const { notification, showNotification } = useQueue();

  if (!notification) return null;

  return (
    <div
      className={`notification-toast notification-${notification.type}`}
      role="status"
      aria-live="polite"
    >
      <div className="notification-content">
        <span className="notification-badge">Simulated Update</span>
        <span className="notification-text">{notification.message}</span>
      </div>
      <button
        type="button"
        className="notification-close-btn"
        onClick={() => showNotification('', '')}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}
