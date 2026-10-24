// Initial sample queue data for demonstration and judging
// Clearly labeled sample customers so judges can immediately observe queue progression

export const INITIAL_SERVICES = [
  'General Enquiry',
  'Document Verification',
  'Payment Counter',
  'Other'
];

export const INITIAL_COUNTERS = [
  {
    id: 1,
    name: 'Counter 1',
    isOpen: true,
    currentTokenId: 'token-101'
  },
  {
    id: 2,
    name: 'Counter 2',
    isOpen: false,
    currentTokenId: null
  }
];

export const INITIAL_TOKENS = [
  {
    id: 'token-100',
    tokenNumber: 'Q-100',
    name: 'Robert Chen',
    service: 'Document Verification',
    status: 'completed',
    counter: 'Counter 1',
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    servingStartedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    completedAt: new Date(Date.now() - 5 * 60000).toISOString()
  },
  {
    id: 'token-101',
    tokenNumber: 'Q-101',
    name: 'Sarah Jenkins',
    service: 'General Enquiry',
    status: 'serving',
    counter: 'Counter 1',
    createdAt: new Date(Date.now() - 18 * 60000).toISOString(),
    servingStartedAt: new Date(Date.now() - 4 * 60000).toISOString(),
    completedAt: null
  },
  {
    id: 'token-102',
    tokenNumber: 'Q-102',
    name: 'David Patel',
    service: 'Document Verification',
    status: 'waiting',
    counter: null,
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    servingStartedAt: null,
    completedAt: null
  },
  {
    id: 'token-103',
    tokenNumber: 'Q-103',
    name: 'Maria Garcia',
    service: 'Payment Counter',
    status: 'waiting',
    counter: null,
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    servingStartedAt: null,
    completedAt: null
  },
  {
    id: 'token-104',
    tokenNumber: 'Q-104',
    name: 'James Wilson',
    service: 'Other',
    status: 'waiting',
    counter: null,
    createdAt: new Date(Date.now() - 3 * 60000).toISOString(),
    servingStartedAt: null,
    completedAt: null
  }
];

export const INITIAL_SETTINGS = {
  averageServiceTimeMinutes: 5,
  nextSequenceNumber: 105
};
