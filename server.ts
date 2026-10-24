import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { getDb, queryOne } from './server/db.ts';
import authRoutes from './server/routes/authRoutes.ts';
import reportRoutes from './server/routes/reportRoutes.ts';
import adminRoutes from './server/routes/adminRoutes.ts';
import notificationRoutes from './server/routes/notificationRoutes.ts';
import { requireAuth, AuthenticatedRequest } from './server/auth.ts';

const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

async function startServer() {
  // Ensure database initialized
  await getDb();

  const app = express();

  // Basic security & parsing middleware
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Basic security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/notifications', notificationRoutes);

  // Secure evidence file download/preview route
  app.get('/api/evidence/:id', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
    try {
      const evidenceId = parseInt(req.params.id, 10);
      if (isNaN(evidenceId) || !req.user) {
        res.status(400).json({ error: 'Invalid evidence ID' });
        return;
      }

      const evidence = queryOne<{
        id: number;
        report_id: number;
        stored_filename: string;
        original_filename: string;
        file_type: string;
      }>('SELECT * FROM evidence WHERE id = ?', [evidenceId]);

      if (!evidence) {
        res.status(404).json({ error: 'Evidence file not found.' });
        return;
      }

      // Check access permission: Admin or Report Owner
      if (req.user.role !== 'admin') {
        const report = queryOne<{ user_id: number }>('SELECT user_id FROM reports WHERE id = ?', [evidence.report_id]);
        if (!report || report.user_id !== req.user.id) {
          res.status(403).json({ error: 'Access denied: You do not own this report.' });
          return;
        }
      }

      const filePath = path.join(UPLOADS_DIR, path.basename(evidence.stored_filename));
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: 'File missing from storage disk.' });
        return;
      }

      res.setHeader('Content-Type', evidence.file_type);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(evidence.original_filename)}"`);
      res.sendFile(filePath);
    } catch (err) {
      console.error('Evidence access error:', err);
      res.status(500).json({ error: 'Server error retrieving file.' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      system: 'Online Scam Reporting System',
      timestamp: new Date().toISOString(),
    });
  });

  // Vite middleware in dev or static files in production
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled express error:', err);
    res.status(500).json({
      error: 'An unexpected internal server error occurred.',
      message: isProd ? undefined : err.message,
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
