import { Router, Response } from 'express';
import { queryOne, runSql } from '../db.ts';
import { hashPassword, comparePassword, generateToken, requireAuth, AuthenticatedRequest } from '../auth.ts';

const router = Router();

// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }
  // Reset after 1 minute
  if (now - entry.lastAttempt > 60000) {
    loginAttempts.set(ip, { count: 1, lastAttempt: now });
    return true;
  }
  if (entry.count >= 10) {
    return false;
  }
  entry.count++;
  entry.lastAttempt = now;
  return true;
}

// POST /api/auth/register
router.post('/register', async (req, res): Promise<void> => {
  try {
    const { full_name, email, password, phone } = req.body;

    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
      res.status(400).json({ error: 'Please provide a valid full name (at least 2 characters).' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim().toLowerCase())) {
      res.status(400).json({ error: 'Please provide a valid email address.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!password || typeof password !== 'string' || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    // Check if email already registered
    const existing = queryOne('SELECT id FROM users WHERE email = ?', [cleanEmail]);
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    const password_hash = await hashPassword(password);
    const now = new Date().toISOString();

    // Role is strictly enforced as 'user' for public registration
    const result = runSql(
      `INSERT INTO users (full_name, email, password_hash, role, phone, created_at, updated_at)
       VALUES (?, ?, ?, 'user', ?, ?, ?)`,
      [full_name.trim(), cleanEmail, password_hash, phone ? phone.trim() : null, now, now]
    );

    const user = {
      id: result.lastInsertRowid,
      full_name: full_name.trim(),
      email: cleanEmail,
      role: 'user' as const,
      phone: phone ? phone.trim() : null,
      created_at: now,
    };

    const token = generateToken(user);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: 'Account registered successfully.',
      user,
      token,
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error processing registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      res.status(429).json({ error: 'Too many login attempts. Please wait 1 minute before trying again.' });
      return;
    }

    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const user = queryOne<{
      id: number;
      full_name: string;
      email: string;
      password_hash: string;
      role: 'user' | 'admin';
      phone: string | null;
      created_at: string;
    }>('SELECT * FROM users WHERE email = ?', [cleanEmail]);

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await comparePassword(String(password), user.password_hash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      created_at: user.created_at,
    };

    const token = generateToken(safeUser);
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: 'Logged in successfully.',
      user: safeUser,
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error processing login.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req, res): void => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const user = queryOne<{
    id: number;
    full_name: string;
    email: string;
    role: 'user' | 'admin';
    phone: string | null;
    created_at: string;
    updated_at: string;
  }>('SELECT id, full_name, email, role, phone, created_at, updated_at FROM users WHERE id = ?', [req.user.id]);

  if (!user) {
    res.status(404).json({ error: 'User account not found.' });
    return;
  }

  res.json({ user });
});

// PUT /api/auth/profile
router.put('/profile', requireAuth, (req: AuthenticatedRequest, res: Response): void => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { full_name, phone } = req.body;

    if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
      res.status(400).json({ error: 'Please enter a valid full name.' });
      return;
    }

    const now = new Date().toISOString();
    runSql(
      'UPDATE users SET full_name = ?, phone = ?, updated_at = ? WHERE id = ?',
      [full_name.trim(), phone ? String(phone).trim() : null, now, req.user.id]
    );

    const updated = queryOne(
      'SELECT id, full_name, email, role, phone, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    res.json({
      message: 'Profile updated successfully.',
      user: updated,
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Server error updating profile.' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      res.status(400).json({ error: 'Current password and new password are required.' });
      return;
    }

    if (String(new_password).length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      return;
    }

    const user = queryOne<{ password_hash: string }>(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const isMatch = await comparePassword(String(current_password), user.password_hash);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password is incorrect.' });
      return;
    }

    const newHash = await hashPassword(String(new_password));
    const now = new Date().toISOString();
    runSql('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [newHash, now, req.user.id]);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error changing password.' });
  }
});

export default router;
