/* oxlint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  INITIAL_SERVICES,
  INITIAL_COUNTERS,
  INITIAL_TOKENS,
  INITIAL_SETTINGS
} from '../data/initialData';

const QueueContext = createContext(null);

const STORAGE_KEY = 'queuesmart_queue_data_v1';
const ACTIVE_TOKEN_KEY = 'queuesmart_active_token_v1';

function sanitizeTokens(rawTokens) {
  if (!Array.isArray(rawTokens) || rawTokens.length === 0) {
    return INITIAL_TOKENS;
  }
  const valid = rawTokens.filter(
    (t) =>
      t &&
      typeof t.id === 'string' &&
      typeof t.tokenNumber === 'string' &&
      typeof t.status === 'string' &&
      (t.status === 'waiting' || t.status === 'serving' || t.status === 'completed')
  );
  return valid.length > 0 ? valid : INITIAL_TOKENS;
}

function sanitizeCounters(rawCounters) {
  if (!Array.isArray(rawCounters) || rawCounters.length === 0) {
    return INITIAL_COUNTERS;
  }
  const valid = rawCounters.filter(
    (c) =>
      c &&
      typeof c.id === 'number' &&
      typeof c.name === 'string' &&
      typeof c.isOpen === 'boolean'
  );
  return valid.length > 0 ? valid : INITIAL_COUNTERS;
}

export function QueueProvider({ children }) {
  // Load persisted state safely or fallback to initial sample data
  const [tokens, setTokens] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return sanitizeTokens(parsed.tokens);
      }
    } catch (e) {
      console.warn('Failed to parse saved queue data, using initial data', e);
    }
    return INITIAL_TOKENS;
  });

  const [counters, setCounters] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return sanitizeCounters(parsed.counters);
      }
    } catch (e) {
      console.warn('Failed to parse saved counter data, using initial data', e);
    }
    return INITIAL_COUNTERS;
  });

  const [avgServiceTime, setAvgServiceTime] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const parsedNum = Number(parsed.avgServiceTime);
        if (!isNaN(parsedNum) && parsedNum >= 1 && parsedNum <= 60) {
          return Math.round(parsedNum);
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved avg service time', e);
    }
    return INITIAL_SETTINGS.averageServiceTimeMinutes;
  });

  const [nextSequence, setNextSequence] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const parsedSeq = Number(parsed.nextSequence);
        if (!isNaN(parsedSeq) && parsedSeq >= 1) {
          return Math.round(parsedSeq);
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved next sequence', e);
    }
    return INITIAL_SETTINGS.nextSequenceNumber;
  });

  const [activeTokenId, setActiveTokenId] = useState(() => {
    try {
      return localStorage.getItem(ACTIVE_TOKEN_KEY) || null;
    } catch {
      return null;
    }
  });

  // Automatically start on track screen if customer has active token in this browser
  const [currentView, setCurrentView] = useState(() => {
    try {
      const activeId = localStorage.getItem(ACTIVE_TOKEN_KEY);
      if (activeId) {
        return 'customer-track';
      }
    } catch {
      // Ignore storage errors
    }
    return 'customer-join';
  });

  // Simulated notification toast
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'info') => {
    setNotification({
      id: Date.now(),
      message,
      type
    });
  }, []);

  // Dismiss notification automatically after 4 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  // Persist state to localStorage on changes
  useEffect(() => {
    try {
      const dataToSave = {
        tokens,
        counters,
        avgServiceTime,
        nextSequence
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (err) {
      console.error('Failed to save to localStorage:', err);
    }
  }, [tokens, counters, avgServiceTime, nextSequence]);

  // Persist active token id
  useEffect(() => {
    try {
      if (activeTokenId) {
        localStorage.setItem(ACTIVE_TOKEN_KEY, activeTokenId);
      } else {
        localStorage.removeItem(ACTIVE_TOKEN_KEY);
      }
    } catch (err) {
      console.error('Failed to save active token id:', err);
    }
  }, [activeTokenId]);

  // Synchronize across browser tabs/windows when storage changes externally
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object') {
            if (Array.isArray(parsed.tokens)) {
              setTokens(sanitizeTokens(parsed.tokens));
            }
            if (Array.isArray(parsed.counters)) {
              setCounters(sanitizeCounters(parsed.counters));
            }
            const parsedAvg = Number(parsed.avgServiceTime);
            if (!isNaN(parsedAvg) && parsedAvg >= 1 && parsedAvg <= 60) {
              setAvgServiceTime(Math.round(parsedAvg));
            }
            const parsedSeq = Number(parsed.nextSequence);
            if (!isNaN(parsedSeq) && parsedSeq >= 1) {
              setNextSequence(Math.round(parsedSeq));
            }
          }
        } catch (err) {
          console.warn('Cross-tab synchronization parse error:', err);
        }
      } else if (e.key === ACTIVE_TOKEN_KEY) {
        setActiveTokenId(e.newValue || null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Derived state
  const waitingTokens = useMemo(() => {
    return tokens.filter((t) => t.status === 'waiting');
  }, [tokens]);

  const servingTokens = useMemo(() => {
    return tokens.filter((t) => t.status === 'serving');
  }, [tokens]);

  const completedTokens = useMemo(() => {
    return tokens.filter((t) => t.status === 'completed');
  }, [tokens]);

  const openCounters = useMemo(() => {
    return counters.filter((c) => c.isOpen);
  }, [counters]);

  // Customer: Generate Token
  const generateToken = useCallback(
    (service, displayName = '') => {
      const tokenNumber = `Q-${nextSequence}`;
      const newToken = {
        id: `token-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        tokenNumber,
        name: displayName.trim() || 'Walk-in Customer',
        service: service || INITIAL_SERVICES[0],
        status: 'waiting',
        counter: null,
        createdAt: new Date().toISOString(),
        servingStartedAt: null,
        completedAt: null
      };

      setTokens((prev) => [...prev, newToken]);
      setNextSequence((prev) => prev + 1);
      setActiveTokenId(newToken.id);
      setCurrentView('customer-confirmed');

      showNotification(`Token ${tokenNumber} created for ${newToken.service}.`, 'success');
      return newToken;
    },
    [nextSequence, showNotification]
  );

  // Staff: Call Next Token for a specific counter
  const callNext = useCallback(
    (counterId) => {
      const counter = counters.find((c) => c.id === counterId);
      if (!counter || !counter.isOpen) {
        showNotification('Selected counter is closed.', 'alert');
        return false;
      }

      // Check if counter already has a serving token
      if (counter.currentTokenId) {
        const currentlyServing = tokens.find((t) => t.id === counter.currentTokenId);
        showNotification(
          `${counter.name} is still serving ${currentlyServing ? currentlyServing.tokenNumber : 'a customer'}. Complete current service first.`,
          'alert'
        );
        return false;
      }

      // Strict FIFO: pick the first waiting token that is not assigned to any counter
      const nextToken = tokens.find(
        (t) => t.status === 'waiting' && !counters.some((c) => c.currentTokenId === t.id)
      );
      if (!nextToken) {
        showNotification('No waiting customers in the queue.', 'info');
        return false;
      }

      // Mark token as serving
      setTokens((prev) =>
        prev.map((t) =>
          t.id === nextToken.id
            ? {
                ...t,
                status: 'serving',
                counter: counter.name,
                servingStartedAt: new Date().toISOString()
              }
            : t
        )
      );

      // Assign to counter
      setCounters((prev) =>
        prev.map((c) => (c.id === counter.id ? { ...c, currentTokenId: nextToken.id } : c))
      );

      showNotification(`Called ${nextToken.tokenNumber} to ${counter.name}.`, 'success');
      return true;
    },
    [counters, tokens, showNotification]
  );

  // Staff: Complete Service for a counter
  const completeService = useCallback(
    (counterId) => {
      const counter = counters.find((c) => c.id === counterId);
      if (!counter || !counter.isOpen) {
        showNotification('Selected counter is closed.', 'alert');
        return false;
      }

      if (!counter.currentTokenId) {
        showNotification('No token is currently being served at this counter.', 'alert');
        return false;
      }

      const servingTokenId = counter.currentTokenId;
      const completedToken = tokens.find((t) => t.id === servingTokenId);

      // Mark token completed
      setTokens((prev) =>
        prev.map((t) =>
          t.id === servingTokenId
            ? {
                ...t,
                status: 'completed',
                completedAt: new Date().toISOString()
              }
            : t
        )
      );

      // Clear counter
      setCounters((prev) =>
        prev.map((c) => (c.id === counter.id ? { ...c, currentTokenId: null } : c))
      );

      if (completedToken) {
        showNotification(
          `Service completed for ${completedToken.tokenNumber} at ${counter.name}.`,
          'success'
        );
      }
      return true;
    },
    [counters, tokens, showNotification]
  );

  // Staff: Toggle Counter open/closed
  const toggleCounter = useCallback(
    (counterId) => {
      setCounters((prev) => {
        return prev.map((c) => {
          if (c.id === counterId) {
            const nextIsOpen = !c.isOpen;
            // If closing counter while it has a serving token, prevent accidental abandonment or alert
            if (!nextIsOpen && c.currentTokenId) {
              showNotification(
                `Cannot close ${c.name} while a customer is being served. Please complete service first.`,
                'alert'
              );
              return c;
            }
            showNotification(
              `${c.name} is now ${nextIsOpen ? 'Open' : 'Closed'}.`,
              'info'
            );
            return { ...c, isOpen: nextIsOpen };
          }
          return c;
        });
      });
    },
    [showNotification]
  );

  // Staff: Add new counter
  const addCounter = useCallback(() => {
    setCounters((prev) => {
      const nextId = prev.length > 0 ? Math.max(...prev.map((c) => c.id)) + 1 : 1;
      const newCounterName = `Counter ${nextId}`;
      showNotification(`Added ${newCounterName}.`, 'info');
      return [
        ...prev,
        {
          id: nextId,
          name: newCounterName,
          isOpen: true,
          currentTokenId: null
        }
      ];
    });
  }, [showNotification]);

  // Staff: Remove counter (only if idle and more than 1 counter)
  const removeCounter = useCallback(
    (counterId) => {
      setCounters((prev) => {
        if (prev.length <= 1) {
          showNotification('At least one counter must remain in the system.', 'alert');
          return prev;
        }
        const target = prev.find((c) => c.id === counterId);
        if (target && target.currentTokenId) {
          showNotification(
            `Cannot remove ${target.name} while serving a customer.`,
            'alert'
          );
          return prev;
        }
        showNotification(`Removed ${target ? target.name : 'counter'}.`, 'info');
        return prev.filter((c) => c.id !== counterId);
      });
    },
    [showNotification]
  );

  // Staff: Update average service time
  const updateAvgServiceTime = useCallback(
    (minutes) => {
      const num = Number(minutes);
      const parsed = isNaN(num) ? 5 : Math.max(1, Math.min(60, Math.round(num)));
      setAvgServiceTime(parsed);
      showNotification(`Average service time updated to ${parsed} minutes.`, 'info');
    },
    [showNotification]
  );

  // Staff: Reset demo queue to initial state
  const resetDemoData = useCallback(() => {
    setTokens(INITIAL_TOKENS);
    setCounters(INITIAL_COUNTERS);
    setAvgServiceTime(INITIAL_SETTINGS.averageServiceTimeMinutes);
    setNextSequence(INITIAL_SETTINGS.nextSequenceNumber);
    setActiveTokenId(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_TOKEN_KEY);
    } catch {
      // Ignore storage errors
    }
    showNotification('Demo queue has been reset to default state.', 'info');
  }, [showNotification]);

  // Helpers for token tracking
  const getPeopleAhead = useCallback(
    (tokenId) => {
      const target = tokens.find((t) => t.id === tokenId);
      if (!target || target.status !== 'waiting') {
        return 0;
      }
      // Strict FIFO index among waiting tokens
      const waitingList = tokens.filter((t) => t.status === 'waiting');
      const index = waitingList.findIndex((t) => t.id === tokenId);
      return index === -1 ? 0 : index;
    },
    [tokens]
  );

  const getEstimatedWaitTime = useCallback(
    (tokenId) => {
      const target = tokens.find((t) => t.id === tokenId);
      if (!target) return 0;
      if (target.status === 'serving' || target.status === 'completed') {
        return 0;
      }
      const ahead = getPeopleAhead(tokenId);
      return Math.max(0, Math.round(ahead * avgServiceTime)) || 0;
    },
    [tokens, getPeopleAhead, avgServiceTime]
  );

  // Active token object
  const activeToken = useMemo(() => {
    if (!activeTokenId) return null;
    return tokens.find((t) => t.id === activeTokenId) || null;
  }, [tokens, activeTokenId]);

  // Staff suggestion when queue gets long
  const queueSuggestion = useMemo(() => {
    const waitingCount = waitingTokens.length;
    const openCount = openCounters.length;

    // If 4 or more people are waiting and only 1 counter is open
    if (waitingCount >= 4 && openCount === 1) {
      const closedCounter = counters.find((c) => !c.isOpen);
      return {
        show: true,
        type: 'recommendation',
        title: 'High Queue Volume Alert',
        message: `There are currently ${waitingCount} customers waiting with only 1 active counter. Opening ${closedCounter ? closedCounter.name : 'another counter'} will help serve waiting customers faster and reduce wait times.`
      };
    }
    return null;
  }, [waitingTokens.length, openCounters.length, counters]);

  const value = {
    services: INITIAL_SERVICES,
    tokens,
    counters,
    openCounters,
    waitingTokens,
    servingTokens,
    completedTokens,
    avgServiceTime,
    activeTokenId,
    activeToken,
    currentView,
    notification,
    queueSuggestion,
    setCurrentView,
    setActiveTokenId,
    generateToken,
    callNext,
    completeService,
    toggleCounter,
    addCounter,
    removeCounter,
    updateAvgServiceTime,
    resetDemoData,
    getPeopleAhead,
    getEstimatedWaitTime,
    showNotification
  };

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
}
