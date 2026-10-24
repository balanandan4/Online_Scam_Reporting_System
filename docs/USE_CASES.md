# Use Case Specifications
## Online Scam Reporting System (CyberShield)

### 1. System Actors

| Actor | Description |
|---|---|
| **Public Visitor** | An unauthenticated citizen browsing scam education, tips, and tracking complaints by reference code. |
| **Citizen (Reporter)** | An authenticated victim filing complaints, uploading evidence, tracking cases, and providing additional information. |
| **Administrative Investigator** | An authenticated security officer triaging cases, assigning priorities, adding internal notes, and updating statuses. |
| **System Scheduler / Engine** | Background services managing notifications, token expiration, and database disk persistence. |

---

### 2. Use Case Diagram

```
+---------------------------------------------------------------------------------+
|                                CyberShield System                               |
|                                                                                 |
|   [ Public Visitor ]                                                            |
|          |                                                                      |
|          +----------> (UC-01: Browse Scam Categories & Awareness Tips)          |
|          |                                                                      |
|          +----------> (UC-02: Public Report Tracking by Reference ID)           |
|          |                                                                      |
|          +----------> (UC-03: Register Citizen Account)                         |
|                                                                                 |
|   [ Citizen (Reporter) ]                                                        |
|          |                                                                      |
|          +----------> (UC-04: Authenticate / Login)                             |
|          |                                                                      |
|          +----------> (UC-05: Submit Scam Incident Report with Evidence)        |
|          |                      |                                               |
|          |                      +--<<include>>--> (Validate File Types & Size)  |
|          |                      +--<<include>>--> (Generate Non-Seq Ref ID)     |
|          |                                                                      |
|          +----------> (UC-06: View Personal Dashboard & Case History)           |
|          |                                                                      |
|          +----------> (UC-07: Respond to Additional Information Request)        |
|          |                                                                      |
|          +----------> (UC-08: View In-App Notifications)                        |
|          |                                                                      |
|          +----------> (UC-09: Update Profile & Change Password)                 |
|                                                                                 |
|   [ Administrative Investigator ]                                               |
|          |                                                                      |
|          +----------> (UC-10: Authenticate to Protected Admin Console)         |
|          |                                                                      |
|          +----------> (UC-11: Filter & Search Master Case Queue)                |
|          |                                                                      |
|          +----------> (UC-12: Inspect Forensic Evidence Files)                  |
|          |                                                                      |
|          +----------> (UC-13: Update Case Status & Priority)                    |
|          |                      |                                               |
|          |                      +--<<include>>--> (Issue User-Visible Update)   |
|          |                      +--<<include>>--> (Append Internal Case Note)   |
|          |                      +--<<include>>--> (Record Audit Trail Log)      |
|          |                      +--<<include>>--> (Dispatch Notification)       |
|          |                                                                      |
|          +----------> (UC-14: Review Aggregated Analytics & Incident Trends)    |
|          |                                                                      |
|          +----------> (UC-15: Inspect Immutable Audit Log Trail)                |
+---------------------------------------------------------------------------------+
```

---

### 3. Detailed Use Case Specifications

#### UC-05: Submit Scam Incident Report with Evidence
- **Primary Actor:** Citizen (Reporter)
- **Preconditions:** Citizen is authenticated and has an active JWT session.
- **Trigger:** Citizen clicks "Report a Scam" or "Submit New Complaint".
- **Main Success Scenario:**
  1. Citizen opens the submission modal.
  2. Citizen enters title, selects one of 10 categories, specifies platform, incident date, approximate loss, payment method, and suspected scammer coordinates.
  3. Citizen enters detailed narrative (minimum 20 characters).
  4. Citizen selects digital evidence files (screenshots, receipts, PDFs).
  5. System validates file mime types (`image/*`, `application/pdf`) and enforces $\le 5\text{MB}$ limit per file.
  6. Citizen checks the mandatory accuracy confirmation checkbox.
  7. System computes a cryptographically random, non-sequential reference ID (`SCAM-2026-XXXXX`).
  8. System stores the report, evidence records, initial `Submitted` timeline status, and creates an in-app confirmation notification.
  9. System returns success modal displaying the reference ID with option to track or return to dashboard.
- **Alternate Flows:**
  - *4a. File exceeds 5MB or invalid format:* System displays validation banner; file is excluded.
  - *6a. Accuracy box unchecked:* System highlights field and halts submission.

#### UC-13: Update Case Status & Priority
- **Primary Actor:** Administrative Investigator
- **Preconditions:** User has role `admin` and valid JWT token.
- **Main Success Scenario:**
  1. Investigator selects a report from the Case Queue.
  2. Investigator inspects narrative, financial figures, suspect leads, and attached evidence.
  3. Investigator chooses a new status (e.g. `Under Review`, `Additional Information Required`, `Escalated`, `Resolved`, `Closed`).
  4. Investigator adjusts priority level (`Low`, `Medium`, `High`, `Critical`).
  5. Investigator writes a public user-visible explanation and a private internal investigator note.
  6. System saves the transition to `report_updates`, updates `reports.status`, inserts a new record in `notifications` for the victim, and logs an entry in `audit_logs`.
  7. System renders updated timeline with confirmation toast.
