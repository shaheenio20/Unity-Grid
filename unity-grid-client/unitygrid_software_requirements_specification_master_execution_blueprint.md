# UnityGrid: Software Requirements Specification & Master Execution Blueprint
**TechArenaX Vibe Coding Challenge — Season 01 | Category 6: Community Support & Collaboration**

---

## 1. Project Overview & System Vision

### Problem Statement
University ecosystems often suffer from fragmented communication channels. Academic updates, departmental notices, student club activities, emergency blood donation drives, and disaster relief operations are scattered across social media groups and messaging apps. During emergencies—such as regional flash floods or critical blood shortages—this fragmentation leads to delays, uncoordinated rescue efforts, and a lack of financial transparency in community relief funds.

### Dual-Mode System Architecture
UnityGrid addresses these challenges through a centralized, dual-mode web platform engineered for seamless switching between routine academic operations and critical emergency responses:

- **Campus Normal Mode:** Functions as an all-in-one campus hub. It provides structured portals for academic departments, student club administration, committee rosters, event coordination, and an active donor-matched blood bank.
- **Emergency Flood / Crisis Mode:** Activated globally by Super Admins during crises (e.g., Sylhet flash floods). It transforms the interface into a high-priority command hub featuring a dynamic crisis ticket board, real-time rescue tracking, direct emergency chat routes, and a transparent public financial ledger backed by automated receipt processing.

### Core Value Proposition
1. **Unified Campus Infrastructure:** Streamlines department and club engagement while maintaining clear oversight.
2. **AI-Powered Emergency Response:** Integrates Google Gemini API (`@google/generative-ai`) to parse chaotic user-submitted text in Bengali, Banglish, or English into structured SOS tickets (capturing location, urgency, contact info, and immediate needs).
3. **Transparent Financial Relief Ledger:** Guarantees transparency for relief drives through public income/expense tracking and AI-driven automated receipt verification.
4. **Targeted Emergency Blood Logistics:** Matches blood requests with eligible campus donors based on blood group, location, and a 90-day cooldown algorithm.

---

## 2. User Roles & Permissions (RBAC)
UnityGrid enforces strict Role-Based Access Control (RBAC) across three distinct user tiers.

| Role | Target Persona | Key Responsibilities | Permitted System Actions |
| :--- | :--- | :--- | :--- |
| **Admin** | Super Admin / Department Coordinator | System administration, platform oversight, and emergency state control. | Toggle global Crisis Mode; create/delete Departments and Clubs; assign user roles; manage platform users; override SOS ticket statuses; audit financial ledgers. |
| **Member** | Club Executive / Volunteer Lead | Organizing campus activities and leading field relief operations. | Manage assigned Club details and committee posts; create and update Events (Upcoming, Ongoing, Completed); verify blood and financial donations; triage and update Crisis SOS tickets. |
| **Student** | General Student / Verified Blood Donor | Campus participation, peer support, and crisis assistance. | Browse departments, clubs, and events; register for events/volunteer roles; submit blood donation requests; log blood donation history; submit emergency SOS tickets; post public relief donations with receipts; send 1-to-1 help messages. |

---

## 3. Strict Step-by-Step Execution Order
Follow this 8-step build sequence to develop the application incrementally.

```text
┌─────────────────────────────────────────────────────────┐
│ Step 1: Backend Setup, Database & Authentication        │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│ Step 2: Core Academic Models & CRUD APIs                │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│ Step 3: Crisis, Blood Bank, Gemini AI & Messaging APIs  │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│ Step 4: Frontend Base Setup & Auth Integration          │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│ Step 5: Admin & Member Command Dashboards               │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│ Step 6: Public Campus Pages (Depts, Clubs, Events)      │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│ Step 7: Blood Bank, Crisis Hub & Messaging Modules      │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│ Step 8: Home Page Polish, AI Integration & Seed Data    │
└─────────────────────────────────────────────────────────┘
```

### Step 1: Backend Foundation & Authentication
1. Initialize the Node.js ES Module project (`unitygrid-server`).
2. Establish a Mongoose connection to MongoDB Atlas.
3. Configure Better Auth (`better-auth`) with the MongoDB adapter, mounted at `/api/auth/*`.
4. **Critical Middleware Order:** Mount better-auth route handlers *before* `express.json()` to ensure raw body parsing for auth webhooks and authentication sessions operate correctly.
5. Set up CORS middleware allowing credentials (`credentials: true`) pointing to the client origin (`http://localhost:5173`).
6. Implement `requireRole(roles)` middleware to protect downstream API endpoints by validating user roles from the session.

### Step 2: Backend Models & Core CRUD APIs (Departments, Clubs & Events)
1. Define Mongoose schemas for `Department`, `Club`, and `Event`.
2. Implement REST endpoints for creating and querying departments and clubs.
3. Build Event management endpoints with status tracking (`Upcoming`, `Ongoing`, `Completed`) and volunteer signup handling.
4. Verify all endpoints via Postman or Thunder Client using test payloads.

### Step 3: Backend Blood, Flood Crisis, Gemini AI & Chat APIs
1. Create schemas for `BloodRequest`, `CrisisTicket`, `Donation`, `LedgerExpense`, and `Message`.
2. Integrate `@google/generative-ai` to power two key features:
   - **SOS Parser:** Parses unstructured Bengali, Banglish, or English emergency text into JSON (location, urgency, contact info, required items).
   - **Receipt Verification:** Analyzes uploaded payment/receipt images to verify relief expenditures.
3. Build endpoints for `/api/blood`, `/api/crisis`, `/api/ledger`, and `/api/messages`.

### Step 4: Frontend Setup, Auth & Protected Routing
1. Initialize `unitygrid-client` using Vite with React (pure `.jsx` components) and configure Tailwind CSS and Lucide React icons.
2. Initialize `better-auth/react` client pointing to the backend host (`http://localhost:5000`).
3. Construct `/login` and `/register` views. Ensure registration captures student metadata: `department`, `studentId`, `bloodGroup`, and `phone`.
4. Create `ProtectedRoute.jsx` to restrict access based on session state and user role.

### Step 5: Admin & Member Dashboards First
1. Implement `/dashboard/admin` to allow Super Admins to toggle system-wide Crisis Mode, create departments/clubs, modify user roles, and monitor system metrics.
2. Implement `/dashboard/member` to let club executives maintain committee rosters, post events, verify donations, and manage crisis response tickets.
3. Verify that changes made in the admin/member views persist properly in MongoDB.

### Step 6: Public Campus Pages
1. Build `/departments` to display academic departments alongside linked clubs and notice boards.
2. Build `/clubs/:clubId` featuring active committee cards, executive contacts, and club events.
3. Build `/events` with filter tabs (All, Upcoming, Ongoing, Completed) and an interactive volunteer join modal.

### Step 7: Blood Bank, Flood Crisis Hub & In-App Chat
1. Construct `/blood-bank` featuring an urgent blood request feed, direct donor contact actions, and donor availability checks using a 90-day cooldown filter (`lastDonatedAt`).
2. Construct `/crisis-hub` containing the dynamic AI SOS parsing form, rescue ticket list, live impact stats, and the transparent public financial ledger.
3. Build `/messages` supporting direct 1-to-1 help channels and context-based group channels.

### Step 8: Home Command Center Polish & Seed Data
1. Construct the `/` landing page featuring dynamic emergency banners (triggered when Crisis Mode is active), real-time counter metrics, split blood/crisis activity streams, and an interactive AI SOS parser demo.
2. Create `seed.js` script to populate the database with initial university departments, student clubs, sample events, blood requests, and emergency relief data for demo purposes.

---

## 4. Complete Database Schema Specifications

```text
                     ┌─────────────────┐
                     │      User       │
                     └────────┬────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       │ 1:N                  │ 1:N                  │ 1:N
       ▼                      ▼                      ▼
┌──────────────┐      ┌──────────────┐      ┌─────────────────┐
│ BloodRequest │      │ CrisisTicket │      │    Donation     │
└──────────────┘      └──────────────┘      └─────────────────┘
                                                     │
                                                     │ 1:1
                                                     ▼
                                            ┌─────────────────┐
                                            │  LedgerExpense  │
                                            └─────────────────┘
```

The application relies on 9 main MongoDB collections structured as follows:

| Collection | Key Fields | Field Types & Constraints | Purpose & Description |
| :--- | :--- | :--- | :--- |
| `users` | `_id`, `name`, `email`, `role`, `department`, `studentId`, `bloodGroup`, `lastDonatedAt`, `phone`, `isAvailableForDonation`, `createdAt` | ObjectId, String, String (unique), Enum ['Admin', 'Member', 'Student'], ObjectId (ref: Department), String, Enum ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], Date, String, Boolean, Date | Extended User profile storing identity, roles, and blood donation metadata. |
| `departments` | `_id`, `name`, `code`, `description`, `headOfDept`, `createdAt` | ObjectId, String, String (unique), String, String, Date | Campus academic departments. |
| `clubs` | `_id`, `name`, `code`, `departmentId`, `description`, `logo`, `committee`, `createdAt` | ObjectId, String, String, ObjectId (ref: Department), String, String (URL), Array of Objects `[{ userId, designation }]`, Date | Student organizations and executive leadership listings. |
| `events` | `_id`, `title`, `description`, `clubId`, `banner`, `status`, `location`, `startDate`, `endDate`, `volunteers`, `createdAt` | ObjectId, String, String, ObjectId (ref: Club), String (URL), Enum ['Upcoming', 'Ongoing', 'Completed'], String, Date, Date, Array of ObjectIds (ref: User), Date | Campus events and volunteer drives. |
| `bloodrequests` | `_id`, `requesterId`, `patientName`, `bloodGroup`, `unitsNeeded`, `hospital`, `location`, `contactNumber`, `urgency`, `status`, `requiredDate`, `createdAt` | ObjectId, ObjectId (ref: User), String, Enum ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], Number, String, String, String, Enum ['Low', 'Medium', 'Critical'], Enum ['Pending', 'Fulfilled', 'Cancelled'], Date, Date | Track urgent blood donation requests. |
| `crisistickets` | `_id`, `reporterId`, `rawText`, `parsedData`, `location`, `urgency`, `contactInfo`, `status`, `assignedVolunteers`, `createdAt` | ObjectId, ObjectId (ref: User), String, Object `{ location, urgency, contact, needs }`, String, Enum ['Low', 'Medium', 'Critical'], String, Enum ['Open', 'In Progress', 'Resolved'], Array of ObjectIds (ref: User), Date | Emergency SOS tickets parsed via Google Gemini API. |
| `donations` | `_id`, `donorId`, `donorName`, `amount`, `paymentMethod`, `transactionId`, `receiptImage`, `isVerified`, `verifiedBy`, `createdAt` | ObjectId, ObjectId (ref: User), String, Number, Enum ['bKash', 'Nagad', 'Rocket', 'Bank'], String, String (URL), Boolean, ObjectId (ref: User), Date | Incoming community relief donations. |
| `ledgerexpenses` | `_id`, `title`, `amount`, `category`, `receiptImage`, `aiVerified`, `aiConfidenceScore`, `verifiedBy`, `spentAt`, `createdAt` | ObjectId, String, Number, Enum ['Food', 'Medicine', 'Rescue Operation', 'Logistics', 'Other'], String (URL), Boolean, Number, ObjectId (ref: User), Date, Date | Public audit trail for expenditures verified by AI. |
| `messages` | `_id`, `senderId`, `receiverId`, `channelId`, `content`, `createdAt` | ObjectId, ObjectId (ref: User), ObjectId (ref: User, optional), String (optional), String, Date | Direct member-to-member messages and group coordination chats. |

---

## 5. Complete RESTful API Specification

### Authentication Modules (`/api/auth/*`)
- Managed via Better Auth middleware. Handles `/api/auth/sign-in`, `/api/auth/sign-up`, `/api/auth/sign-out`, and `/api/auth/get-session`.

### Administrative Control APIs (`/api/admin`)
- **`PATCH /api/admin/system-mode`**
  - **Role Required:** Admin
  - **Description:** Toggle the global site mode between Campus Normal and Emergency Crisis.
  - **Payload:** `{ "isCrisisMode": true }`
  - **Response:** `{ "success": true, "isCrisisMode": true, "message": "System mode updated." }`
- **`PATCH /api/admin/users/:userId/role`**
  - **Role Required:** Admin
  - **Description:** Modify a target user's system role.
  - **Payload:** `{ "role": "Member" }`
  - **Response:** `{ "success": true, "user": { "_id": "...", "role": "Member" } }`

### Departments & Clubs APIs (`/api/departments`, `/api/clubs`)
- **`GET /api/departments`**
  - **Role Required:** Public
  - **Response:** Array of department objects containing assigned club references.
- **`POST /api/departments`**
  - **Role Required:** Admin
  - **Payload:** `{ "name": "Computer Science & Engineering", "code": "CSE", "description": "Dept of CSE", "headOfDept": "Dr. Ariful Islam" }`
  - **Response:** `{ "success": true, "department": { ... } }`
- **`GET /api/clubs/:clubId`**
  - **Role Required:** Public
  - **Response:** Populated club object including executive committee profiles and active events.
- **`POST /api/clubs`**
  - **Role Required:** Admin
  - **Payload:** `{ "name": "SUST Science Arena", "code": "SSA", "departmentId": "65f1a2b...", "description": "Science & Tech Club" }`
  - **Response:** `{ "success": true, "club": { ... } }`
- **`PATCH /api/clubs/:clubId/committee`**
  - **Role Required:** Admin, Member (Executive of target club)
  - **Payload:** `{ "committee": [{ "userId": "65f3...", "designation": "President" }] }`
  - **Response:** `{ "success": true, "club": { ... } }`

### Event Management APIs (`/api/events`)
- **`GET /api/events`**
  - **Role Required:** Public
  - **Query Params:** `status` (Upcoming | Ongoing | Completed), `clubId`
  - **Response:** Array of event objects matching the selected filters.
- **`POST /api/events`**
  - **Role Required:** Admin, Member
  - **Payload:** `{ "title": "Annual Tech Fest 2025", "description": "...", "clubId": "65f...", "banner": "https://...", "startDate": "2025-04-10T09:00:00Z", "endDate": "2025-04-12T18:00:00Z" }`
  - **Response:** `{ "success": true, "event": { ... } }`
- **`POST /api/events/:eventId/volunteer`**
  - **Role Required:** Student, Member, Admin
  - **Description:** Register the logged-in user as a volunteer for an event.
  - **Response:** `{ "success": true, "message": "Successfully registered as volunteer." }`

### Blood Bank APIs (`/api/blood`)
- **`GET /api/blood/requests`**
  - **Role Required:** Public
  - **Query Params:** `bloodGroup`, `status`
  - **Response:** Array of active blood requests ordered by urgency and date.
- **`POST /api/blood/requests`**
  - **Role Required:** Student, Member, Admin
  - **Payload:** `{ "patientName": "Rahim Uddin", "bloodGroup": "O+", "unitsNeeded": 2, "hospital": "Sylhet MAG Osmani Medical College", "location": "Sylhet", "contactNumber": "01700000000", "urgency": "Critical", "requiredDate": "2025-03-30T10:00:00Z" }`
  - **Response:** `{ "success": true, "request": { ... } }`
- **`PATCH /api/blood/requests/:requestId/status`**
  - **Role Required:** Admin, Member, Request Creator
  - **Payload:** `{ "status": "Fulfilled" }`
  - **Response:** `{ "success": true, "request": { ... } }`
- **`GET /api/blood/donors`**
  - **Role Required:** Public
  - **Query Params:** `bloodGroup`
  - **Description:** Lists donors whose `lastDonatedAt` date was more than 90 days ago.
  - **Response:** Array of eligible donor profile objects.
- **`POST /api/blood/log-donation`**
  - **Role Required:** Student, Member, Admin
  - **Payload:** `{ "donationDate": "2025-03-25T00:00:00Z" }`
  - **Response:** Updates `lastDonatedAt` on the user record and marks them temporarily ineligible.

### Flood Crisis & Gemini AI APIs (`/api/crisis`)
- **`POST /api/crisis/parse-sos`**
  - **Role Required:** Public / Student
  - **Payload:** `{ "rawText": "আমারা ৩ জন সিলেটে জালালাবাদ ঘাটে আটকে আছি, পানি নামছে না, খাবার ও পানি শেষ, কল দিন 01811111111" }`
  - **Gemini Prompt Strategy:** Uses structured JSON prompts via standard system instructions.
  - **Response:**
    ```json
    {
      "success": true,
      "parsed": {
        "location": "Jalalabad Ghat, Sylhet",
        "urgency": "Critical",
        "contactInfo": "01811111111",
        "needs": "Food, Clean Water, Immediate Rescue",
        "peopleCount": 3
      }
    }
    ```
- **`POST /api/crisis/tickets`**
  - **Role Required:** Public / Student
  - **Payload:** `{ "rawText": "...", "parsedData": { ... }, "location": "...", "urgency": "Critical", "contactInfo": "..." }`
  - **Response:** Creates a record in `crisistickets`.
- **`GET /api/crisis/tickets`**
  - **Role Required:** Public
  - **Query Params:** `status`, `urgency`
  - **Response:** List of emergency tickets.
- **`PATCH /api/crisis/tickets/:ticketId`**
  - **Role Required:** Admin, Member
  - **Payload:** `{ "status": "In Progress", "assignedVolunteers": ["65f..."] }`
  - **Response:** `{ "success": true, "ticket": { ... } }`

### Public Ledger & Receipt Verification APIs (`/api/ledger`)
- **`GET /api/ledger/summary`**
  - **Role Required:** Public
  - **Response:** Summary object returning `{ "totalDonations": 150000, "totalExpenses": 85000, "balance": 65000 }`.
- **`POST /api/ledger/donations`**
  - **Role Required:** Student, Member, Admin
  - **Payload:** `{ "donorName": "Anonymous", "amount": 5000, "paymentMethod": "bKash", "transactionId": "TRX998877", "receiptImage": "https://..." }`
  - **Response:** `{ "success": true, "donation": { ... } }`
- **`POST /api/ledger/expenses`**
  - **Role Required:** Admin, Member
  - **Payload:** `{ "title": "Bought 50 Emergency Water Packets", "amount": 12000, "category": "Food", "receiptImage": "https://..." }`
  - **AI Logic:** Passes the image URL to Gemini Vision (`gemini-2.5-flash`) to verify purchase items and amount totals.
  - **Response:**
    ```json
    {
      "success": true,
      "expense": {
        "title": "Bought 50 Emergency Water Packets",
        "amount": 12000,
        "aiVerified": true,
        "aiConfidenceScore": 0.94
      }
    }
    ```

### In-App Communication APIs (`/api/messages`)
- **`GET /api/messages/direct/:otherUserId`**
  - **Role Required:** Authenticated User
  - **Response:** Array of chat messages between the session user and target user.
- **`POST /api/messages/direct`**
  - **Role Required:** Authenticated User
  - **Payload:** `{ "receiverId": "65f...", "content": "I am nearby with a motorboat." }`
  - **Response:** Saved message object.

---

## 6. Page-by-Page Frontend Architecture

### 1. Route: `/` (Home Command Center)
- **Access Level:** Public
- **APIs Called on Load:** `GET /api/admin/system-mode`, `GET /api/ledger/summary`, `GET /api/blood/requests?urgency=Critical`, `GET /api/crisis/tickets?status=Open`
- **UI Sections & Interactive Components:**
  - **Dynamic Status Banner:** Shows "Campus Normal Mode" (emerald accent) or "EMERGENCY CRISIS MODE ACTIVE" (red accent) based on backend state.
  - **Live Impact Counter:** Cards displaying total relief raised, verified expenses, active blood donors, and resolved SOS tickets.
  - **Interactive AI Quick SOS Parser Demo:** Textarea for Bengali/Banglish crisis input with a "Parse with AI" action button.
  - **Split Activity Stream:** Left side shows urgent blood requests; right side shows open crisis response tickets.

### 2. Route: `/login` (Authentication Portal)
- **Access Level:** Public (Guest)
- **APIs Called:** Auth sign-in endpoint.
- **UI Sections & Interactive Components:**
  - Clean card interface for Email/Password entry.
  - Quick links to the registration page.

### 3. Route: `/register` (User Onboarding)
- **Access Level:** Public (Guest)
- **APIs Called:** `GET /api/departments` (for dropdown), Auth sign-up endpoint.
- **UI Sections & Interactive Components:**
  - Form fields: Full Name, Email, Password, Department (dropdown), Student ID, Phone Number, and Blood Group.
  - Toggle checkbox: "Available as Active Blood Donor".

### 4. Route: `/departments` (Academic Directory)
- **Access Level:** Public
- **APIs Called:** `GET /api/departments`
- **UI Sections & Interactive Components:**
  - Grid of department cards displaying department code, full name, department head, and associated clubs.

### 5. Route: `/clubs/:clubId` (Club Profile & Committee Hub)
- **Access Level:** Public
- **APIs Called:** `GET /api/clubs/:clubId`
- **UI Sections & Interactive Components:**
  - Banner & header with club logo, description, and department tag.
  - Executive Committee grid showing designated roles (President, General Secretary, Volunteer Lead).
  - Tabbed events list displaying active events hosted by the club.

### 6. Route: `/events` (Campus Events & Volunteer Hub)
- **Access Level:** Public
- **APIs Called:** `GET /api/events`
- **UI Sections & Interactive Components:**
  - Filter tabs: All, Upcoming, Ongoing, Completed.
  - Event cards displaying banner, host club, date/time, location, and volunteer count.
  - "Join as Volunteer" modal for logged-in students.

### 7. Route: `/blood-bank` (Blood Match & Donor Portal)
- **Access Level:** Authenticated Users
- **APIs Called:** `GET /api/blood/requests`, `GET /api/blood/donors`, `POST /api/blood/log-donation`
- **UI Sections & Interactive Components:**
  - Urgency banner for critical blood requirements.
  - "Request Blood" button opening a request form modal.
  - 90-Day Cooldown Eligibility Indicator: Displays donor eligibility status based on `lastDonatedAt`.
  - Filterable donor list filtered by blood group.

### 8. Route: `/crisis-hub` (Emergency Operations & Public Ledger)
- **Access Level:** Public (Submission requires authentication)
- **APIs Called:** `POST /api/crisis/parse-sos`, `POST /api/crisis/tickets`, `GET /api/crisis/tickets`, `GET /api/ledger/summary`
- **UI Sections & Interactive Components:**
  - **SOS Parser Console:** Auto-fills parsed ticket fields (Location, Contact, Needs) using Gemini API.
  - **Live SOS Ticket Board:** Cards with urgency badges (Critical, Medium, Low), status selectors, and direct action buttons.
  - **Public Relief Ledger Panel:** Dynamic balance sheet displaying total funds raised vs. spent.
  - **Submit Donation Modal:** File upload for bKash/Nagad transaction receipts.

### 9. Route: `/messages` (Communication Hub)
- **Access Level:** Authenticated Users
- **APIs Called:** `GET /api/messages/direct/:otherUserId`, `POST /api/messages/direct`
- **UI Sections & Interactive Components:**
  - Split chat window with contact list on the left and active message thread on the right.
  - Quick-contact action buttons from blood requests or crisis tickets.

### 10. Route: `/dashboard/member` (Member Command Center)
- **Access Level:** Member, Admin
- **APIs Called:** `GET /api/events?clubId=...`, `GET /api/crisis/tickets`, `PATCH /api/crisis/tickets/:ticketId`
- **UI Sections & Interactive Components:**
  - Club management workspace to update committee positions and manage event listings.
  - Rescue dispatch queue to assign volunteers to incoming SOS tickets.
  - Financial verification queue to audit public donations and upload expense receipts.

### 11. Route: `/dashboard/admin` (System Super Admin Dashboard)
- **Access Level:** Admin
- **APIs Called:** `PATCH /api/admin/system-mode`, `GET /api/admin/users`, `PATCH /api/admin/users/:userId/role`, `POST /api/departments`, `POST /api/clubs`
- **UI Sections & Interactive Components:**
  - **Master System Switch:** Toggle between Campus Normal Mode and Emergency Crisis Mode.
  - User Role Manager: Interface to search users and update roles (Student ↔ Member ↔ Admin).
  - Creation forms for new Academic Departments and Student Clubs.
  - Audit logs for platform financial transactions and SOS resolution metrics.

---

## 7. Complete Folder Structure (Pure JavaScript)

```text
unitygrid/
├── unitygrid-server/
│   ├── package.json
│   ├── .env
│   ├── server.js
│   ├── config/
│   │   ├── db.js
│   │   └── betterAuth.js
│   ├── middleware/
│   │   └── requireRole.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Department.js
│   │   ├── Club.js
│   │   ├── Event.js
│   │   ├── BloodRequest.js
│   │   ├── CrisisTicket.js
│   │   ├── Donation.js
│   │   ├── LedgerExpense.js
│   │   └── Message.js
│   ├── routes/
│   │   ├── admin.routes.js
│   │   ├── department.routes.js
│   │   ├── club.routes.js
│   │   ├── event.routes.js
│   │   ├── blood.routes.js
│   │   ├── crisis.routes.js
│   │   ├── ledger.routes.js
│   │   └── message.routes.js
│   └── utils/
│       ├── geminiSosParser.js
│       └── geminiReceiptScanner.js
│
└── unitygrid-client/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── lib/
        │   └── authClient.js
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Footer.jsx
        │   ├── EmergencyBanner.jsx
        │   ├── ProtectedRoute.jsx
        │   ├── TicketCard.jsx
        │   └── LedgerSummaryCard.jsx
        └── pages/
            ├── Home.jsx
            ├── Login.jsx
            ├── Register.jsx
            ├── Departments.jsx
            ├── ClubDetails.jsx
            ├── Events.jsx
            ├── BloodBank.jsx
            ├── CrisisHub.jsx
            ├── Messages.jsx
            ├── MemberDashboard.jsx
            └── AdminDashboard.jsx
```

### Server Directory Breakdown (`unitygrid-server`)
- `server.js`: Server entry point. Connects to MongoDB, configures CORS, mounts better-auth before `express.json()`, registers API routes, and starts the server.
- `config/db.js`: Mongoose database connection initialization logic.
- `config/betterAuth.js`: Configures better-auth using the MongoDB adapter and user collection extensions.
- `middleware/requireRole.js`: Express authorization middleware to restrict access based on session roles (Admin, Member, Student).
- `models/*.js`: Mongoose models defining collection structures for Users, Departments, Clubs, Events, Blood Requests, Crisis Tickets, Donations, Ledger Expenses, and Messages.
- `routes/*.js`: Dedicated Express routers mapping endpoints to database operations and AI integrations.
- `utils/geminiSosParser.js`: Integration module wrapping `@google/generative-ai` to convert unstructured Bengali/Banglish crisis text into structured JSON.
- `utils/geminiReceiptScanner.js`: Image analysis utility using `@google/generative-ai` to scan purchase receipts and verify expense items.

### Client Directory Breakdown (`unitygrid-client`)
- `src/main.jsx`: React entry point rendering root providers and styles.
- `src/App.jsx`: Main routing configuration defining paths for all 11 application views.
- `src/lib/authClient.js`: Configured React authentication client for better-auth.
- `src/components/ProtectedRoute.jsx`: Wrapper component handling authorization checks and redirecting unauthorized users.
- `src/components/*.jsx`: Reusable UI elements including navigation bars, system status banners, SOS cards, and public ledger summaries.
- `src/pages/*.jsx`: View implementations corresponding to the specified route architecture.