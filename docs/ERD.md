# Entity Relationship Diagram (ERD)
## Online Scam Reporting System (CyberShield)

### 1. Conceptual & Logical ERD

```
    +--------------------------------+
    |             USERS              |
    +--------------------------------+
    | PK  id                         |
    |     full_name                  |
    |     email (UQ)                 |
    |     password_hash              |
    |     role ('user' | 'admin')    |
    |     phone                      |
    |     created_at                 |
    |     updated_at                 |
    +--------------------------------+
          |                    |
       1  |                 1  |
          |                    |
          v M                  v M
    +--------------------+  +--------------------+
    |      REPORTS       |  |   NOTIFICATIONS    |
    +--------------------+  +--------------------+
    | PK  id             |  | PK  id             |
    | UQ  report_ref     |  | FK  user_id        |
    | FK  user_id        |  |     report_id      |
    |     title          |  |     report_ref     |
    |     category       |  |     title          |
    |     description    |  |     message        |
    |     incident_date  |  |     is_read (0/1)  |
    |     financial_loss |  |     created_at     |
    |     payment_method |  +--------------------+
    |     suspected_scam |
    |     platform       |
    |     status         |
    |     priority       |
    |     accuracy_conf  |
    |     created_at     |
    |     updated_at     |
    +--------------------+
          |           |
       1  |        1  |
          |           |
          v M         v M
    +--------------+  +--------------------+
    |   EVIDENCE   |  |   REPORT_UPDATES   |
    +--------------+  +--------------------+
    | PK  id       |  | PK  id             |
    | FK  report_id|  | FK  report_id      |
    |   stored_file|  |     previous_status|
    |   orig_file  |  |     new_status     |
    |   file_type  |  |     user_message   |
    |   file_size  |  |     internal_note  |
    |   upload_time|  | FK  updated_by_uid |
    +--------------+  |     updated_by_name|
                      |     timestamp      |
                      +--------------------+

    +--------------------+
    |     AUDIT_LOGS     |
    +--------------------+
    | PK  id             |
    | FK  admin_id       |
    |     admin_name     |
    |     action         |
    |     details        |
    | FK  report_id      |
    |     timestamp      |
    +--------------------+
```

---

### 2. Physical Database Schema (SQLite)

#### Table: `users`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique user identifier |
| `full_name` | TEXT | NOT NULL | User's full legal name |
| `email` | TEXT | UNIQUE NOT NULL | Account login email |
| `password_hash` | TEXT | NOT NULL | Bcrypt salted hash (rounds: 10) |
| `role` | TEXT | NOT NULL DEFAULT 'user' | Authorization role: 'user' or 'admin' |
| `phone` | TEXT | NULLABLE | Contact telephone |
| `created_at` | TEXT | NOT NULL | ISO-8601 creation timestamp |
| `updated_at` | TEXT | NOT NULL | ISO-8601 update timestamp |

#### Table: `reports`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Primary key |
| `report_reference` | TEXT | UNIQUE NOT NULL | Alphanumeric tracking code (e.g. `SCAM-2026-8K401`) |
| `user_id` | INTEGER | NOT NULL, FK(`users.id`) | Foreign key to reporter |
| `title` | TEXT | NOT NULL | Brief summary |
| `category` | TEXT | NOT NULL | Approved scam taxonomy category |
| `description` | TEXT | NOT NULL | Chronological incident narrative |
| `incident_date` | TEXT | NOT NULL | Date incident took place |
| `financial_loss` | REAL | DEFAULT 0 | Approximate financial damage in USD |
| `payment_method` | TEXT | NULLABLE | Channel (UPI, Crypto, Card, Wire) |
| `suspected_scammer`| TEXT | NULLABLE | Phone, email, URL, social handle |
| `platform` | TEXT | NOT NULL | Medium where fraud initiated |
| `status` | TEXT | DEFAULT 'Submitted' | Pipeline status |
| `priority` | TEXT | DEFAULT 'Medium' | Triage priority (Low, Medium, High, Critical) |
| `accuracy_confirmed`| INTEGER| DEFAULT 1 | Citizen legal affirmation |
| `created_at` | TEXT | NOT NULL | Submission timestamp |
| `updated_at` | TEXT | NOT NULL | Modification timestamp |

#### Table: `evidence`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Primary key |
| `report_id` | INTEGER | NOT NULL, FK(`reports.id`) | Relational link to scam report |
| `stored_filename` | TEXT | NOT NULL | Safe server-side disk filename |
| `original_filename`| TEXT | NOT NULL | Original client filename |
| `file_type` | TEXT | NOT NULL | Verified MIME type |
| `file_size` | INTEGER | NOT NULL | Size in bytes |
| `upload_timestamp`| TEXT | NOT NULL | Upload ISO timestamp |

#### Table: `report_updates`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Primary key |
| `report_id` | INTEGER | NOT NULL, FK(`reports.id`) | Relational link to report |
| `previous_status` | TEXT | NULLABLE | Status before update |
| `new_status` | TEXT | NOT NULL | Status after update |
| `user_message` | TEXT | NOT NULL | Public victim-visible update |
| `internal_note` | TEXT | NULLABLE | Confidential investigator note |
| `updated_by_user_id` | INTEGER | NOT NULL | Admin or user ID who made change |
| `updated_by_name` | TEXT | NOT NULL | Display name of actor |
| `timestamp` | TEXT | NOT NULL | Modification timestamp |

#### Table: `notifications`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Primary key |
| `user_id` | INTEGER | NOT NULL, FK(`users.id`) | Citizen recipient |
| `report_id` | INTEGER | NOT NULL | Related report primary key |
| `report_reference` | TEXT | NOT NULL | Fast reference display |
| `title` | TEXT | NOT NULL | Notification header |
| `message` | TEXT | NOT NULL | Notification body |
| `is_read` | INTEGER | DEFAULT 0 | 0 = Unread, 1 = Read |
| `created_at` | TEXT | NOT NULL | Dispatch timestamp |

#### Table: `audit_logs`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Primary key |
| `admin_id` | INTEGER | NOT NULL | Administrator ID |
| `admin_name` | TEXT | NOT NULL | Administrator Name |
| `action` | TEXT | NOT NULL | Action category (STATUS_UPDATE, etc.) |
| `details` | TEXT | NOT NULL | Descriptive audit message |
| `report_id` | INTEGER | NULLABLE | Related case reference if applicable |
| `timestamp` | TEXT | NOT NULL | Event timestamp |
