import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { db } from './db.js';

export function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

export function checkPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function createSession(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').run(token, userId);
  return token;
}

export function userFromToken(token) {
  if (!token) return null;
  const row = db
    .prepare('SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?')
    .get(token);
  return row || null;
}

export function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  const user = userFromToken(token);
  if (!user) return res.status(401).json({ status: 'error', message: 'Not authenticated' });
  req.user = user;
  next();
}

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    styleTags: JSON.parse(user.style_tags || '[]'),
    budget: user.budget,
    platforms: JSON.parse(user.platforms || '[]'),
    skinTone: user.skin_tone,
    undertone: user.undertone,
    makeupVibe: JSON.parse(user.makeup_vibe || '[]'),
    declutterNotes: user.declutter_notes,
    onboardingStep: user.onboarding_step,
    onboarded: !!user.onboarded,
  };
}
