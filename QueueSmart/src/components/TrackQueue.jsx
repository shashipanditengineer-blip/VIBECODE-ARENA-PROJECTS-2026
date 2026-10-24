import { useState } from 'react';
import { useQueue } from '../context/QueueContext';

export default function TrackQueue() {
  const {
    activeToken,
    tokens,
    setActiveTokenId,
    setCurrentView,
    getPeopleAhead,
    getEstimatedWaitTime,
    servingTokens,
    avgServiceTime
  } = useQueue();

  const [lookupInput, setLookupInput] = useState('');
  const [lookupError, setLookupError] = useState('');

  const handleLookup = (e) => {
    e.preventDefault();
    setLookupError('');
    const clean = lookupInput.trim().toUpperCase();
    if (!clean) return;

    // Search by tokenNumber (e.g. Q-102) or partial number
    const found = tokens.find(
      (t) => t.tokenNumber.toUpperCase() === clean || t.tokenNumber.toUpperCase() === `Q-${clean}`
    );

    if (found) {
      setActiveTokenId(found.id);
      setLookupInput('');
    } else {
      setLookupError(`Token "${clean}" not found in current queue records.`);
    }
  };

  // If no active token is selected
  if (!activeToken) {
    return (
      <div className="track-container">
        <div className="track-card empty-track">
          <h1 className="track-heading">Track your turn</h1>
          <p className="track-sub">Enter your token number to check your status and estimated wait time.</p>

          <form onSubmit={handleLookup} className="lookup-form">
            <div className="form-group">
              <label htmlFor="token-lookup-input" className="form-label">
                Token Number
              </label>
              <div className="lookup-input-row">
                <input
                  id="token-lookup-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Q-102 or 102"
                  value={lookupInput}
                  onChange={(e) => setLookupInput(e.target.value)}
                  required
                />
                <button type="submit" className="primary-action-btn lookup-btn">
                  Find Token
                </button>
              </div>
              {lookupError && <div className="error-message" role="alert">{lookupError}</div>}
            </div>
          </form>

          <div className="or-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="secondary-btn full-width"
            onClick={() => setCurrentView('customer-join')}
          >
            Get a New Token
          </button>
        </div>
      </div>
    );
  }

  const peopleAhead = getPeopleAhead(activeToken.id);
  const estimatedMinutes = getEstimatedWaitTime(activeToken.id);

  // Status-specific banner message
  let statusBannerClass = 'status-banner-waiting';
  let statusTitle = 'Waiting in Queue';
  let statusDescription =
    peopleAhead === 0
      ? 'You are next in line! Please prepare your documents and stay near the counter.'
      : `There are ${peopleAhead} ${peopleAhead === 1 ? 'person' : 'people'} ahead of you.`;

  if (activeToken.status === 'serving') {
    statusBannerClass = 'status-banner-serving';
    statusTitle = "It's Your Turn!";
    statusDescription = `Please proceed immediately to ${activeToken.counter || 'Counter 1'}.`;
  } else if (activeToken.status === 'completed') {
    statusBannerClass = 'status-banner-completed';
    statusTitle = 'Service Completed';
    statusDescription = `Your token was completed at ${activeToken.counter || 'the counter'}. Thank you!`;
  }

  // Summary of currently serving across all counters
  const servingSummary =
    servingTokens.length > 0
      ? servingTokens.map((t) => `${t.tokenNumber} at ${t.counter || 'Counter 1'}`).join(', ')
      : 'None at the moment';

  return (
    <div className="track-container">
      <div className="track-card">
        {/* Status Alert Banner */}
        <div className={`status-banner ${statusBannerClass}`} role="status">
          <div className="status-banner-title">{statusTitle}</div>
          <div className="status-banner-desc">{statusDescription}</div>

          {activeToken.status === 'waiting' && (
            <div className="status-banner-next-steps">
              <span className="step-highlight-label step-highlight-waiting">What to do:</span> Please stay nearby. When your turn arrives, this screen will notify you with your counter number.
            </div>
          )}

          {activeToken.status === 'serving' && (
            <div className="status-banner-next-steps">
              <span className="step-highlight-label">Action required:</span> Please walk to <strong>{activeToken.counter || 'Counter 1'}</strong> now and show your token number <strong>{activeToken.tokenNumber}</strong>.
            </div>
          )}

          {activeToken.status === 'completed' && (
            <div className="status-banner-next-steps">
              Your consultation is complete. Thank you for your patience! You may leave the counter or get a new token below if you need another service.
            </div>
          )}
        </div>

        {/* Visual Progress Steps */}
        <div className="progress-steps" aria-label="Queue Progress Steps">
          <div className="step-item step-completed">
            <div className="step-circle">✓</div>
            <span className="step-label">Token Issued</span>
          </div>
          <div className="step-line active"></div>
          <div
            className={`step-item ${
              activeToken.status === 'waiting'
                ? 'step-current'
                : 'step-completed'
            }`}
          >
            <div className="step-circle">2</div>
            <span className="step-label">In Waiting Line</span>
          </div>
          <div className={`step-line ${activeToken.status !== 'waiting' ? 'active' : ''}`}></div>
          <div
            className={`step-item ${
              activeToken.status === 'serving'
                ? 'step-current'
                : activeToken.status === 'completed'
                ? 'step-completed'
                : ''
            }`}
          >
            <div className="step-circle">3</div>
            <span className="step-label">Serving</span>
          </div>
          <div className={`step-line ${activeToken.status === 'completed' ? 'active' : ''}`}></div>
          <div className={`step-item ${activeToken.status === 'completed' ? 'step-completed' : ''}`}>
            <div className="step-circle">4</div>
            <span className="step-label">Done</span>
          </div>
        </div>

        {/* Token summary header */}
        <div className="track-header-box">
          <div className="track-header-left">
            <span className="track-header-label">Your Token</span>
            <span className="track-token-number" id="track-token-number">{activeToken.tokenNumber}</span>
            {activeToken.name && activeToken.name !== 'Walk-in Customer' && (
              <span className="track-token-name">{activeToken.name}</span>
            )}
          </div>
          <div className="track-header-right">
            <span className="service-tag">{activeToken.service}</span>
            <span className={`status-pill pill-${activeToken.status}`}>
              {activeToken.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* 4 Core metrics */}
        <div className="track-metrics-grid">
          <div className="metric-box">
            <span className="metric-label">Current Serving Token</span>
            <strong className="metric-value" id="current-serving-token">{servingSummary}</strong>
            <span className="metric-sub">Active at counters</span>
          </div>

          <div className="metric-box">
            <span className="metric-label">People Ahead of You</span>
            <strong className="metric-value" id="people-ahead-count">
              {activeToken.status === 'waiting' ? peopleAhead : 0}
            </strong>
            <span className="metric-sub">
              {activeToken.status === 'waiting'
                ? peopleAhead === 0
                  ? 'You are next'
                  : 'In line before you'
                : 'Not in waiting line'}
            </span>
          </div>

          <div className="metric-box">
            <span className="metric-label">Estimated Waiting Time</span>
            <strong className="metric-value" id="estimated-wait-time">
              {activeToken.status === 'waiting'
                ? peopleAhead === 0
                  ? '~1-2 mins'
                  : `~${estimatedMinutes} mins`
                : activeToken.status === 'serving'
                ? '0 mins (Now)'
                : '0 mins'}
            </strong>
            <span className="metric-sub">
              {activeToken.status === 'waiting'
                ? `${peopleAhead} ahead × ${avgServiceTime}m avg`
                : 'Service in progress'}
            </span>
          </div>

          <div className="metric-box">
            <span className="metric-label">Current Status</span>
            <strong className={`metric-value status-text-${activeToken.status}`} id="current-status-text">
              {activeToken.status === 'waiting'
                ? 'Waiting'
                : activeToken.status === 'serving'
                ? 'Serving'
                : 'Completed'}
            </strong>
            <span className="metric-sub">
              {activeToken.status === 'serving' ? activeToken.counter || 'At Counter' : 'Real-time state'}
            </span>
          </div>
        </div>

        {/* Formula breakdown - compact and visually secondary */}
        <div className="formula-explanation-box">
          <span className="formula-line">
            <strong>Calculation:</strong> {activeToken.status === 'waiting'
              ? `${peopleAhead} ahead × ${avgServiceTime} min/person = ~${estimatedMinutes} mins`
              : activeToken.status === 'serving'
              ? 'Currently serving at counter'
              : 'Consultation finished'}
          </span>
          <span className="formula-muted-note">* Estimates based on average speed, not guarantees.</span>
        </div>

        {/* Footer actions */}
        <div className="track-footer-actions">
          <button
            type="button"
            className={activeToken.status === 'completed' ? 'primary-action-btn' : 'secondary-btn'}
            onClick={() => setCurrentView('customer-join')}
          >
            {activeToken.status === 'completed' ? 'Done • Return to Home' : 'Get Another Token'}
          </button>

          {/* Switch/lookup another token */}
          <details className="lookup-details">
            <summary className="lookup-summary-btn">Track a different token</summary>
            <form onSubmit={handleLookup} className="lookup-inline-form">
              <input
                type="text"
                className="form-input form-input-sm"
                placeholder="Token number (e.g. Q-103)"
                value={lookupInput}
                onChange={(e) => setLookupInput(e.target.value)}
              />
              <button type="submit" className="secondary-btn btn-sm">
                Switch
              </button>
            </form>
            {lookupError && <div className="error-message" role="alert">{lookupError}</div>}
          </details>
        </div>
      </div>
    </div>
  );
}
