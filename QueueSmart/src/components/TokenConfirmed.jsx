import { useQueue } from '../context/QueueContext';

export default function TokenConfirmed() {
  const {
    activeToken,
    setCurrentView,
    getPeopleAhead,
    getEstimatedWaitTime,
    servingTokens,
    avgServiceTime
  } = useQueue();

  if (!activeToken) {
    return (
      <div className="empty-state-card">
        <h2>No Active Token</h2>
        <p>You haven't generated a token yet, or your previous session ended.</p>
        <button
          type="button"
          className="primary-action-btn"
          onClick={() => setCurrentView('customer-join')}
        >
          Join the Queue
        </button>
      </div>
    );
  }

  const peopleAhead = getPeopleAhead(activeToken.id);
  const estimatedMinutes = getEstimatedWaitTime(activeToken.id);

  // Serving tokens representation
  const servingSummary =
    servingTokens.length > 0
      ? servingTokens.map((t) => `${t.tokenNumber} (${t.counter || 'Counter 1'})`).join(', ')
      : 'None at the moment';

  return (
    <div className="confirmed-container">
      <div className="confirmed-card">
        <div className="confirmed-badge-row">
          <span className="success-tag">Token Generated</span>
        </div>

        <h1 className="confirmed-title">Your token is confirmed</h1>
        <p className="confirmed-subtitle">Please keep this screen open or track your turn below.</p>

        <div className="token-display-box">
          <span className="token-display-label">Your Token Number</span>
          <div className="token-number-large" id="confirmed-token-number">
            {activeToken.tokenNumber}
          </div>
          {activeToken.name && activeToken.name !== 'Walk-in Customer' && (
            <div className="token-display-name">Assigned to: {activeToken.name}</div>
          )}
        </div>

        <div className="confirmed-details-list">
          <div className="detail-item">
            <span className="detail-label">Service</span>
            <strong className="detail-val">{activeToken.service}</strong>
          </div>

          <div className="detail-item">
            <span className="detail-label">Currently Serving</span>
            <strong className="detail-val">{servingSummary}</strong>
          </div>

          <div className="detail-item">
            <span className="detail-label">People Ahead of You</span>
            <strong className="detail-val highlight-val">
              {peopleAhead === 0 ? 'You are next in line!' : `${peopleAhead} people ahead`}
            </strong>
          </div>

          <div className="detail-item">
            <span className="detail-label">Estimated Wait Time</span>
            <strong className="detail-val highlight-val">
              {peopleAhead === 0
                ? 'Under 5 minutes'
                : `~${estimatedMinutes} mins (${peopleAhead} ahead × ${avgServiceTime} min/person)`}
            </strong>
          </div>
        </div>

        <p className="disclaimer-text">
          * Waiting times are calculated estimates based on current service speed, not guarantees.
        </p>

        <div className="confirmed-actions">
          <button
            type="button"
            className="primary-action-btn"
            id="track-turn-button"
            onClick={() => setCurrentView('customer-track')}
          >
            Track My Turn
          </button>

          <button
            type="button"
            className="secondary-btn"
            onClick={() => setCurrentView('customer-join')}
          >
            Get Another Token
          </button>
        </div>
      </div>
    </div>
  );
}
