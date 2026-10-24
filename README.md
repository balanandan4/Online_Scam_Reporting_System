# Online Scam Reporting System (CyberShield)

> A full-stack, secure, web-based platform for citizens to report online fraud, submit digital evidence, track complaint status via visual timelines, and enable administrative investigation management and analytics.

---

## 1. Project Overview & Problem Statement

Digital financial services, social messaging platforms, and online shopping marketplaces have dramatically increased the frequency and sophistication of cyber fraud—including UPI payment traps, phishing clones, cryptocurrency arbitrage Ponzi schemes, fake remote job offers, and social engineering OTP compromises.

Victims often face disjointed reporting channels, lack visibility into case triage progress, and struggle to preserve organized digital evidence. **CyberShield** addresses this problem by providing a structured, secure, and transparent incident reporting and tracking platform that connects victims with case investigators through two-way updates and forensic evidence handling.

### Key Objectives
- **Citizen Empowerment:** Provide a simple, accessible interface to catalog incident narratives and attach evidence.
- **Unique Incident Tracking:** Automatically assign non-sequential reference IDs (`SCAM-2026-XXXXX`) allowing tracking without exposing personal identity.
- **Two-Way Communication:** Enable investigators to request additional information and allow victims to reply directly on their case timeline.
- **Administrative Triage:** Provide investigators with search, risk classification, priority tagging, confidential notes, and an immutable audit trail.
- **Forensic Analytics:** Present database-backed trend visualizations (Recharts) to identify emerging fraud patterns and high-risk payment channels.

---

## 2. Technology Stack

- **Frontend:** React 19 SPA, TypeScript, Vite
- **Styling:** Tailwind CSS 4 (Cybersecurity Dark Navy & Blue palette, accessible WCAG AA contrast)
- **Charts:** Recharts (Bar, Donut, Timeline charts)
- **Icons:** Lucide React
- **Backend:** Node.js, Express.js REST API
- **Database:** SQLite (ACID compliant via `sql.js` WebAssembly engine with persistent disk storage in `data/scam_reporting.sqlite`)
- **Authentication:** JWT (JSON Web Tokens), Bcrypt password hashing (10 salt rounds), secure cookies
- **File Ingestion:** Multer with MIME verification and safe cryptographic filename generation

---

## 3. User Roles & Authorization

### A. Citizen User
- Register with legal name, email, password, and phone number.
- Personalized dashboard showing counts of total reports, under review, action required, and resolved cases.
- Submit scam reports with full categorization, financial loss figures, suspect identifiers, and up to 5 evidence files ($\le 5\text{MB}$ each).
- Visual timeline displaying timestamped status progression and investigator updates.
- Real-time in-app notifications with unread badge counter.
- Two-way interaction: reply with requested transaction hashes or statements if an investigator asks for additional info.
- Profile settings & secure password change.
- **Strict Isolation:** Citizens can only view and manage their own complaints.

### B. Administrator / Investigator
- Access protected `/admin` console via role-based middleware (`requireAdmin`).
- Search and filter all complaints by status, category, priority, date range, or reporter details.
- Inspect attached digital evidence files.
- Update case status (`Submitted`, `Under Review`, `Additional Information Required`, `Escalated`, `Resolved`, `Closed`).
- Assign priority (`Low`, `Medium`, `High`, `Critical`).
- Maintain **Confidential Internal Notes** visible only to investigators and recorded in the audit trail, alongside **Public Victim Updates**.
- Access interactive analytics and real-time audit logs.

---

## 4. Scam Categories Catalog

The system supports the 10 standardized fraud categories:
1. **Phishing and fake websites**
2. **UPI and digital payment scams**
3. **Online shopping fraud**
4. **Job and employment scams**
5. **Investment and cryptocurrency scams**
6. **Social media impersonation**
7. **OTP and account takeover scams**
8. **Fake customer support scams**
9. **Loan and financial scams**
10. **Other online scams**

---

## 5. System Architecture

CyberShield utilizes a clean 3-tier full-stack architecture:
- **Presentation Layer:** React 19 SPA running on port 3000.
- **API & Application Layer:** Express REST API with security middleware (rate-limiting, security headers, JWT validation).
- **Persistence Layer:** SQLite relational database stored on disk (`data/scam_reporting.sqlite`) with foreign key constraints, indexes, and parameterized queries. Evidence files are stored in `uploads/` with access-controlled streaming endpoints.

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) and [`docs/DATA_FLOW_DIAGRAMS.md`](docs/DATA_FLOW_DIAGRAMS.md) for full architecture and DFD diagrams.

---

## 6. Database Schema Overview

The database contains 6 relational tables:
1. `users`: Citizen and administrative accounts with bcrypt password hashes.
2. `reports`: Core incident reports with unique reference codes, category, losses, suspect leads, status, and priority.
3. `evidence`: Uploaded file metadata, stored filenames, original filenames, and file sizes.
4. `report_updates`: Full chronological status transition history with public messages and internal investigator notes.
5. `notifications`: In-app notification queue for victim alerts.
6. `audit_logs`: Tamper-evident record of all administrative status changes and actions.

See [`docs/ERD.md`](docs/ERD.md) for detailed schemas, data types, and crow's foot diagrams.

---

## 7. API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Create citizen account (strictly role: 'user')
- `POST /api/auth/login` - Authenticate with rate-limiting and issue JWT
- `POST /api/auth/logout` - Clear session cookies
- `GET /api/auth/me` - Get current authenticated user profile
- `PUT /api/auth/profile` - Update name and phone
- `PUT /api/auth/change-password` - Verify old password and set new password

### Reports (Citizen)
- `POST /api/reports` - Submit new complaint with multipart file evidence
- `GET /api/reports/my` - Fetch authenticated user's reports & summary stats
- `GET /api/reports/my/:id` - Fetch detailed report, evidence, and public timeline
- `GET /api/reports/track/:reference` - Public tracking query by reference ID
- `POST /api/reports/:id/provide-info` - Submit additional requested evidence/clarification

### Administration (Role: Admin)
- `GET /api/admin/reports` - Search, filter, and paginate master case queue
- `GET /api/admin/reports/:id` - View full case, internal notes, and audit history
- `PATCH /api/admin/reports/:id/status` - Update status, add public update and private note
- `PATCH /api/admin/reports/:id/priority` - Update priority level
- `GET /api/admin/stats` - Real database aggregated metrics and chart series
- `GET /api/admin/audit-logs` - Query chronologically logged administrative events

### Evidence & Notifications
- `GET /api/evidence/:id` - Access-controlled file download (owner or admin)
- `GET /api/notifications` - Retrieve citizen's in-app notifications
- `PATCH /api/notifications/:id/read` - Mark single notification read
- `POST /api/notifications/read-all` - Mark all notifications read

---

## 8. Installation & Setup Instructions

### Prerequisites
- Node.js (version 18 or higher)
- npm or bun

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` if custom variables are required:
```bash
cp .env.example .env
```
Default parameters (port 3000, local SQLite path `data/scam_reporting.sqlite`) work out of the box with zero external configuration required.

### 3. Run the Full-Stack Application
```bash
npm run dev
```
The application will start at `http://localhost:3000` or `http://0.0.0.0:3000`. The Express backend and Vite frontend run together seamlessly.

---

## 9. Demo Accounts & Testing

The system automatically initializes the SQLite database with seed accounts and fictional realistic demo reports covering various categories:

### Default Credentials

| Role | Email | Password | Description |
|---|---|---|---|
| **Administrator** | `admin@scamreporting.gov` | `Admin@12345` | Full administrative access to triage queue, confidential notes, and analytics. |
| **Citizen (John Doe)** | `john.doe@example.com` | `User@12345` | Demo user with filed complaints (UPI scam, Crypto arbitrage, Online shopping). |
| **Citizen (Sarah Jenkins)**| `sarah.jenkins@example.com`| `User@12345` | Demo user with filed complaints (Phishing bank portal). |

> **Note for Evaluators:** The login modal includes a convenient **1-Click Quick Demo** switcher button for instant login during testing without typing!

### Sample Tracking Reference Codes
- `SCAM-2026-8K401` - Electricity Bill UPI Scam (Status: Under Review)
- `SCAM-2026-9M102` - Crypto Arbitrage Bot Scam (Status: Additional Information Required)
- `SCAM-2026-3P804` - Cloned Bank NetBanking Portal (Status: Escalated)
- `SCAM-2026-1V550` - Fake Drone Store (Status: Resolved)

---

## 10. Automated Testing

The project includes an automated test suite verifying password hashing, JWT authentication, multi-user isolation, complaint ingestion, timeline updates, notifications, audit logging, and database metrics.

Run the test suite with:
```bash
npm test
```
Or directly with:
```bash
npx tsx test/api.test.ts
```

All 12 backend verification tests run and pass in under 5 seconds.

---

## 11. Software Engineering Documentation

Full design documents are available in the `docs/` folder:
- [`docs/SRS.md`](docs/SRS.md) - Software Requirements Specification
- [`docs/USE_CASES.md`](docs/USE_CASES.md) - Use Case Diagram & Specifications
- [`docs/DATA_FLOW_DIAGRAMS.md`](docs/DATA_FLOW_DIAGRAMS.md) - Context (Level 0) and Level 1 DFDs
- [`docs/ERD.md`](docs/ERD.md) - Entity Relationship Diagram & Table Specs
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - System Architecture Diagram
- [`docs/TEST_CASES.md`](docs/TEST_CASES.md) - Comprehensive Test Cases & Results

---

## 12. Known Limitations & Future Enhancements

### Known Limitations
- Current SMS/phone updates are simulated through the in-app notification center; integration with telecom SMS gateways requires third-party provider credentials.
- PDF generation of formal police FIR dispute packets is currently handled via browser print/download view.

### Future Enhancements
- Integration with national bank API chargeback reconciliation networks.
- Multi-factor authentication (TOTP authenticator app) for administrative personnel.
- Automated OCR extraction of transaction IDs from uploaded bank screenshot receipts.
- Geolocation heatmapping of physical ATM withdrawal and scammer call origins.
