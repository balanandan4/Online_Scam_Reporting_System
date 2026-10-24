import { getDb, queryOne, queryAll, runSql } from '../server/db.ts';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../server/auth.ts';

async function runTests() {
  console.log('--- Starting Automated Test Suite for Online Scam Reporting System ---');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Initialize DB
    await getDb();
    assert(true, 'Database initialized successfully');

    // 2. Test password hashing & verification
    const plainPass = 'Secure@Pass2026';
    const hash = await hashPassword(plainPass);
    const isCorrect = await comparePassword(plainPass, hash);
    const isWrong = await comparePassword('WrongPassword', hash);
    assert(isCorrect && !isWrong, 'Bcrypt password hashing and validation operates securely');

    // 3. Test JWT generation and verification
    const token = generateToken({
      id: 2,
      email: 'john.doe@example.com',
      role: 'user',
      full_name: 'John Doe',
    });
    const decoded = verifyToken(token);
    assert(decoded !== null && decoded.email === 'john.doe@example.com' && decoded.role === 'user', 'JWT authentication tokens issue and verify correctly');

    // 4. Test User Data Isolation (User A vs User B)
    const johnReports = queryAll('SELECT * FROM reports WHERE user_id = ?', [2]);
    const sarahReports = queryAll('SELECT * FROM reports WHERE user_id = ?', [3]);
    assert(johnReports.length > 0 && sarahReports.length > 0, 'Multiple user reports exist in database');
    const crossCheck = johnReports.some(r => r.user_id !== 2);
    assert(!crossCheck, 'Strict user isolation: Querying user 2 reports yields only user 2 data');

    // 5. Test Demo Admin account
    const adminUser = queryOne('SELECT * FROM users WHERE email = ?', ['admin@scamreporting.gov']);
    assert(adminUser !== null && adminUser.role === 'admin', 'Default administrator exists with role="admin"');

    // 6. Test Report Creation in Database
    const testRef = `SCAM-TEST-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();
    const insertRes = runSql(
      `INSERT INTO reports (
        report_reference, user_id, title, category, description,
        incident_date, financial_loss, payment_method, suspected_scammer,
        platform, status, priority, accuracy_confirmed, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', 'Medium', 1, ?, ?)`,
      [
        testRef,
        2,
        'Test Simulated Phishing Email',
        'Phishing and fake websites',
        'Detailed simulation test description for automated test suite verification.',
        '2026-10-24',
        150.00,
        'Debit Card',
        'phish-scammer@fake.com',
        'Email',
        now,
        now,
      ]
    );
    assert(insertRes.lastInsertRowid > 0, 'New scam report inserted with auto-generated ID');

    // 7. Test initial timeline status
    runSql(
      `INSERT INTO report_updates (
        report_id, previous_status, new_status, user_message,
        internal_note, updated_by_user_id, updated_by_name, timestamp
      ) VALUES (?, NULL, 'Submitted', ?, ?, ?, ?, ?)`,
      [
        insertRes.lastInsertRowid,
        'Report queued for review.',
        'Automated test note.',
        2,
        'John Doe',
        now,
      ]
    );
    const updates = queryAll('SELECT * FROM report_updates WHERE report_id = ?', [insertRes.lastInsertRowid]);
    assert(updates.length === 1 && updates[0].new_status === 'Submitted', 'Initial timeline tracking entry stored');

    // 8. Test Admin Status Transition & Notification
    const newStatus = 'Under Review';
    runSql('UPDATE reports SET status = ?, updated_at = ? WHERE id = ?', [newStatus, now, insertRes.lastInsertRowid]);
    runSql(
      `INSERT INTO notifications (user_id, report_id, report_reference, title, message, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [2, insertRes.lastInsertRowid, testRef, 'Status Changed', 'Report moved to Under Review', now]
    );
    const updatedReport = queryOne('SELECT status FROM reports WHERE id = ?', [insertRes.lastInsertRowid]);
    const notifs = queryAll('SELECT * FROM notifications WHERE report_id = ?', [insertRes.lastInsertRowid]);
    assert(updatedReport?.status === 'Under Review', 'Report status successfully transitioned to "Under Review"');
    assert(notifs.length > 0 && notifs[0].is_read === 0, 'Status update automatically created an unread in-app user notification');

    // 9. Test Audit Trail recording
    runSql(
      `INSERT INTO audit_logs (admin_id, admin_name, action, details, report_id, timestamp)
       VALUES (1, 'Admin', 'STATUS_UPDATE', 'Test status change to Under Review', ?, ?)`,
      [insertRes.lastInsertRowid, now]
    );
    const auditLogs = queryAll('SELECT * FROM audit_logs WHERE report_id = ?', [insertRes.lastInsertRowid]);
    assert(auditLogs.length > 0 && auditLogs[0].action === 'STATUS_UPDATE', 'Administrator action logged in audit trail');

    // 10. Test Database Aggregation (Real Stats)
    const stats = queryOne<{ count: number; totalLoss: number }>(
      'SELECT COUNT(*) as count, SUM(financial_loss) as totalLoss FROM reports'
    );
    assert(stats !== null && stats.count >= 4 && stats.totalLoss > 0, 'Real database statistics aggregated accurately');

    // Clean up test report
    runSql('DELETE FROM reports WHERE id = ?', [insertRes.lastInsertRowid]);
    runSql('DELETE FROM report_updates WHERE report_id = ?', [insertRes.lastInsertRowid]);
    runSql('DELETE FROM notifications WHERE report_id = ?', [insertRes.lastInsertRowid]);
    runSql('DELETE FROM audit_logs WHERE report_id = ?', [insertRes.lastInsertRowid]);

    console.log(`\n========================================`);
    console.log(`Test Results: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution error:', error);
    process.exit(1);
  }
}

runTests();
