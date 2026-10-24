import { useState } from 'react';
import { useQueue } from '../context/QueueContext';

export default function JoinQueue() {
  const {
    services,
    generateToken,
    activeToken,
    setCurrentView,
    waitingTokens,
    servingTokens,
    avgServiceTime
  } = useQueue();

  const [selectedService, setSelectedService] = useState(services[0] || 'General Enquiry');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate clicks

    setIsSubmitting(true);
    generateToken(selectedService, displayName);
    // Instantaneous generation; component will unmount as view switches to 'customer-confirmed'
  };

  return (
    <div className="join-queue-container">
      {/* Existing active token notice if returning */}
      {activeToken && activeToken.status !== 'completed' && (
        <div className="existing-token-banner">
          <div className="banner-left">
            <span className="banner-label">You already have an active token:</span>
            <strong className="banner-token">{activeToken.tokenNumber}</strong>
            <span className="banner-status">({activeToken.status === 'serving' ? 'Serving now' : 'Waiting'})</span>
          </div>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setCurrentView('customer-track')}
          >
            Track My Turn
          </button>
        </div>
      )}

      <div className="form-card">
        <div className="form-header">
          <h1 className="form-title">Join the queue</h1>
          <p className="form-subtitle">Get your token and check when it's your turn.</p>
        </div>

        <form onSubmit={handleSubmit} className="join-form">
          <div className="form-group">
            <label htmlFor="service-select" className="form-label">
              Select Service <span className="required-mark" aria-hidden="true">*</span>
            </label>
            <select
              id="service-select"
              className="form-select"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              required
            >
              {services.map((svc) => (
                <option key={svc} value={svc}>
                  {svc}
                </option>
              ))}
            </select>
            <span className="field-hint">Choose the service counter you need assistance with.</span>
          </div>

          <div className="form-group">
            <label htmlFor="display-name" className="form-label">
              Your Name <span className="optional-tag">(Optional)</span>
            </label>
            <input
              id="display-name"
              type="text"
              className="form-input"
              placeholder="e.g. John Doe or leave blank"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={50}
              autoComplete="name"
            />
            <span className="field-hint">
              This helps staff identify you when your token is called.
            </span>
          </div>

          <div className="privacy-note">
            <svg
              className="privacy-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>No phone numbers, email addresses, or accounts required.</span>
          </div>

          <button
            type="submit"
            className="primary-action-btn"
            disabled={isSubmitting}
            id="get-token-button"
          >
            {isSubmitting ? 'Generating Token...' : 'Get My Token'}
          </button>
        </form>
      </div>

      {/* Real-time queue summary below form */}
      <div className="current-status-preview">
        <h2 className="preview-heading">Current Queue Status</h2>
        <div className="preview-stats-grid">
          <div className="preview-stat-card">
            <span className="stat-label">Currently Serving</span>
            <strong className="stat-value highlight-value">
              {servingTokens.length > 0
                ? servingTokens.map((t) => t.tokenNumber).join(', ')
                : 'None right now'}
            </strong>
          </div>
          <div className="preview-stat-card">
            <span className="stat-label">People Waiting</span>
            <strong className="stat-value">{waitingTokens.length}</strong>
          </div>
          <div className="preview-stat-card">
            <span className="stat-label">Est. Service Speed</span>
            <strong className="stat-value">~{avgServiceTime} min / person</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
