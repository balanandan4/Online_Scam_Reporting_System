# Data Flow Diagrams (DFD)
## Online Scam Reporting System (CyberShield)

### 1. Context-Level DFD (Level 0)

The Level 0 context diagram displays the boundaries of the CyberShield system, the external entities (Citizens and Administrators), and the high-level data inputs and outputs.

```
                  +----------------------------------------------+
                  |                                              |
                  |                   CITIZEN                    |
                  |                                              |
                  +----------------------------------------------+
                     |         ^               |            ^
  1. Registration/   |         | 2. Auth Token | 3. Scam    | 4. Status Timeline,
     Credentials     |         |    & Profile  |    Report  |    Notifications &
                     v         |               |    & Evid. |    Ref Tracking
                  +----------------------------------------------+
                  |                                              |
                  |                     0.0                      |
                  |         ONLINE SCAM REPORTING SYSTEM         |
                  |                 (CYBERSHIELD)                |
                  |                                              |
                  +----------------------------------------------+
                     |         ^               ^            |
  5. Admin Login     |         | 6. Auth Token | 7. Case    | 8. Case Queue,
     Credentials     |         |    & Sessions |    Updates |    Evidence Files,
                     v         |               |    & Notes |    Stats & Logs
                  +----------------------------------------------+
                  |                                              |
                  |                ADMINISTRATOR                 |
                  |                                              |
                  +----------------------------------------------+
```

---

### 2. Level 1 DFD (Decomposition)

The Level 1 diagram breaks down the system into core functional processes, data stores, and intermediate flows.

```
+--------------------------------------------------------------------------------------------------+
|                                        CYBERSHIELD LEVEL 1 DFD                                   |
+--------------------------------------------------------------------------------------------------+

  [ Citizen ]                                                          [ Administrator ]
      |                                                                       |
      | Credentials                                                           | Admin Credentials
      v                                                                       v
+--------------+                                                       +--------------+
|     1.0      | -------- Read / Write User Records ------------->>>>  | [D1: Users]  |
| User Auth    | <<<<<<-- Verify Password Hash & Role --------------   +--------------+
+--------------+                                                              ^
      |                                                                       |
      | Authenticated User Context                                            |
      v                                                                       |
+--------------+               Insert Report Record                    +--------------+
|     2.0      | ----------------------------------------------------->| [D2: Reports]|
| Report       |                                                       +--------------+
| Ingestion    | ---- Safe Filename & Mime Type ----> +--------------+        ^
+--------------+                                      | [D3: Evidence|        |
      |                                               +--------------+        |
      |                                                       ^               | Read
      | Create Initial Update                                 | Secure Read   | Reports
      v                                                       | Files         |
+--------------+                                       +--------------+       |
|     3.0      | -----> Save Update Record ----------> |[D4: Updates] |       |
| Case Triage  |                                       +--------------+       |
| & Management | <============================================================+
+--------------+
      |
      +---- Trigger Status Change Notif ----> +-------------------+
      |                                       | [D5: Notifications| ===> Push to [ Citizen ]
      |                                       +-------------------+
      |
      +---- Log Administrative Action ------> +-------------------+
                                              | [D6: Audit Logs]  | ===> View by [ Administrator ]
                                              +-------------------+

+--------------+
|     4.0      |
| Analytics &  | <===== Aggregates (COUNT, SUM, GROUP BY) ===== [D2: Reports]
| Dashboard    | =====> Render Charts & Metrics ==============> [ Administrator ]
+--------------+
```

---

### 3. Data Store Descriptions

| Store | Name | Physical Representation | Description |
|---|---|---|---|
| **D1** | Users Store | `users` table | Citizen and administrator profiles, credentials, password hashes. |
| **D2** | Reports Store | `reports` table | Incident titles, categories, loss values, suspect data, status, priority. |
| **D3** | Evidence Store | `evidence` table + `/uploads` disk | Binary attachments (JPEG, PNG, WEBP, PDF) and metadata records. |
| **D4** | Updates Store | `report_updates` table | Audit of previous status, new status, public notes, internal notes. |
| **D5** | Notifications Store | `notifications` table | In-app notification queue for victim alerts. |
| **D6** | Audit Logs Store | `audit_logs` table | Permanent tamper-evident log of administrative modifications. |
