import { useQueue } from '../context/QueueContext';

export default function Header() {
  const { currentView, setCurrentView, activeToken, waitingTokens } = useQueue();

  const isCustomerView =
    currentView === 'customer-join' ||
    currentView === 'customer-confirmed' ||
    currentView === 'customer-track';

  const isStaffView = currentView === 'staff';

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand" onClick={() => setCurrentView('customer-join')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setCurrentView('customer-join')}>
          <div className="brand-logo-mark">QS</div>
          <div className="brand-text">
            <span className="brand-name">QueueSmart</span>
            <span className="brand-sub">Simple Queue System</span>
          </div>
        </div>

        <nav className="header-nav" aria-label="Main Navigation">
          {activeToken && isCustomerView && currentView !== 'customer-track' && (
            <button
              type="button"
              className="my-token-chip"
              onClick={() => setCurrentView('customer-track')}
              title={`Track your token ${activeToken.tokenNumber}`}
            >
              <span className="chip-label">My Token:</span>
              <span className="chip-value">{activeToken.tokenNumber}</span>
              <span className={`chip-status status-${activeToken.status}`}>
                {activeToken.status === 'serving' ? 'Serving now' : activeToken.status}
              </span>
            </button>
          )}

          <div className="view-switch-group" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={isCustomerView}
              className={`nav-tab ${isCustomerView ? 'active' : ''}`}
              onClick={() => {
                if (activeToken) {
                  setCurrentView('customer-track');
                } else {
                  setCurrentView('customer-join');
                }
              }}
            >
              Customer View
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={isStaffView}
              className={`nav-tab staff-tab ${isStaffView ? 'active' : ''}`}
              onClick={() => setCurrentView('staff')}
            >
              <span>Staff View</span>
              {waitingTokens.length > 0 && (
                <span className="nav-badge" title={`${waitingTokens.length} waiting customers`}>
                  {waitingTokens.length}
                </span>
              )}
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}
