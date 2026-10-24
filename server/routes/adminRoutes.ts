import { Router, Response } from 'express';
import { queryAll, queryOne, runSql } from '../db.ts';
import { requireAdmin, AuthenticatedRequest } from '../auth.ts';

const router = Router();

// Apply requireAdmin to all routes in this file
router.use(requireAdmin);

// GET /api/admin/reports - List all reports with search, filter, pagination
router.get('/reports', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { status, category, priority, search, page = '1', limit = '10', sort = 'created_at', order = 'DESC' } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(String(limit), 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (status && status !== 'all') {
      whereClauses.push('r.status = ?');
      params.push(status);
    }

    if (category && category !== 'all') {
      whereClauses.push('r.category = ?');
      params.push(category);
    }

    if (priority && priority !== 'all') {
      whereClauses.push('r.priority = ?');
      params.push(priority);
    }

    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;
      whereClauses.push(`(
        r.report_reference LIKE ? OR
        r.title LIKE ? OR
        r.description LIKE ? OR
        r.suspected_scammer LIKE ? OR
        u.full_name LIKE ? OR
        u.email LIKE ?
      )`);
      params.push(term, term, term, term, term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count total matching
    const countSql = `
      SELECT COUNT(*) as total
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      ${whereSql}
    `;
    const countResult = queryOne<{ total: number }>(countSql, params);
    const totalCount = countResult?.total || 0;

    // Validate sort column to avoid SQL injection
    const allowedSort = ['created_at', 'updated_at', 'financial_loss', 'priority', 'status', 'title'];
    const safeSort = allowedSort.includes(String(sort)) ? String(sort) : 'created_at';
    const safeOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const dataSql = `
      SELECT r.id, r.report_reference, r.user_id, r.title, r.category,
             r.incident_date, r.financial_loss, r.payment_method, r.suspected_scammer,
             r.platform, r.status, r.priority, r.created_at, r.updated_at,
             u.full_name as reporter_name, u.email as reporter_email, u.phone as reporter_phone,
             (SELECT COUNT(*) FROM evidence WHERE report_id = r.id) as evidence_count
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      ${whereSql}
      ORDER BY r.${safeSort} ${safeOrder}
      LIMIT ? OFFSET ?
    `;

    const dataParams = [...params, limitNum, offset];
    const reports = queryAll(dataSql, dataParams);

    res.json({
      reports,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (err) {
    console.error('Admin reports fetch error:', err);
    res.status(500).json({ error: 'Server error retrieving reports for administrator.' });
  }
});

// GET /api/admin/reports/:id - Full report details for admin including internal notes and audit history
router.get('/reports/:id', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const reportId = parseInt(req.params.id, 10);
    if (isNaN(reportId)) {
      res.status(400).json({ error: 'Invalid report ID.' });
      return;
    }

    const report = queryOne(
      `SELECT r.*, u.full_name as reporter_name, u.email as reporter_email, u.phone as reporter_phone
       FROM reports r
       LEFT JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [reportId]
    );

    if (!report) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }

    const evidence = queryAll(
      `SELECT id, stored_filename, original_filename, file_type, file_size, upload_timestamp
       FROM evidence
       WHERE report_id = ?
       ORDER BY upload_timestamp ASC`,
      [reportId]
    );

    // Includes BOTH user-visible messages AND internal admin notes
    const updates = queryAll(
      `SELECT id, previous_status, new_status, user_message, internal_note,
              updated_by_user_id, updated_by_name, timestamp
       FROM report_updates
       WHERE report_id = ?
       ORDER BY timestamp ASC`,
      [reportId]
    );

    const auditLogs = queryAll(
      `SELECT id, admin_name, action, details, timestamp
       FROM audit_logs
       WHERE report_id = ?
       ORDER BY timestamp DESC`,
      [reportId]
    );

    res.json({
      report,
      evidence,
      updates,
      auditLogs,
    });
  } catch (err) {
    console.error('Admin report detail error:', err);
    res.status(500).json({ error: 'Server error retrieving report details.' });
  }
});

// PATCH /api/admin/reports/:id/status - Update report status, add notes, and notify user
router.patch('/reports/:id/status', (req: AuthenticatedRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const reportId = parseInt(req.params.id, 10);
    const { status, user_message, internal_note, priority } = req.body;

    const validStatuses = [
      'Submitted',
      'Under Review',
      'Additional Information Required',
      'Escalated',
      'Resolved',
      'Closed',
    ];

    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
      return;
    }

    const report = queryOne<{ id: number; user_id: number; report_reference: string; status: string; priority: string }>(
      'SELECT id, user_id, report_reference, status, priority FROM reports WHERE id = ?',
      [reportId]
    );

    if (!report) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }

    const now = new Date().toISOString();
    const previousStatus = report.status;
    const newPriority = priority || report.priority;

    // Update report
    runSql(
      'UPDATE reports SET status = ?, priority = ?, updated_at = ? WHERE id = ?',
      [status, newPriority, now, reportId]
    );

    const defaultMsg = `Status updated to ${status}.`;
    const cleanUserMsg = user_message && typeof user_message === 'string' && user_message.trim().length > 0
      ? user_message.trim()
      : defaultMsg;

    const cleanInternalNote = internal_note && typeof internal_note === 'string' && internal_note.trim().length > 0
      ? internal_note.trim()
      : null;

    // Record timeline update
    runSql(
      `INSERT INTO report_updates (
        report_id, previous_status, new_status, user_message,
        internal_note, updated_by_user_id, updated_by_name, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        reportId,
        previousStatus,
        status,
        cleanUserMsg,
        cleanInternalNote,
        req.user.id,
        req.user.full_name,
        now,
      ]
    );

    // Notify the user who reported this
    runSql(
      `INSERT INTO notifications (
        user_id, report_id, report_reference, title, message, is_read, created_at
      ) VALUES (?, ?, ?, ?, ?, 0, ?);`,
      [
        report.user_id,
        reportId,
        report.report_reference,
        `Status Changed: ${status}`,
        `Your scam report (${report.report_reference}) was updated by administration to "${status}": ${cleanUserMsg}`,
        now,
      ]
    );

    // Record in Audit Trail
    runSql(
      `INSERT INTO audit_logs (
        admin_id, admin_name, action, details, report_id, timestamp
      ) VALUES (?, ?, 'STATUS_UPDATE', ?, ?, ?);`,
      [
        req.user.id,
        req.user.full_name,
        `Changed status from "${previousStatus}" to "${status}". Priority: ${newPriority}. Note: ${cleanInternalNote || 'None'}`,
        reportId,
        now,
      ]
    );

    res.json({
      message: 'Report status updated and user notified successfully.',
      status,
      priority: newPriority,
      updated_at: now,
    });
  } catch (err) {
    console.error('Admin status update error:', err);
    res.status(500).json({ error: 'Server error updating status.' });
  }
});

// PATCH /api/admin/reports/:id/priority - Update report priority
router.patch('/reports/:id/priority', (req: AuthenticatedRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const reportId = parseInt(req.params.id, 10);
    const { priority } = req.body;

    const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
    if (!priority || !validPriorities.includes(priority)) {
      res.status(400).json({ error: `Invalid priority. Allowed: ${validPriorities.join(', ')}` });
      return;
    }

    const report = queryOne<{ id: number; report_reference: string; priority: string }>(
      'SELECT id, report_reference, priority FROM reports WHERE id = ?',
      [reportId]
    );

    if (!report) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }

    const now = new Date().toISOString();
    runSql('UPDATE reports SET priority = ?, updated_at = ? WHERE id = ?', [priority, now, reportId]);

    // Audit log
    runSql(
      `INSERT INTO audit_logs (admin_id, admin_name, action, details, report_id, timestamp)
       VALUES (?, ?, 'PRIORITY_UPDATE', ?, ?, ?);`,
      [
        req.user.id,
        req.user.full_name,
        `Updated priority of ${report.report_reference} from "${report.priority}" to "${priority}".`,
        reportId,
        now,
      ]
    );

    res.json({
      message: 'Priority updated successfully.',
      priority,
      updated_at: now,
    });
  } catch (err) {
    console.error('Admin priority update error:', err);
    res.status(500).json({ error: 'Server error updating priority.' });
  }
});

// GET /api/admin/stats - Real database-backed statistics for dashboards and charts
router.get('/stats', (_req: AuthenticatedRequest, res: Response): void => {
  try {
    // 1. KPI Totals
    const summary = queryOne<{
      total_reports: number;
      submitted_new: number;
      under_review: number;
      high_critical: number;
      resolved: number;
      total_loss: number;
      registered_users: number;
    }>(`
      SELECT
        COUNT(*) as total_reports,
        SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) as submitted_new,
        SUM(CASE WHEN status IN ('Under Review', 'Additional Information Required', 'Escalated') THEN 1 ELSE 0 END) as under_review,
        SUM(CASE WHEN priority IN ('High', 'Critical') THEN 1 ELSE 0 END) as high_critical,
        SUM(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as resolved,
        SUM(financial_loss) as total_loss,
        (SELECT COUNT(*) FROM users WHERE role = 'user') as registered_users
      FROM reports
    `);

    // 2. Breakdown by Category (for Bar/Pie charts)
    const categoryStats = queryAll<{
      category: string;
      count: number;
      total_loss: number;
    }>(`
      SELECT category, COUNT(*) as count, SUM(financial_loss) as total_loss
      FROM reports
      GROUP BY category
      ORDER BY count DESC
    `);

    // 3. Breakdown by Status (for donut/pie charts)
    const statusStats = queryAll<{
      status: string;
      count: number;
    }>(`
      SELECT status, COUNT(*) as count
      FROM reports
      GROUP BY status
      ORDER BY count DESC
    `);

    // 4. Breakdown by Priority
    const priorityStats = queryAll<{
      priority: string;
      count: number;
    }>(`
      SELECT priority, COUNT(*) as count
      FROM reports
      GROUP BY priority
      ORDER BY
        CASE priority
          WHEN 'Critical' THEN 1
          WHEN 'High' THEN 2
          WHEN 'Medium' THEN 3
          WHEN 'Low' THEN 4
          ELSE 5
        END
    `);

    // 5. Recent timeline trend (last 7 or 14 days)
    const timelineStats = queryAll<{
      report_date: string;
      count: number;
      total_loss: number;
    }>(`
      SELECT SUBSTR(created_at, 1, 10) as report_date,
             COUNT(*) as count,
             SUM(financial_loss) as total_loss
      FROM reports
      GROUP BY SUBSTR(created_at, 1, 10)
      ORDER BY report_date ASC
      LIMIT 14
    `);

    res.json({
      summary: {
        totalReports: summary?.total_reports || 0,
        newlySubmitted: summary?.submitted_new || 0,
        underReview: summary?.under_review || 0,
        highPriority: summary?.high_critical || 0,
        resolved: summary?.resolved || 0,
        totalLoss: summary?.total_loss || 0,
        registeredUsers: summary?.registered_users || 0,
      },
      categoryStats,
      statusStats,
      priorityStats,
      timelineStats,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Server error retrieving statistics.' });
  }
});

// GET /api/admin/audit-logs - Audit trail
router.get('/audit-logs', (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { action, search, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (action && action !== 'all') {
      whereClauses.push('a.action = ?');
      params.push(action);
    }

    if (search && String(search).trim()) {
      const term = `%${String(search).trim()}%`;
      whereClauses.push('(a.details LIKE ? OR a.admin_name LIKE ?)');
      params.push(term, term);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = queryOne<{ total: number }>(
      `SELECT COUNT(*) as total FROM audit_logs a ${whereSql}`,
      params
    );
    const totalCount = countRes?.total || 0;

    const logs = queryAll(
      `SELECT a.id, a.admin_id, a.admin_name, a.action, a.details, a.report_id, a.timestamp,
              r.report_reference, r.title as report_title
       FROM audit_logs a
       LEFT JOIN reports r ON a.report_id = r.id
       ${whereSql}
       ORDER BY a.timestamp DESC
       LIMIT ? OFFSET ?`,
      [...params, limitNum, offset]
    );

    res.json({
      logs,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (err) {
    console.error('Audit logs error:', err);
    res.status(500).json({ error: 'Server error retrieving audit logs.' });
  }
});

export default router;
