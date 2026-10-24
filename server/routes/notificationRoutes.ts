import { Router, Response } from 'express';
import { queryAll, queryOne, runSql } from '../db.ts';
import { requireAuth, AuthenticatedRequest } from '../auth.ts';

const router = Router();
router.use(requireAuth);

// GET /api/notifications
router.get('/', (req: AuthenticatedRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const notifications = queryAll(
      `SELECT id, report_id, report_reference, title, message, is_read, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    const countRes = queryOne<{ unread: number }>(
      'SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );

    res.json({
      notifications,
      unreadCount: countRes?.unread || 0,
    });
  } catch (err) {
    console.error('Fetch notifications error:', err);
    res.status(500).json({ error: 'Server error retrieving notifications.' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', (req: AuthenticatedRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const notifId = parseInt(req.params.id, 10);
    if (isNaN(notifId)) {
      res.status(400).json({ error: 'Invalid notification ID' });
      return;
    }

    runSql('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [notifId, req.user.id]);
    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Server error updating notification.' });
  }
});

// POST /api/notifications/read-all
router.post('/read-all', (req: AuthenticatedRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    runSql('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Server error updating notifications.' });
  }
});

export default router;
