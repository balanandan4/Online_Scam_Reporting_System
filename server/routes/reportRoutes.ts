import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { queryAll, queryOne, runSql } from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../auth.ts';

const router = Router();
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage setup with strict validation
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.gif'].includes(ext) ? ext : '.bin';
    const randomName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${safeExt}`;
    cb(null, randomName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMime = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
    ];
    if (allowedMime.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, GIF, and PDF files are allowed.'));
    }
  },
});

export const VALID_CATEGORIES = [
  'Phishing and fake websites',
  'UPI and digital payment scams',
  'Online shopping fraud',
  'Job and employment scams',
  'Investment and cryptocurrency scams',
  'Social media impersonation',
  'OTP and account takeover scams',
  'Fake customer support scams',
  'Loan and financial scams',
  'Other online scams',
];

function generateReportReference(): string {
  const year = new Date().getFullYear();
  const randomChars = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
  return `SCAM-${year}-${randomChars}`;
}

// POST /api/reports - Submit a new scam report
router.post(
  '/',
  requireAuth,
  upload.array('evidence', 5),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const {
        title,
        category,
        description,
        incident_date,
        financial_loss,
        payment_method,
        suspected_scammer,
        platform,
        accuracy_confirmed,
        additional_info,
      } = req.body;

      // Validation
      if (!title || typeof title !== 'string' || title.trim().length < 5) {
        res.status(400).json({ error: 'Title must be at least 5 characters long.' });
        return;
      }

      if (!category || !VALID_CATEGORIES.includes(category)) {
        res.status(400).json({
          error: `Invalid category. Please select from the approved scam categories.`,
        });
        return;
      }

      if (!description || typeof description !== 'string' || description.trim().length < 20) {
        res.status(400).json({ error: 'Detailed description must be at least 20 characters.' });
        return;
      }

      if (!incident_date) {
        res.status(400).json({ error: 'Incident date is required.' });
        return;
      }

      const incDate = new Date(incident_date);
      if (isNaN(incDate.getTime()) || incDate > new Date()) {
        res.status(400).json({ error: 'Please enter a valid incident date not in the future.' });
        return;
      }

      if (!platform || typeof platform !== 'string' || platform.trim().length < 2) {
        res.status(400).json({ error: 'Platform / medium where scam occurred is required.' });
        return;
      }

      const isAccuracyConfirmed =
        accuracy_confirmed === true || accuracy_confirmed === 'true' || accuracy_confirmed === '1';
      if (!isAccuracyConfirmed) {
        res.status(400).json({ error: 'You must confirm that the provided information is accurate to the best of your knowledge.' });
        return;
      }

      const lossNum = parseFloat(financial_loss) || 0;
      if (lossNum < 0) {
        res.status(400).json({ error: 'Financial loss cannot be negative.' });
        return;
      }

      // Generate unique reference ID
      let reference = generateReportReference();
      let attempt = 0;
      while (queryOne('SELECT id FROM reports WHERE report_reference = ?', [reference]) && attempt < 10) {
        reference = generateReportReference();
        attempt++;
      }

      const now = new Date().toISOString();
      const priority = lossNum >= 2000 ? 'High' : lossNum > 500 ? 'Medium' : 'Low';

      let fullDescription = description.trim();
      if (additional_info && typeof additional_info === 'string' && additional_info.trim().length > 0) {
        fullDescription += `\n\n[Additional Information Provided at Submission]:\n${additional_info.trim()}`;
      }

      // Insert Report
      const insertResult = runSql(
        `INSERT INTO reports (
          report_reference, user_id, title, category, description,
          incident_date, financial_loss, payment_method, suspected_scammer,
          platform, status, priority, accuracy_confirmed, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, 1, ?, ?);`,
        [
          reference,
          req.user.id,
          title.trim(),
          category,
          fullDescription,
          incident_date,
          lossNum,
          payment_method ? payment_method.trim() : null,
          suspected_scammer ? suspected_scammer.trim() : null,
          platform.trim(),
          priority,
          now,
          now,
        ]
      );

      const reportId = insertResult.lastInsertRowid;

      // Insert Initial Timeline Status
      runSql(
        `INSERT INTO report_updates (
          report_id, previous_status, new_status, user_message,
          internal_note, updated_by_user_id, updated_by_name, timestamp
        ) VALUES (?, NULL, 'Submitted', ?, ?, ?, ?, ?);`,
        [
          reportId,
          'Your report has been received and queued for investigation triage.',
          'Automated ingestion from user submission portal.',
          req.user.id,
          req.user.full_name,
          now,
        ]
      );

      // Handle Evidence Uploads
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        for (const file of files) {
          runSql(
            `INSERT INTO evidence (
              report_id, stored_filename, original_filename,
              file_type, file_size, upload_timestamp
            ) VALUES (?, ?, ?, ?, ?, ?);`,
            [
              reportId,
              file.filename,
              file.originalname,
              file.mimetype,
              file.size,
              now,
            ]
          );
        }
      }

      // Notification for user
      runSql(
        `INSERT INTO notifications (
          user_id, report_id, report_reference, title, message, is_read, created_at
        ) VALUES (?, ?, ?, ?, ?, 0, ?);`,
        [
          req.user.id,
          reportId,
          reference,
          'Report Submitted Successfully',
          `Your report "${title.trim()}" has been recorded with reference ID: ${reference}. You can track progress anytime from your dashboard.`,
          now,
        ]
      );

      res.status(201).json({
        message: 'Scam complaint registered successfully.',
        report: {
          id: reportId,
          report_reference: reference,
          title: title.trim(),
          category,
          status: 'Submitted',
          created_at: now,
          evidence_count: files ? files.length : 0,
        },
      });
    } catch (err: any) {
      console.error('Report submission error:', err);
      res.status(500).json({ error: err.message || 'Server error submitting report.' });
    }
  }
);

// GET /api/reports/my - List current user's submitted reports and stats
router.get('/my', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { status, category, search } = req.query;

    let query = `
      SELECT r.id, r.report_reference, r.title, r.category, r.incident_date,
             r.financial_loss, r.payment_method, r.platform, r.status,
             r.priority, r.created_at, r.updated_at,
             (SELECT COUNT(*) FROM evidence WHERE report_id = r.id) as evidence_count
      FROM reports r
      WHERE r.user_id = ?
    `;
    const params: any[] = [req.user.id];

    if (status && typeof status === 'string' && status !== 'all') {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    if (category && typeof category === 'string' && category !== 'all') {
      query += ` AND r.category = ?`;
      params.push(category);
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ` AND (r.report_reference LIKE ? OR r.title LIKE ? OR r.description LIKE ?)`;
      params.push(term, term, term);
    }

    query += ` ORDER BY r.created_at DESC`;

    const reports = queryAll(query, params);

    // Compute user dashboard statistics
    const stats = queryOne<{
      total: number;
      under_review: number;
      requires_info: number;
      resolved_closed: number;
      total_loss: number;
    }>(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('Submitted', 'Under Review', 'Escalated') THEN 1 ELSE 0 END) as under_review,
        SUM(CASE WHEN status = 'Additional Information Required' THEN 1 ELSE 0 END) as requires_info,
        SUM(CASE WHEN status IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as resolved_closed,
        SUM(financial_loss) as total_loss
       FROM reports
       WHERE user_id = ?`,
      [req.user.id]
    );

    res.json({
      reports,
      stats: {
        total: stats?.total || 0,
        underReview: stats?.under_review || 0,
        requiresInfo: stats?.requires_info || 0,
        resolvedOrClosed: stats?.resolved_closed || 0,
        totalLoss: stats?.total_loss || 0,
      },
    });
  } catch (err) {
    console.error('Fetch user reports error:', err);
    res.status(500).json({ error: 'Server error retrieving reports.' });
  }
});

// GET /api/reports/my/:id - Detailed report view for owner
router.get('/my/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const reportId = parseInt(req.params.id, 10);
    if (isNaN(reportId)) {
      res.status(400).json({ error: 'Invalid report ID.' });
      return;
    }

    const report = queryOne(
      `SELECT id, report_reference, user_id, title, category, description,
              incident_date, financial_loss, payment_method, suspected_scammer,
              platform, status, priority, created_at, updated_at
       FROM reports
       WHERE id = ? AND user_id = ?`,
      [reportId, req.user.id]
    );

    if (!report) {
      res.status(404).json({ error: 'Report not found or access denied.' });
      return;
    }

    // Evidence
    const evidence = queryAll(
      `SELECT id, stored_filename, original_filename, file_type, file_size, upload_timestamp
       FROM evidence
       WHERE report_id = ?
       ORDER BY upload_timestamp ASC`,
      [reportId]
    );

    // Updates timeline (USER-VISIBLE only, internal notes excluded for privacy/security)
    const updates = queryAll(
      `SELECT id, previous_status, new_status, user_message, updated_by_name, timestamp
       FROM report_updates
       WHERE report_id = ?
       ORDER BY timestamp ASC`,
      [reportId]
    );

    res.json({
      report,
      evidence,
      updates,
    });
  } catch (err) {
    console.error('Fetch report detail error:', err);
    res.status(500).json({ error: 'Server error retrieving report details.' });
  }
});

// GET /api/reports/track/:reference - Track report by reference ID (public/authenticated tracking)
router.get('/track/:reference', (req, res): void => {
  try {
    const reference = req.params.reference.trim();
    if (!reference) {
      res.status(400).json({ error: 'Please enter a valid report reference ID.' });
      return;
    }

    const report = queryOne<{
      id: number;
      report_reference: string;
      title: string;
      category: string;
      incident_date: string;
      status: string;
      priority: string;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, report_reference, title, category, incident_date, status, priority, created_at, updated_at
       FROM reports
       WHERE UPPER(report_reference) = UPPER(?)`,
      [reference]
    );

    if (!report) {
      res.status(404).json({ error: `No report found matching reference code "${reference}". Please check the ID and try again.` });
      return;
    }

    const updates = queryAll(
      `SELECT previous_status, new_status, user_message, timestamp
       FROM report_updates
       WHERE report_id = ?
       ORDER BY timestamp ASC`,
      [report.id]
    );

    res.json({
      report: {
        report_reference: report.report_reference,
        title: report.title,
        category: report.category,
        incident_date: report.incident_date,
        status: report.status,
        priority: report.priority,
        created_at: report.created_at,
        updated_at: report.updated_at,
      },
      updates,
    });
  } catch (err) {
    console.error('Track report error:', err);
    res.status(500).json({ error: 'Server error looking up report reference.' });
  }
});

// POST /api/reports/:id/provide-info - User replies with additional requested details/evidence
router.post(
  '/:id/provide-info',
  requireAuth,
  upload.array('evidence', 5),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const reportId = parseInt(req.params.id, 10);
      const { response_notes } = req.body;

      if (!response_notes || typeof response_notes !== 'string' || response_notes.trim().length < 5) {
        res.status(400).json({ error: 'Please provide explanatory notes or response details.' });
        return;
      }

      const report = queryOne<{ id: number; report_reference: string; status: string }>(
        'SELECT id, report_reference, status FROM reports WHERE id = ? AND user_id = ?',
        [reportId, req.user.id]
      );

      if (!report) {
        res.status(404).json({ error: 'Report not found or access denied.' });
        return;
      }

      const now = new Date().toISOString();
      const newStatus = 'Under Review';

      // Update report status back to Under Review
      runSql('UPDATE reports SET status = ?, updated_at = ? WHERE id = ?', [newStatus, now, reportId]);

      // Record update timeline
      runSql(
        `INSERT INTO report_updates (
          report_id, previous_status, new_status, user_message,
          internal_note, updated_by_user_id, updated_by_name, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          reportId,
          report.status,
          newStatus,
          `Reporter provided requested additional information: "${response_notes.trim()}"`,
          `User response note: ${response_notes.trim()}`,
          req.user.id,
          req.user.full_name,
          now,
        ]
      );

      // Save any newly attached files
      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
        for (const file of files) {
          runSql(
            `INSERT INTO evidence (
              report_id, stored_filename, original_filename,
              file_type, file_size, upload_timestamp
            ) VALUES (?, ?, ?, ?, ?, ?);`,
            [
              reportId,
              file.filename,
              file.originalname,
              file.mimetype,
              file.size,
              now,
            ]
          );
        }
      }

      // Add user notification
      runSql(
        `INSERT INTO notifications (
          user_id, report_id, report_reference, title, message, is_read, created_at
        ) VALUES (?, ?, ?, ?, ?, 0, ?);`,
        [
          req.user.id,
          reportId,
          report.report_reference,
          'Additional Information Recorded',
          `Your response for ${report.report_reference} has been forwarded to the reviewing case officer.`,
          now,
        ]
      );

      res.json({
        message: 'Additional information successfully submitted.',
        status: newStatus,
      });
    } catch (err: any) {
      console.error('Provide info error:', err);
      res.status(500).json({ error: 'Server error submitting additional information.' });
    }
  }
);

export default router;
