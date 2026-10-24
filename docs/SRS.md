# Software Requirements Specification (SRS)
## Online Scam Reporting System (CyberShield)

**Document Version:** 1.0.0  
**Project Classification:** Academic Software Engineering Capstone Project  
**Date:** October 2026  

---

### 1. Introduction

#### 1.1 Purpose
The purpose of this document is to provide a complete specification of the **Online Scam Reporting System (CyberShield)**. It defines the functional and non-functional requirements, data models, system constraints, user characteristics, and interface requirements for citizens and administrative investigators.

#### 1.2 Scope
CyberShield is a web-based full-stack application designed to:
- Enable victims of cyber fraud and online scams to lodge structured complaints.
- Collect, validate, and store digital evidence (chat screenshots, payment receipts, URLs, phone numbers).
- Issue unique non-sequential reference tracking numbers (e.g., `SCAM-2026-XXXXX`).
- Provide authenticated citizen dashboards with chronological status progression timelines.
- Enable administrative investigators to triage complaints, classify risk, assign priority, add confidential internal case notes, issue public status updates, and request additional information from victims.
- Provide aggregate reporting analytics through data visualizations (Recharts).
- Maintain an immutable audit trail of all administrative interventions.

#### 1.3 Definitions, Acronyms, and Abbreviations
- **SRS:** Software Requirements Specification
- **RBAC:** Role-Based Access Control
- **JWT:** JSON Web Token
- **TXID / UTR:** Transaction Identifier / Unique Transaction Reference
- **Wasm:** WebAssembly
- **CERT:** Computer Emergency Response Team

---

### 2. Overall Description

#### 2.1 Product Perspective
CyberShield operates as an independent web application consisting of a single-page React frontend, an Express.js REST API layer, and an ACID-compliant SQLite relational database running via WebAssembly (`sql.js`) with disk persistence.

```
+--------------------+        HTTP/JSON / FormData        +--------------------+
|  React 19 + Vite   | <===============================> | Node / Express API |
|   Tailwind CSS     |                                    |  Auth Middleware   |
+--------------------+                                    +--------------------+
                                                                     |
                                                                     v
                                                          +--------------------+
                                                          |   SQLite Engine    |
                                                          |  (data/*.sqlite)   |
                                                          +--------------------+
```

#### 2.2 User Classes and Characteristics
1. **Unauthenticated Public Visitor:** Can view educational scam catalog, cyber tips, and track public status of complaints via unique reference IDs.
2. **Registered Citizen (Victim):** Can file detailed complaints, attach up to 5 evidence files, track their own reports, receive notifications, update profile details, and respond with additional evidence when requested.
3. **Administrative Case Officer:** Can review all submitted reports, filter/search cases, inspect uploaded files, modify case statuses, record internal confidential notes, and review audit logs and analytics.

---

### 3. Functional Requirements

#### 3.1 User Authentication & Authorization (FR-AUTH)
- **FR-AUTH-1:** The system shall allow citizens to register using a legal full name, unique email address, secure password (minimum 8 characters), and optional phone number.
- **FR-AUTH-2:** Passwords shall be hashed using `bcrypt` (10 salt rounds) before database storage.
- **FR-AUTH-3:** Administrative accounts cannot be registered via public endpoints and must be seeded or assigned via database administration.
- **FR-AUTH-4:** Successful login shall issue a cryptographically signed JWT token stored in HTTP cookies and localStorage.
- **FR-AUTH-5:** The system shall enforce rate-limiting on authentication endpoints to prevent brute-force attacks.

#### 3.2 Scam Report Ingestion (FR-REPORT)
- **FR-REPORT-1:** The system shall generate a unique, non-sequential alphanumeric reference code (e.g. `SCAM-2026-X8K92`) for each report.
- **FR-REPORT-2:** Mandatory input fields shall include Title (min 5 chars), Category (one of 10 approved types), Incident Date (not in future), Platform, Detailed Narrative (min 20 chars), and Accuracy Confirmation.
- **FR-REPORT-3:** Optional fields shall include Approximate Financial Loss, Payment Channel, Suspected Scammer coordinates, and Additional Context.
- **FR-REPORT-4:** The system shall allow up to 5 evidence files per submission (JPEG, PNG, WEBP, GIF, PDF) capped at 5MB per file with safe server-side file renaming.
- **FR-REPORT-5:** The system shall create an initial timeline entry with status `Submitted`.

#### 3.3 Report Tracking & Timeline (FR-TRACK)
- **FR-TRACK-1:** The system shall support public query by reference ID displaying only non-private data (title, category, date, and verification timeline).
- **FR-TRACK-2:** Citizens shall view a visual timeline of all status updates, timestamped with the officer's name and user-visible update notes.
- **FR-TRACK-3:** When an officer sets the status to `Additional Information Required`, the user dashboard shall display an active response box allowing the victim to append clarification notes and additional evidence files.

#### 3.4 In-App Notifications (FR-NOTIF)
- **FR-NOTIF-1:** For every status change, the system shall record an unread notification record linked to the report owner.
- **FR-NOTIF-2:** A notification badge with unread counter shall be displayed in the application header.
- **FR-NOTIF-3:** Citizens can mark individual notifications or all notifications as read.

#### 3.5 Administrative Case Management (FR-ADMIN)
- **FR-ADMIN-1:** Administrators can search all reports by reference ID, title, suspect coordinate, or victim identity.
- **FR-ADMIN-2:** Administrators can filter reports by status (`Submitted`, `Under Review`, `Additional Information Required`, `Escalated`, `Resolved`, `Closed`) and priority (`Low`, `Medium`, `High`, `Critical`).
- **FR-ADMIN-3:** Administrators can inspect attached evidence files securely.
- **FR-ADMIN-4:** When updating case status, administrators must be able to specify a user-visible public message and a confidential internal note separately.
- **FR-ADMIN-5:** The system shall record every administrative action into an append-only audit trail table (`audit_logs`).

---

### 4. Non-Functional Requirements

#### 4.1 Security
- Strict parameterization on all SQLite SQL queries to eliminate SQL injection vulnerabilities.
- Safe random server-side filename hashing for uploaded files to mitigate remote code execution and directory traversal.
- Role-based route guards: Citizens can only query their own reports (`WHERE user_id = ?`); unauthorized requests return HTTP 403/404.
- Password hashes and secret keys are never returned in client API responses.

#### 4.2 Usability & Accessibility
- WCAG AA compliant color contrast (dark navy `#0F172A`, white surfaces `#FFFFFF`, accessible text ratios $\ge 4.5:1$).
- Responsive layouts tested for desktop, tablet, and mobile viewports.
- Clear error notifications, loading spinners, and empty states.

#### 4.3 Performance & Reliability
- Relational schema indexed on primary query keys (`reports.user_id`, `reports.status`, `reports.report_reference`, `users.email`).
- Database modifications are committed to disk via atomic write buffers.
- Sub-150ms API response latency for standard list and detail queries.
