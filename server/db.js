import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadsDir, { recursive: true });

const dbPath = path.join(dataDir, 'app.db');
export const db = new Database(dbPath);

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    style_tags TEXT NOT NULL DEFAULT '[]',
    budget INTEGER,
    platforms TEXT NOT NULL DEFAULT '[]',
    skin_tone TEXT,
    undertone TEXT,
    makeup_vibe TEXT NOT NULL DEFAULT '[]',
    declutter_notes TEXT,
    onboarding_step INTEGER NOT NULL DEFAULT 1,
    onboarded INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS closet_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    image_path TEXT,
    color_hex TEXT NOT NULL DEFAULT '#cf9d4f',
    category TEXT NOT NULL,
    color_name TEXT NOT NULL,
    fabric TEXT,
    vibe TEXT,
    occasion_tags TEXT NOT NULL DEFAULT '[]',
    brand TEXT,
    price REAL NOT NULL DEFAULT 0,
    times_worn INTEGER NOT NULL DEFAULT 0,
    care_instructions TEXT,
    date_added TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS outfits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    occasion TEXT NOT NULL,
    item_ids TEXT NOT NULL DEFAULT '[]',
    match_score INTEGER NOT NULL DEFAULT 0,
    missing_item TEXT,
    saved INTEGER NOT NULL DEFAULT 0,
    worn_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS influencers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    handle TEXT NOT NULL,
    name TEXT NOT NULL,
    gradient TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_follows (
    user_id INTEGER NOT NULL,
    influencer_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, influencer_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS looks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    influencer_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    gradient TEXT NOT NULL,
    item_descriptions TEXT NOT NULL DEFAULT '[]',
    price REAL,
    platform TEXT,
    trending INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (influencer_id) REFERENCES influencers(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    price REAL NOT NULL,
    category TEXT NOT NULL,
    color_hex TEXT,
    undertone TEXT,
    premium INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS gap_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    color_hex TEXT NOT NULL,
    occasion_tags TEXT NOT NULL DEFAULT '[]',
    price_meesho REAL NOT NULL,
    price_myntra REAL NOT NULL,
    price_ajio REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    icon TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

export function dbPathInfo() {
  return dbPath;
}

export function uploadsPath() {
  return uploadsDir;
}
