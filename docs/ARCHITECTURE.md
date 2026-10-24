# System Architecture
## Online Scam Reporting System (CyberShield)

### 1. High-Level Architecture Overview

CyberShield implements a decoupled, full-stack layered architecture designed for security, maintainability, low operational overhead, and robust local persistence.

```
+-----------------------------------------------------------------------------------------+
|                                    PRESENTATION TIER                                    |
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   |                           React 19 SPA (Vite Bundler)                           |   |
|   |  - Responsive Tailwind CSS 4 Styling (Navy / Cybersecurity Dark Canvas)         |   |
|   |  - Role-Aware Routing (Public Portal, Citizen Dashboard, Admin Console)         |   |
|   |  - Interactive Recharts Visualizations (Category Bar, Status Donut, Trends)     |   |
|   |  - Modal Workflows (Complaint Submission, Progress Timeline, Quick Reference)   |   |
|   +---------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------------+
                                             |
                                  HTTPS / REST / JSON
                                  Multipart/Form-Data
                                             v
+-----------------------------------------------------------------------------------------+
|                                    APPLICATION TIER                                     |
|                                                                                         |
|   +---------------------------------------------------------------------------------+   |
|   |                              Express.js HTTP Server                             |   |
|   |                                                                                 |   |
|   |  +-------------------+  +--------------------+  +----------------------------+  |   |
|   |  |  Security Headers |  |   Rate Limiting    |  |       Auth Middleware      |  |   |
|   |  |   (nosniff, XSS)  |  | (10 tries / minute)|  | (JWT Verify & RBAC Guards) |  |   |
|   |  +-------------------+  +--------------------+  +----------------------------+  |   |
|   |                                                                                 |   |
|   |  +---------------------------------------------------------------------------+  |   |
|   |  |                             API Route Handlers                            |  |   |
|   |  |   /api/auth       - Register, Login, Logout, Profile, Change Password     |  |   |
|   |  |   /api/reports    - Ingestion, User Dashboards, Reference Tracking        |  |   |
|   |  |   /api/admin      - Case Queue, Status Update, Notes, Analytics, Audit    |  |   |
|   |  |   /api/evidence   - Access-Controlled File Inspection & Downloads         |  |   |
|   |  |   /api/notif      - In-App Alerts & Status Update Notifications           |  |   |
|   |  +---------------------------------------------------------------------------+  |   |
|   +---------------------------------------------------------------------------------+   |
+-----------------------------------------------------------------------------------------+
                                             |
                                  Typed Parameterized SQL
                                  Direct File I/O
                                             v
+-----------------------------------------------------------------------------------------+
|                                    PERSISTENCE TIER                                     |
|                                                                                         |
|   +---------------------------------------+   +-------------------------------------+   |
|   |             SQLite Engine             |   |       Encrypted File Storage        |   |
|   |    (sql.js WebAssembly Engine)        |   |          (/uploads/ disk)           |   |
|   |                                       |   |                                     |   |
|   |  - data/scam_reporting.sqlite         |   |  - Unique timestamped filenames     |   |
|   |  - Foreign Key Constraints & PRAGMA   |   |  - MIME-type whitelisting           |   |
|   |  - Atomic sync on state mutation      |   |  - Owner & Admin authorization      |   |
|   +---------------------------------------+   +-------------------------------------+   |
+-----------------------------------------------------------------------------------------+
```

---

### 2. Architectural Principles

#### 2.1 Defense in Depth
- **Access Control:** All routes requiring authentication pass through `requireAuth`. All administrator endpoints strictly pass through `requireAdmin`. A standard citizen cannot view other users' cases or execute admin status transitions even if manipulating API URLs.
- **Evidence Protection:** Files uploaded to `/uploads` cannot be accessed via directory traversal or unauthenticated static routes. Instead, files are served via `/api/evidence/:id` which verifies that the requesting user is either the author of the complaint or an authorized administrator.

#### 2.2 Strict Zero-Mock Persistence
- The application does not use mocked JavaScript state in memory that resets on page refresh. All users, complaints, status updates, notifications, and audit trails reside in the persistent SQLite database file `data/scam_reporting.sqlite`.

#### 2.3 Decoupled Single-Process Integration
- For simple deployment and local execution, Express serves both the backend API and the compiled Vite frontend assets in production, while running seamlessly with Vite middleware during local development.
