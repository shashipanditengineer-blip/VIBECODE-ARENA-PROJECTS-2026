import { QueueProvider, useQueue } from './context/QueueContext';
import Header from './components/Header';
import JoinQueue from './components/JoinQueue';
import TokenConfirmed from './components/TokenConfirmed';
import TrackQueue from './components/TrackQueue';
import StaffView from './components/StaffView';
import NotificationToast from './components/NotificationToast';
import './App.css';

function MainContent() {
  const { currentView } = useQueue();

  return (
    <main className="main-content" id="main-content">
      {currentView === 'customer-join' && <JoinQueue />}
      {currentView === 'customer-confirmed' && <TokenConfirmed />}
      {currentView === 'customer-track' && <TrackQueue />}
      {currentView === 'staff' && <StaffView />}
    </main>
  );
}

function App() {
  return (
    <QueueProvider>
      <div className="app-layout">
        <Header />
        <NotificationToast />
        <MainContent />
        <footer className="app-footer">
          <div className="footer-container">
            <p className="footer-text">
              <strong>QueueSmart</strong> — Simple, accessible queue management for everyone.
            </p>
            <p className="footer-subtext">
              Local demonstration mode • Data stored in browser storage
            </p>
          </div>
        </footer>
      </div>
    </QueueProvider>
  );
}

export default App;
