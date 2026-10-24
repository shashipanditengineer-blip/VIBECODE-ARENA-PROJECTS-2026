import { useState } from 'react';
import { useQueue } from '../context/QueueContext';

export default function StaffView() {
  const {
    tokens,
    counters,
    openCounters,
    waitingTokens,
    servingTokens,
    completedTokens,
    avgServiceTime,
    queueSuggestion,
    callNext,
    completeService,
    toggleCounter,
    addCounter,
    removeCounter,
    updateAvgServiceTime,
    resetDemoData
  } = useQueue();

  const [serviceTimeInput, setServiceTimeInput] = useState(avgServiceTime);
  const [timeError, setTimeError] = useState('');
  const [prevAvgTime, setPrevAvgTime] = useState(avgServiceTime);
  const [showResetModal, setShowResetModal] = useState(false);

  // Sync input when avgServiceTime changes externally or via reset
  if (prevAvgTime !== avgServiceTime) {
    setPrevAvgTime(avgServiceTime);
    setServiceTimeInput(avgServiceTime);
    setTimeError('');
  }

  const handleServiceTimeSubmit = (e) => {
    e.preventDefault();
    const val = Number(serviceTimeInput);
    if (isNaN(val) || val < 1 || val > 60) {
      setTimeError('Please enter a valid time between 1 and 60 minutes.');
      return;
    }
    setTimeError('');
    updateAvgServiceTime(val);
  };

  const handleResetConfirm = () => {
    resetDemoData();
    setShowResetModal(false);
  };

  const allCountersClosed = counters.length > 0 && counters.every((c) => !c.isOpen);

  return (
    <div className="staff-container">
      {/* Page Title & Status */}
      <div className="staff-header-row">
        <div>
          <h1 className="staff-heading">Staff Queue Management</h1>
          <p className="staff-sub">
            Monitor waiting lines, manage service counters, and call customers in FIFO order.
          </p>
        </div>
        <div className="staff-header-actions">
          <button
            type="button"
            className="secondary-btn btn-danger-subtle"
            id="reset-demo-queue-btn"
            onClick={() => setShowResetModal(true)}
          >
            Reset Demo Queue
          </button>
        </div>
      </div>

      {/* High Queue Volume Recommendation Banner */}
      {queueSuggestion && queueSuggestion.show && (
        <div className="alert-recommendation" role="alert">
          <div className="alert-icon">💡</div>
          <div className="alert-body">
            <strong className="alert-title">{queueSuggestion.title}</strong>
            <p className="alert-text">{queueSuggestion.message}</p>
          </div>
          {counters.some((c) => !c.isOpen) && (
            <button
              type="button"
              className="alert-btn"
              onClick={() => {
                const closed = counters.find((c) => !c.isOpen);
                if (closed) toggleCounter(closed.id);
              }}
            >
              Open {counters.find((c) => !c.isOpen)?.name || 'Counter'}
            </button>
          )}
        </div>
      )}

      {/* Alert when all counters are closed but people are waiting */}
      {allCountersClosed && waitingTokens.length > 0 && (
        <div className="alert-recommendation alert-closed-all" role="alert">
          <div className="alert-icon">⚠️</div>
          <div className="alert-body">
            <strong className="alert-title">All Service Counters Are Closed</strong>
            <p className="alert-text">
              There are {waitingTokens.length} customers waiting, but all counters are closed. Open a counter to resume service.
            </p>
          </div>
          {counters.length > 0 && (
            <button
              type="button"
              className="alert-btn"
              onClick={() => toggleCounter(counters[0].id)}
            >
              Open {counters[0].name}
            </button>
          )}
        </div>
      )}

      {/* Top Metrics Row */}
      <div className="metrics-summary-grid">
        <div className="summary-card">
          <span className="summary-label">Waiting in Queue</span>
          <strong className="summary-value text-teal" id="staff-waiting-count">
            {waitingTokens.length}
          </strong>
          <span className="summary-footnote">First-In First-Out</span>
        </div>

        <div className="summary-card">
          <span className="summary-label">Currently Serving</span>
          <strong className="summary-value text-navy" id="staff-serving-count">
            {servingTokens.length}
          </strong>
          <span className="summary-footnote">
            Across {openCounters.length} active counter{openCounters.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="summary-card">
          <span className="summary-label">Completed Today</span>
          <strong className="summary-value" id="staff-completed-count">
            {completedTokens.length}
          </strong>
          <span className="summary-footnote">Customers served</span>
        </div>

        <div className="summary-card">
          <span className="summary-label">Avg. Service Time</span>
          <strong className="summary-value">{avgServiceTime} min</strong>
          <span className="summary-footnote">Used for wait calculation</span>
        </div>
      </div>

      {/* Counter Controls Grid */}
      <div className="section-block">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">Service Counters</h2>
            <p className="section-subtitle">
              Manage counter availability and trigger customer calls per desk.
            </p>
          </div>
          <div className="counter-head-actions">
            <button
              type="button"
              className="secondary-btn btn-sm"
              id="add-counter-button"
              onClick={addCounter}
              title="Add a new counter"
            >
              + Add Counter
            </button>
          </div>
        </div>

        <div className="counters-grid">
          {counters.map((counter) => {
            const currentServingToken = tokens.find((t) => t.id === counter.currentTokenId);
            const isServing = Boolean(currentServingToken);
            const hasWaiting = waitingTokens.length > 0;

            return (
              <div
                key={counter.id}
                className={`counter-card ${!counter.isOpen ? 'counter-closed' : ''}`}
                id={`counter-card-${counter.id}`}
              >
                <div className="counter-top">
                  <div className="counter-identity">
                    <span className="counter-name">{counter.name}</span>
                    <span className={`counter-status-pill ${counter.isOpen ? 'pill-open' : 'pill-closed'}`}>
                      {counter.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>

                  <div className="counter-switch">
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => toggleCounter(counter.id)}
                      disabled={isServing}
                      title={
                        isServing
                          ? 'Cannot close counter while serving a customer'
                          : counter.isOpen
                          ? 'Close Counter'
                          : 'Open Counter'
                      }
                    >
                      {counter.isOpen ? 'Close Counter' : 'Open Counter'}
                    </button>
                    {counters.length > 1 && !isServing && (
                      <button
                        type="button"
                        className="link-btn text-danger"
                        onClick={() => removeCounter(counter.id)}
                        title="Remove Counter"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Counter Active Token Area */}
                <div className="counter-serving-area">
                  <span className="counter-area-label">Currently Serving:</span>
                  {counter.isOpen ? (
                    isServing ? (
                      <div className="serving-token-display">
                        <div className="serving-token-number" id={`counter-${counter.id}-serving-token`}>
                          {currentServingToken.tokenNumber}
                        </div>
                        <div className="serving-token-meta">
                          <span className="serving-name">{currentServingToken.name}</span>
                          <span className="serving-service">{currentServingToken.service}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="counter-idle-state">
                        <span className="idle-indicator">•</span>
                        <span>Counter Idle (Ready for next customer)</span>
                      </div>
                    )
                  ) : (
                    <div className="counter-closed-state">This counter is currently closed.</div>
                  )}
                </div>

                {/* Counter Actions */}
                <div className="counter-actions-row">
                  <button
                    type="button"
                    className="primary-action-btn btn-sm"
                    id={`call-next-btn-${counter.id}`}
                    disabled={!counter.isOpen || isServing || !hasWaiting}
                    onClick={() => callNext(counter.id)}
                    title={
                      !counter.isOpen
                        ? 'Open counter first'
                        : isServing
                        ? 'Complete current service before calling next'
                        : !hasWaiting
                        ? 'No waiting customers in queue'
                        : 'Call next waiting customer'
                    }
                  >
                    Call Next
                  </button>

                  <button
                    type="button"
                    className="secondary-btn btn-sm btn-success"
                    id={`complete-btn-${counter.id}`}
                    disabled={!counter.isOpen || !isServing}
                    onClick={() => completeService(counter.id)}
                    title={
                      !isServing
                        ? 'No token is currently being served at this counter'
                        : `Complete service for ${currentServingToken?.tokenNumber}`
                    }
                  >
                    Complete Service
                  </button>
                </div>

                {/* Visual explanation for disabled actions */}
                {!counter.isOpen ? (
                  <div className="counter-action-status text-muted">Counter is closed</div>
                ) : isServing ? (
                  <div className="counter-action-status text-muted">
                    Serving {currentServingToken?.tokenNumber} • Complete before calling next
                  </div>
                ) : !hasWaiting ? (
                  <div className="counter-action-status text-muted">
                    Queue is empty • No customers waiting
                  </div>
                ) : (
                  <div className="counter-action-status text-teal">
                    Ready to call next customer ({waitingTokens[0]?.tokenNumber})
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Waiting List (Strict FIFO) */}
      <div className="section-block">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">Waiting Queue (In Order)</h2>
            <p className="section-subtitle">
              Customers are processed strictly First-In, First-Out (FIFO).
            </p>
          </div>
          <span className="queue-count-badge">{waitingTokens.length} Waiting</span>
        </div>

        {waitingTokens.length === 0 ? (
          <div className="friendly-empty-card" id="empty-queue-message">
            <div className="empty-title">No customers waiting</div>
            <p className="empty-desc">
              All caught up! New tokens generated by customers will appear here automatically in order.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="staff-table" aria-label="Waiting Customers Table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Token</th>
                  <th scope="col">Customer Name</th>
                  <th scope="col">Service Requested</th>
                  <th scope="col">Wait Time Est.</th>
                  <th scope="col">Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {waitingTokens.map((token, index) => {
                  const estWait = index * avgServiceTime;
                  // Find first idle open counter
                  const idleCounter = openCounters.find((c) => !c.currentTokenId);

                  return (
                    <tr key={token.id} className={index === 0 ? 'next-in-line-row' : ''}>
                      <td>
                        <span className="order-pill">#{index + 1}</span>
                      </td>
                      <td>
                        <strong className="token-code-cell">{token.tokenNumber}</strong>
                        {index === 0 && <span className="next-badge">Next</span>}
                      </td>
                      <td>{token.name}</td>
                      <td>
                        <span className="table-service-tag">{token.service}</span>
                      </td>
                      <td>
                        <span className="table-est-time">
                          {index === 0 ? 'Next (~1-2m)' : `~${estWait} mins`}
                        </span>
                      </td>
                      <td>
                        {index === 0 && idleCounter ? (
                          <button
                            type="button"
                            className="primary-action-btn btn-xs"
                            onClick={() => callNext(idleCounter.id)}
                            title={`Call to ${idleCounter.name}`}
                          >
                            Call to {idleCounter.name}
                          </button>
                        ) : (
                          <span className="action-hint-text">
                            {index === 0
                              ? 'Counters busy'
                              : `Behind #${index}`}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Completed Customers List */}
      <div className="section-block">
        <div className="section-header-row">
          <div>
            <h2 className="section-title">Completed Customers</h2>
            <p className="section-subtitle">Recently finished consultations and transactions.</p>
          </div>
          <span className="queue-count-badge badge-neutral">{completedTokens.length} Completed</span>
        </div>

        {completedTokens.length === 0 ? (
          <div className="friendly-empty-card">
            <div className="empty-title">No completed customers yet</div>
            <p className="empty-desc">
              When staff finish serving tokens, completion records will appear here.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="staff-table" aria-label="Completed Customers Table">
              <thead>
                <tr>
                  <th scope="col">Token</th>
                  <th scope="col">Customer Name</th>
                  <th scope="col">Service</th>
                  <th scope="col">Served At</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {completedTokens
                  .slice()
                  .reverse()
                  .map((token) => (
                    <tr key={token.id}>
                      <td>
                        <strong className="token-code-cell">{token.tokenNumber}</strong>
                      </td>
                      <td>{token.name}</td>
                      <td>
                        <span className="table-service-tag">{token.service}</span>
                      </td>
                      <td>{token.counter || 'Counter 1'}</td>
                      <td>
                        <span className="status-pill pill-completed">Completed</span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Queue Settings */}
      <div className="section-block settings-card">
        <h2 className="section-title">Queue Settings</h2>
        <p className="section-subtitle">
          Configure baseline timing parameters for all customer wait estimations.
        </p>

        <form onSubmit={handleServiceTimeSubmit} className="settings-form-row">
          <div className="settings-field">
            <label htmlFor="avg-service-time-input" className="form-label">
              Average Service Time (minutes per person)
            </label>
            <div className="settings-input-group">
              <input
                id="avg-service-time-input"
                type="number"
                min="1"
                max="60"
                className="form-input form-input-sm"
                value={serviceTimeInput}
                onChange={(e) => setServiceTimeInput(e.target.value)}
                required
              />
              <button type="submit" className="primary-action-btn btn-sm">
                Save Setting
              </button>
            </div>
            {timeError && <div className="error-message" role="alert">{timeError}</div>}
            <span className="field-hint">
              Default is 5 minutes. Updating this immediately recalculates estimated wait times for all customers.
            </span>
          </div>
        </form>
      </div>

      {/* Confirmation Modal for Resetting Demo Data */}
      {showResetModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-dialog">
            <h3 className="modal-title" id="modal-title">Reset Demo Queue?</h3>
            <p className="modal-body">
              This will clear the current queue state from your browser storage and restore the sample initial queue (tokens Q-100 to Q-104) so competition judges can evaluate from a clean starting state.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-action-btn btn-danger"
                id="confirm-reset-btn"
                onClick={handleResetConfirm}
              >
                Yes, Reset Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transparent Demo Notice */}
      <div className="simulation-notice">
        <strong>Evaluation Notice:</strong> All data, queue operations, and notifications are simulated entirely client-side using browser LocalStorage. Data synchronizes across open tabs in the same browser (separate devices do not share data). No real SMS or external APIs are invoked.
      </div>
    </div>
  );
}
