import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

let db: SqlJsDatabase | null = null;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'scam_reporting.sqlite');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function saveDatabase(): void {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export async function getDb(): Promise<SqlJsDatabase> {
  if (db) return db;

  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Enable foreign keys
  db.run("PRAGMA foreign_keys = ON;");
  initSchema(db);
  await seedInitialData(db);
  saveDatabase();

  return db;
}

function initSchema(database: SqlJsDatabase): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      phone TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_reference TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      incident_date TEXT NOT NULL,
      financial_loss REAL DEFAULT 0,
      payment_method TEXT,
      suspected_scammer TEXT,
      platform TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Submitted',
      priority TEXT NOT NULL DEFAULT 'Medium',
      accuracy_confirmed INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS evidence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      stored_filename TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      upload_timestamp TEXT NOT NULL,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS report_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      previous_status TEXT,
      new_status TEXT NOT NULL,
      user_message TEXT,
      internal_note TEXT,
      updated_by_user_id INTEGER NOT NULL,
      updated_by_name TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      report_id INTEGER NOT NULL,
      report_reference TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL,
      admin_name TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      report_id INTEGER,
      timestamp TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
    CREATE INDEX IF NOT EXISTS idx_reports_ref ON reports(report_reference);
    CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
    CREATE INDEX IF NOT EXISTS idx_reports_category ON reports(category);
    CREATE INDEX IF NOT EXISTS idx_evidence_report ON evidence(report_id);
    CREATE INDEX IF NOT EXISTS idx_updates_report ON report_updates(report_id);
    CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs(timestamp);
  `);
}

// Database query helpers
export function queryAll<T = any>(sql: string, params: any[] = []): T[] {
  if (!db) throw new Error("Database not initialized");
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function runSql(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number } {
  if (!db) throw new Error("Database not initialized");
  db.run(sql, params);
  const changesRes = queryOne<{ changes: number }>("SELECT changes() as changes;");
  const rowidRes = queryOne<{ id: number }>("SELECT last_insert_rowid() as id;");
  saveDatabase();
  return {
    changes: changesRes?.changes || 0,
    lastInsertRowid: rowidRes?.id || 0,
  };
}

async function seedInitialData(database: SqlJsDatabase): Promise<void> {
  // Check if admin already exists
  const stmt = database.prepare("SELECT COUNT(*) as count FROM users;");
  stmt.step();
  const row = stmt.getAsObject() as { count: number };
  stmt.free();

  if (row.count > 0) return;

  const now = new Date().toISOString();
  const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);
  const userPasswordHash = await bcrypt.hash('User@12345', 10);

  // 1. Create initial Admin
  database.run(
    `INSERT INTO users (full_name, email, password_hash, role, phone, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    ['Cyber Oversight Admin', 'admin@scamreporting.gov', adminPasswordHash, 'admin', '+1-800-555-0199', now, now]
  );

  // 2. Create Demo User 1 (John Doe)
  database.run(
    `INSERT INTO users (full_name, email, password_hash, role, phone, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    ['John Doe', 'john.doe@example.com', userPasswordHash, 'user', '+1-555-234-5678', now, now]
  );

  // 3. Create Demo User 2 (Sarah Jenkins)
  database.run(
    `INSERT INTO users (full_name, email, password_hash, role, phone, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    ['Sarah Jenkins', 'sarah.jenkins@example.com', userPasswordHash, 'user', '+1-555-987-6543', now, now]
  );

  // Add realistic demo reports for John Doe (User ID 2)
  const report1Date = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
  const report2Date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const report3Date = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
  const report4Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Report 1: UPI and digital payment scams
  database.run(
    `INSERT INTO reports (
      report_reference, user_id, title, category, description, incident_date,
      financial_loss, payment_method, suspected_scammer, platform, status,
      priority, accuracy_confirmed, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      'SCAM-2026-8K401',
      2,
      'Fake QR Code Electricity Bill Scam',
      'UPI and digital payment scams',
      'Received an urgent SMS claiming my domestic electricity service would be disconnected by 9:30 PM due to pending dues. When I dialed the provided contact, the operator guided me to scan a remote assistance QR code which debited $450 from my linked account without an invoice.',
      '2026-10-19',
      450.00,
      'UPI / Instant Bank Transfer',
      '+1-800-555-9821 / power-billing-alert.org',
      'SMS / Phone Call',
      'Under Review',
      'High',
      1,
      report1Date,
      report1Date
    ]
  );

  // Initial timeline for Report 1
  database.run(
    `INSERT INTO report_updates (report_id, previous_status, new_status, user_message, internal_note, updated_by_user_id, updated_by_name, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      1,
      null,
      'Submitted',
      'Your report has been successfully recorded and assigned to the triage queue.',
      'Initial system ingestion completed.',
      2,
      'John Doe',
      report1Date
    ]
  );

  database.run(
    `INSERT INTO report_updates (report_id, previous_status, new_status, user_message, internal_note, updated_by_user_id, updated_by_name, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      1,
      'Submitted',
      'Under Review',
      'Case officer has begun examining transaction hashes and contacting beneficiary intermediary bank.',
      'Correlated beneficiary account ID with ongoing mule cluster #409.',
      1,
      'Cyber Oversight Admin',
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    ]
  );

  // Notification for Report 1
  database.run(
    `INSERT INTO notifications (user_id, report_id, report_reference, title, message, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      2,
      1,
      'SCAM-2026-8K401',
      'Report Status Updated',
      'Your report SCAM-2026-8K401 has been moved to "Under Review". An investigator is reviewing the provided bank details.',
      0,
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    ]
  );

  // Report 2: Investment and cryptocurrency scams
  database.run(
    `INSERT INTO reports (
      report_reference, user_id, title, category, description, incident_date,
      financial_loss, payment_method, suspected_scammer, platform, status,
      priority, accuracy_confirmed, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      'SCAM-2026-9M102',
      2,
      'Algorithmic Arbitrage Crypto Trading Syndicate',
      'Investment and cryptocurrency scams',
      'Recruited through an investment group promising guaranteed 18% weekly returns using AI arbitrage bots. Deposited $2,200 USDT. Dashboard displayed simulated gains, but all withdrawal attempts were locked demanding a 30% "liquidity unlocking fee".',
      '2026-10-21',
      2200.00,
      'Cryptocurrency (USDT TRC-20)',
      '@ElenaTraderVIP / apex-defi-yields.live',
      'Telegram / Web App',
      'Additional Information Required',
      'Critical',
      1,
      report2Date,
      report2Date
    ]
  );

  database.run(
    `INSERT INTO report_updates (report_id, previous_status, new_status, user_message, internal_note, updated_by_user_id, updated_by_name, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      2,
      null,
      'Submitted',
      'Report received and catalogued.',
      'High loss amount noted.',
      2,
      'John Doe',
      report2Date
    ]
  );

  database.run(
    `INSERT INTO report_updates (report_id, previous_status, new_status, user_message, internal_note, updated_by_user_id, updated_by_name, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      2,
      'Submitted',
      'Additional Information Required',
      'Please submit the destination TRON wallet address and screenshot of the deposit transaction hash from your exchange account so our blockchain tracking unit can map the receiver address.',
      'Awaiting TXID from reporter to trace hop addresses on TronScan.',
      1,
      'Cyber Oversight Admin',
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    ]
  );

  database.run(
    `INSERT INTO notifications (user_id, report_id, report_reference, title, message, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      2,
      2,
      'SCAM-2026-9M102',
      'Additional Information Requested',
      'Investigator requested transaction hashes for report SCAM-2026-9M102.',
      0,
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    ]
  );

  // Report 3: Phishing and fake websites (Sarah Jenkins - User ID 3)
  database.run(
    `INSERT INTO reports (
      report_reference, user_id, title, category, description, incident_date,
      financial_loss, payment_method, suspected_scammer, platform, status,
      priority, accuracy_confirmed, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      'SCAM-2026-3P804',
      3,
      'Cloned National Bank NetBanking Portal',
      'Phishing and fake websites',
      'Clicked a sponsored search engine ad leading to secure-loginn-nationalbank.com mimicking my real banking portal. Entered credentials before realizing the URL domain was misspelled. Immediately froze my account through telephone hotline.',
      '2026-10-23',
      0.00,
      'None (Attempted credential theft)',
      'secure-loginn-nationalbank.com / IP 194.26.29.11',
      'Search Engine Sponsored Ad',
      'Escalated',
      'High',
      1,
      report3Date,
      report3Date
    ]
  );

  database.run(
    `INSERT INTO report_updates (report_id, previous_status, new_status, user_message, internal_note, updated_by_user_id, updated_by_name, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      3,
      null,
      'Submitted',
      'Report logged.',
      'Zero financial loss, active credential harvest campaign.',
      3,
      'Sarah Jenkins',
      report3Date
    ]
  );

  database.run(
    `INSERT INTO report_updates (report_id, previous_status, new_status, user_message, internal_note, updated_by_user_id, updated_by_name, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      3,
      'Submitted',
      'Escalated',
      'Domain abuse takedown notice forwarded to registrar and national CERT coordinating center.',
      'Issued WHOIS registrar abuse ticket and Cloudflare proxy report.',
      1,
      'Cyber Oversight Admin',
      report3Date
    ]
  );

  // Report 4: Online shopping fraud (John Doe - Resolved)
  database.run(
    `INSERT INTO reports (
      report_reference, user_id, title, category, description, incident_date,
      financial_loss, payment_method, suspected_scammer, platform, status,
      priority, accuracy_confirmed, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      'SCAM-2026-1V550',
      2,
      'Fake Discount Luxury Drone Store',
      'Online shopping fraud',
      'Ordered professional 4K drone advertised at 70% off on Instagram ad. Payment processed via bogus checkout gateway. Received tracking number from non-existent courier service. Vendor email bounced back.',
      '2026-10-16',
      289.00,
      'Credit Card Charge',
      'support@skyvue-clearance.store / @SkyVueDeals',
      'Instagram / Shopify Clone',
      'Resolved',
      'Medium',
      1,
      report4Date,
      report4Date
    ]
  );

  database.run(
    `INSERT INTO report_updates (report_id, previous_status, new_status, user_message, internal_note, updated_by_user_id, updated_by_name, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      4,
      'Submitted',
      'Resolved',
      'Evidence packet compiled and dispute reference issued for your card issuer chargeback. Merchant gateway flagged as malicious and merchant account terminated.',
      'Chargeback letter generated. Gateway payment MID frozen by merchant acquirer.',
      1,
      'Cyber Oversight Admin',
      new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    ]
  );

  // Audit logs for Admin actions
  database.run(
    `INSERT INTO audit_logs (admin_id, admin_name, action, details, report_id, timestamp)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [
      1,
      'Cyber Oversight Admin',
      'STATUS_CHANGE',
      'Changed status of SCAM-2026-8K401 from "Submitted" to "Under Review". Priority set to High.',
      1,
      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    ]
  );

  database.run(
    `INSERT INTO audit_logs (admin_id, admin_name, action, details, report_id, timestamp)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [
      1,
      'Cyber Oversight Admin',
      'STATUS_CHANGE',
      'Requested additional information on SCAM-2026-9M102: destination wallet addresses.',
      2,
      new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    ]
  );

  database.run(
    `INSERT INTO audit_logs (admin_id, admin_name, action, details, report_id, timestamp)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [
      1,
      'Cyber Oversight Admin',
      'STATUS_CHANGE',
      'Escalated SCAM-2026-3P804 to CERT for phishing domain registrar takedown.',
      3,
      report3Date
    ]
  );

  database.run(
    `INSERT INTO audit_logs (admin_id, admin_name, action, details, report_id, timestamp)
     VALUES (?, ?, ?, ?, ?, ?);`,
    [
      1,
      'Cyber Oversight Admin',
      'CASE_RESOLVED',
      'Marked SCAM-2026-1V550 as Resolved with chargeback dispute documentation provided to victim.',
      4,
      new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    ]
  );
}
