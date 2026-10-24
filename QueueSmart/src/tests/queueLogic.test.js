import assert from 'node:assert';
import {
  INITIAL_SERVICES,
  INITIAL_COUNTERS,
  INITIAL_TOKENS,
  INITIAL_SETTINGS
} from '../data/initialData.js';

console.log('--- RUNNING QUEUESMART AUTOMATED LOGIC VERIFICATION ---');

let tokens = JSON.parse(JSON.stringify(INITIAL_TOKENS));
let counters = JSON.parse(JSON.stringify(INITIAL_COUNTERS));
let avgServiceTime = INITIAL_SETTINGS.averageServiceTimeMinutes;
let nextSequence = INITIAL_SETTINGS.nextSequenceNumber;

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

function getPeopleAhead(tokenId) {
  const target = tokens.find((t) => t.id === tokenId);
  if (!target || target.status !== 'waiting') return 0;
  const waitingList = tokens.filter((t) => t.status === 'waiting');
  const idx = waitingList.findIndex((t) => t.id === tokenId);
  return idx === -1 ? 0 : idx;
}

function getEstimatedWaitTime(tokenId) {
  const target = tokens.find((t) => t.id === tokenId);
  if (!target || target.status === 'serving' || target.status === 'completed') return 0;
  return Math.max(0, Math.round(getPeopleAhead(tokenId) * avgServiceTime)) || 0;
}

function generateToken(service, name) {
  const tokenNumber = `Q-${nextSequence++}`;
  const newToken = {
    id: `token-${Date.now()}-${Math.random()}`,
    tokenNumber,
    name: name || 'Walk-in Customer',
    service: service || INITIAL_SERVICES[0],
    status: 'waiting',
    counter: null,
    createdAt: new Date().toISOString(),
    servingStartedAt: null,
    completedAt: null
  };
  tokens.push(newToken);
  return newToken;
}

function callNext(counterId) {
  const counter = counters.find((c) => c.id === counterId);
  if (!counter || !counter.isOpen || counter.currentTokenId) return false;
  // Strict FIFO: pick first waiting token that is not assigned to any counter
  const nextToken = tokens.find(
    (t) => t.status === 'waiting' && !counters.some((c) => c.currentTokenId === t.id)
  );
  if (!nextToken) return false;
  nextToken.status = 'serving';
  nextToken.counter = counter.name;
  nextToken.servingStartedAt = new Date().toISOString();
  counter.currentTokenId = nextToken.id;
  return nextToken;
}

function completeService(counterId) {
  const counter = counters.find((c) => c.id === counterId);
  if (!counter || !counter.isOpen || !counter.currentTokenId) return false;
  const token = tokens.find((t) => t.id === counter.currentTokenId);
  if (!token) return false;
  token.status = 'completed';
  token.completedAt = new Date().toISOString();
  counter.currentTokenId = null;
  return token;
}

function updateAvgServiceTime(minutes) {
  const num = Number(minutes);
  avgServiceTime = isNaN(num) ? 5 : Math.max(1, Math.min(60, Math.round(num)));
  return avgServiceTime;
}

function resetDemo() {
  tokens = JSON.parse(JSON.stringify(INITIAL_TOKENS));
  counters = JSON.parse(JSON.stringify(INITIAL_COUNTERS));
  avgServiceTime = INITIAL_SETTINGS.averageServiceTimeMinutes;
  nextSequence = INITIAL_SETTINGS.nextSequenceNumber;
}

// TEST 1: Initial sample data structure
console.log('Test 1: Verify Initial Sample Data');
const initialWaiting = tokens.filter((t) => t.status === 'waiting');
const initialServing = tokens.filter((t) => t.status === 'serving');
const initialCompleted = tokens.filter((t) => t.status === 'completed');
assert.strictEqual(initialWaiting.length, 3, 'Initial waiting count should be 3');
assert.strictEqual(initialServing.length, 1, 'Initial serving count should be 1');
assert.strictEqual(initialCompleted.length, 1, 'Initial completed count should be 1');
console.log('✓ Initial data state passed (3 waiting, 1 serving, 1 completed)');

// TEST 2: Customer generates token
console.log('Test 2: Customer Generates Token Q-105');
const token105 = generateToken('Document Verification', 'Alice Morgan');
assert.strictEqual(token105.tokenNumber, 'Q-105', 'Token number should be Q-105');
assert.strictEqual(token105.status, 'waiting', 'New token must have waiting status');
assert.strictEqual(token105.service, 'Document Verification', 'Service should match');
const aheadFor105 = getPeopleAhead(token105.id);
assert.strictEqual(aheadFor105, 3, `Expected 3 people ahead for Q-105, got ${aheadFor105}`);
const waitTime105 = getEstimatedWaitTime(token105.id);
assert.strictEqual(waitTime105, 15, `Expected 15 min wait time (3 * 5), got ${waitTime105}`);
console.log('✓ Token generation and wait time calculation passed (3 people ahead × 5 min = 15 min)');

// TEST 3: Staff calls next token (strict FIFO)
console.log('Test 3: Counter 1 Complete and Call Next');
const completed101 = completeService(1);
assert.strictEqual(completed101.tokenNumber, 'Q-101', 'Counter 1 should complete Q-101');
assert.strictEqual(completed101.status, 'completed', 'Status should be completed');
assert.strictEqual(counters.find((c) => c.id === 1).currentTokenId, null, 'Counter 1 should be idle');

const called102 = callNext(1);
assert.strictEqual(called102.tokenNumber, 'Q-102', `Strict FIFO failed: expected Q-102, got ${called102.tokenNumber}`);
assert.strictEqual(called102.status, 'serving', 'Q-102 status must be serving');
assert.strictEqual(called102.counter, 'Counter 1', 'Q-102 counter must be Counter 1');

const newAheadFor105 = getPeopleAhead(token105.id);
assert.strictEqual(newAheadFor105, 2, `Expected 2 people ahead for Q-105 now, got ${newAheadFor105}`);
const newWaitTime105 = getEstimatedWaitTime(token105.id);
assert.strictEqual(newWaitTime105, 10, `Expected 10 min wait time (2 * 5), got ${newWaitTime105}`);
console.log('✓ Strict FIFO call and live waiting recalculation passed');

// TEST 4: Open Counter 2 and call next (Parallel Counters)
console.log('Test 4: Open Counter 2 and Call Next (Parallel Counters)');
const counter2 = counters.find((c) => c.id === 2);
counter2.isOpen = true;
const called103 = callNext(2);
assert.strictEqual(called103.tokenNumber, 'Q-103', `Expected Q-103 called to Counter 2, got ${called103.tokenNumber}`);
assert.strictEqual(called103.counter, 'Counter 2', 'Q-103 counter must be Counter 2');
console.log('✓ Multiple counters operating simultaneously passed');

// TEST 5: Change Average Service Time setting
console.log('Test 5: Update Average Service Time to 8 minutes');
avgServiceTime = 8;
const waitTimeWith8Min = getEstimatedWaitTime(token105.id);
const aheadNow = getPeopleAhead(token105.id);
assert.strictEqual(aheadNow, 1, `Expected 1 person ahead for Q-105, got ${aheadNow}`);
assert.strictEqual(waitTimeWith8Min, 8, `Expected 8 min wait time (1 * 8), got ${waitTimeWith8Min}`);
console.log('✓ Average service time update dynamically recalculates estimates');

// TEST 6: Non-duplicate token serving rule
console.log('Test 6: Verify Busy Counter Cannot Call Next');
const reCalled = callNext(1);
assert.strictEqual(reCalled, false, 'Cannot call next on busy counter');
console.log('✓ Action prevention on busy state passed');

// TEST 7: Complete service when idle
console.log('Test 7: Complete Service on Idle Counter Handled Gracefully');
completeService(1); // completes 102
const idleComplete = completeService(1); // now counter 1 is idle
assert.strictEqual(idleComplete, false, 'Completing an idle counter must return false');
console.log('✓ Completing idle counter returns false gracefully');

// TEST 8: Closed Counter Call Next
console.log('Test 8: Calling Next on Closed Counter');
counter2.isOpen = false;
const closedCall = callNext(2);
assert.strictEqual(closedCall, false, 'Calling next on closed counter must return false');
console.log('✓ Closed counter call rejection passed');

// TEST 9: Closed Counter Complete Service
console.log('Test 9: Closed Counter Cannot Complete Service');
const closedComplete = completeService(2);
assert.strictEqual(closedComplete, false, 'Closed counter cannot complete service');
console.log('✓ Closed counter completion rejection passed');

// TEST 10: Empty Queue Handling
console.log('Test 10: Empty Queue Handling');
counter2.isOpen = true;
completeService(2); // completes 103
callNext(1); // calls 104
completeService(1); // completes 104
callNext(1); // calls 105
completeService(1); // completes 105
const emptyCall = callNext(1);
assert.strictEqual(emptyCall, false, 'Calling next with empty waiting queue must return false');
console.log('✓ Empty queue safely handled without errors');

// TEST 11: Service Time Clamping
console.log('Test 11: Service Time Clamping (1 to 60)');
assert.strictEqual(updateAvgServiceTime(0), 1, 'Value 0 should be clamped to 1');
assert.strictEqual(updateAvgServiceTime(-5), 1, 'Negative value should be clamped to 1');
assert.strictEqual(updateAvgServiceTime(120), 60, 'Value > 60 should be clamped to 60');
assert.strictEqual(updateAvgServiceTime('abc'), 5, 'Non-numeric input should fallback to default 5');
console.log('✓ Timing parameter clamping passed');

// TEST 12: People Ahead Excludes Serving and Completed
console.log('Test 12: People Ahead Count Excludes Serving and Completed');
resetDemo();
assert.strictEqual(getPeopleAhead('token-100'), 0, 'Completed token must have 0 people ahead');
assert.strictEqual(getPeopleAhead('token-101'), 0, 'Serving token must have 0 people ahead');
assert.strictEqual(getPeopleAhead('token-102'), 0, 'First waiting token must have 0 people ahead');
assert.strictEqual(getPeopleAhead('token-103'), 1, 'Second waiting token must have 1 person ahead');
assert.strictEqual(getPeopleAhead('token-104'), 2, 'Third waiting token must have 2 people ahead');
console.log('✓ People ahead strictly excludes non-waiting tokens');

// TEST 13: Multiple Open Counters Do Not Assign Same Token
console.log('Test 13: Multiple Counters Avoid Duplicate Assignment');
counters[1].isOpen = true; // Open Counter 2
completeService(1); // Free Counter 1 (completed Q-101)
const c1Token = callNext(1); // Should get Q-102
const c2Token = callNext(2); // Should get Q-103 (NOT Q-102)
assert.strictEqual(c1Token.tokenNumber, 'Q-102', 'Counter 1 gets Q-102');
assert.strictEqual(c2Token.tokenNumber, 'Q-103', 'Counter 2 gets Q-103');
assert.notStrictEqual(c1Token.tokenNumber, c2Token.tokenNumber, 'Counters must never receive same token');
console.log('✓ Parallel counters independently assign distinct tokens');

// TEST 14: Data Sanitization
console.log('Test 14: Stored Data Sanitization');
const corruptedTokens = [null, { foo: 'bar' }, { id: 'x', tokenNumber: 'Q-99', status: 'invalid' }];
const recoveredTokens = sanitizeTokens(corruptedTokens);
assert.strictEqual(recoveredTokens.length, 5, 'Malformed tokens safely fallback to initial tokens');
const corruptedCounters = [{ id: 'bad' }];
const recoveredCounters = sanitizeCounters(corruptedCounters);
assert.strictEqual(recoveredCounters.length, 2, 'Malformed counters safely fallback to initial counters');
console.log('✓ Corrupted stored data safely handled with initial fallback');

// TEST 15: Demo Data Reset
console.log('Test 15: Demo Queue Reset');
resetDemo();
assert.strictEqual(tokens.length, 5, 'Reset tokens count should be 5');
assert.strictEqual(tokens.filter((t) => t.status === 'waiting').length, 3, 'Reset waiting count should be 3');
assert.strictEqual(counters[0].isOpen, true, 'Counter 1 should be open');
assert.strictEqual(counters[1].isOpen, false, 'Counter 2 should be closed');
assert.strictEqual(avgServiceTime, 5, 'Reset avg service time should be 5');
console.log('✓ Reset demo data restores exact initial sample structure');

console.log('--- ALL 15 AUTOMATED LOGIC TESTS PASSED SUCCESSFULLY! ---');
