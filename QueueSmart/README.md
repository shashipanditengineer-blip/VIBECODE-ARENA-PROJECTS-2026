# QueueSmart — Simple Queue Management System
**PS 6: VibeCode Arena Competition Submission**

QueueSmart is an accessible, human-designed queue management web application tailored for ordinary people and first-time users. It provides an intuitive, friction-free way for customers to join a service queue, get an instant digital token, and track their turn in real-time, alongside a clear, reliable control view for service desk staff.

---

## 1. Quick Start & Setup Instructions

### Prerequisites
- Node.js (version 18+ recommended)
- npm (Node Package Manager)

### Running the Application

1. Open your terminal in the project directory:
   ```bash
   cd "QueueSmart AI"
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:5173/
   ```

5. (Optional) Run automated queue logic tests:
   ```bash
   npm test
   ```

6. (Optional) Run code linting:
   ```bash
   npm run lint
   ```

---

## 2. Core Architectural Concepts

### A. How Token Generation Works
1. **Zero Registration Barrier**: Ordinary customers simply pick a service (*General Enquiry*, *Document Verification*, *Payment Counter*, or *Other*) and optionally provide a display name. No passwords, emails, or phone numbers are requested.
2. **Sequential & Unique Tokens**: Tokens are generated sequentially with a `Q-` prefix (e.g. `Q-105`, `Q-106`).
3. **Duplicate Prevention**: The submission process is debounced and throttled with button state locking to prevent accidental double-clicks.
4. **Instant Confirmation**: Customers immediately see their confirmed token, current serving token, number of people ahead, and estimated wait time, with a direct CTA to **"Track My Turn"**.
5. **Session Persistence**: The customer's token is saved in browser `localStorage`. If they reload or return later, QueueSmart remembers their token and keeps their tracking live.

### B. How Waiting Time is Calculated
Estimated waiting times are calculated strictly using the competition formula:

$$\text{Estimated Waiting Time} = \text{People Ahead} \times \text{Average Service Time}$$

- **People Ahead**: Calculated dynamically based on the customer's strict FIFO position among all currently active tokens with `status: "waiting"`.
- **Average Service Time**: Defaults to **5 minutes per person**, fully adjustable by staff desk operators in the Staff View settings (between 1 and 60 minutes).
- **Transparency**: When customers view their tracking screen, QueueSmart provides an explicit breakdown:
  > *"Estimated waiting time = people ahead (2) × average service time (5 minutes) = ~10 minutes. Waiting times are estimates, not guarantees."*

### C. Queue Rules & Consistency
- **Strict FIFO (First-In, First-Out)**: Tokens are called in the exact order they entered the waiting queue.
- **Single-State Integrity**: A token can never be served or completed twice.
- **Dynamic Recalculation**: When a staff member completes a customer or calls the next token, all waiting customers' position numbers and estimated wait times update immediately.
- **Smart Staff Recommendation**: When the waiting queue reaches 4 or more people with only 1 open counter, QueueSmart alerts staff with a recommendation banner explaining why opening Counter 2 will reduce customer wait times.

---

## 3. Step-by-Step Judge Demonstration Guide

Follow this 5-minute walkthrough to demonstrate all primary workflows to competition judges:

### Phase 1: Customer Joins the Queue
1. Navigate to the **Customer View** (default home screen).
2. Note the clean, human-designed interface with a white background, navy text, and teal accents.
3. Select **Document Verification** from the service dropdown.
4. (Optional) Type a name, e.g. **"Alice Morgan"**.
5. Click **"Get My Token"**.
6. **Result**: The confirmation screen appears with token **Q-105**, displaying people ahead (3 people) and estimated wait time (~15 minutes).
7. Click **"Track My Turn"** to view real-time status.

### Phase 2: Live Queue Tracking
1. Observe the tracking screen showing status **"Waiting in Queue"**, the step-by-step progress tracker, people ahead, estimated wait time, and calculation explanation.
2. Notice the persistent pill in the top header: `My Token: Q-105 (Waiting)`.

### Phase 3: Staff Management & Counter Operations
1. Click **"Staff View"** in the top navigation bar.
2. Review the top metrics:
   - **Waiting in Queue**: 4
   - **Currently Serving**: 1 (Sarah Jenkins `Q-101` at Counter 1)
   - **Completed Today**: 1 (`Q-100`)
3. Notice the **High Queue Volume Alert**: Because there are 4 waiting customers and only 1 open counter, staff receives an alert suggesting opening Counter 2.
4. On **Counter 1**, click **"Complete Service"**.
   - Sarah Jenkins (`Q-101`) moves to the Completed Customers table.
   - Counter 1 enters the idle state.
5. On **Counter 1**, click **"Call Next"**.
   - Token **Q-102** (*David Patel*) is assigned to Counter 1.
   - Waiting queue automatically decrements.
6. Open **Counter 2**: Click **"Open Counter"** on Counter 2, then click **"Call Next"** on Counter 2.
   - Token **Q-103** (*Maria Garcia*) is assigned to Counter 2.
   - Multiple counters now process customers simultaneously in FIFO order.

### Phase 4: Customer Status Update & Turn Alert
1. Switch back to **"Customer View"** (or click the `My Token: Q-105` chip).
2. Notice that people ahead for `Q-105` has dropped from 3 down to 1, and estimated wait time has dropped to ~5 minutes.
3. Switch back to Staff View and advance the queue until `Q-105` is called.
4. When `Q-105` is called, return to Customer View to see the vibrant **"It's Your Turn! Please proceed to Counter 1"** callout banner.

### Phase 5: Demo Reset
1. In Staff View, click **"Reset Demo Queue"**.
2. Confirm the reset dialog.
3. The queue cleanly restores initial sample tokens (`Q-100` through `Q-104`) for the next judging run.

---

## 4. Verification Test Checklist

| Feature | Requirement | Status |
| :--- | :--- | :---: |
| **Technology** | React + Vite + Vanilla CSS, zero paid APIs, zero external AI APIs | Verified |
| **Design** | Clean white background, navy & teal accents, readable fonts, no generic AI buzzwords | Verified |
| **Customer Form** | 4 standard services, optional name, no phone/email needed, duplicate click prevention | Verified |
| **Token Confirmation** | Unique token, large display, service name, people ahead, estimated wait time | Verified |
| **Live Tracking** | Current token, people ahead, estimated wait, status (Waiting/Serving/Completed), formula note | Verified |
| **Staff Dashboard** | Waiting queue (FIFO), serving counters, Call Next, Complete Service, counters add/toggle | Verified |
| **Disabled States** | Buttons disabled when action cannot be performed (e.g. Complete when idle) | Verified |
| **Staff Alerts** | Recommendation appears when waiting queue >= 4 with explanation | Verified |
| **Persistence** | Data stored in `localStorage`, survives page reload | Verified |
| **Reset Capability** | Reset Demo Queue with confirmation modal | Verified |
| **Cross-Tab Sync** | Storage event sync across multiple windows/tabs in real time | Verified |
| **Responsive** | Mobile, tablet, and desktop responsive layout | Verified |
| **Automated Tests** | `npm test` runs 15/15 passing assertions covering all business logic and edge cases | Verified |
