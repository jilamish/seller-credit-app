import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'app.db');
export const db = new Database(dbPath);

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS pools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    grade TEXT NOT NULL,
    target_rate_pct REAL NOT NULL,
    tenure_months INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lenders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lender_id INTEGER NOT NULL,
    pool_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (lender_id) REFERENCES lenders(id) ON DELETE CASCADE,
    FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS borrowers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    trust_score REAL NOT NULL DEFAULT 650,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    borrower_id INTEGER NOT NULL,
    pool_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    purpose TEXT,
    tenure_months INTEGER NOT NULL,
    installment_amount REAL NOT NULL,
    total_repayable REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (borrower_id) REFERENCES borrowers(id) ON DELETE CASCADE,
    FOREIGN KEY (pool_id) REFERENCES pools(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS loan_fundings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    lender_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
    FOREIGN KEY (lender_id) REFERENCES lenders(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS installments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    seq_no INTEGER NOT NULL,
    amount REAL NOT NULL,
    due_offset_days INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'due',
    paid_at TEXT,
    FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lender_id INTEGER NOT NULL,
    loan_id INTEGER,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (lender_id) REFERENCES lenders(id) ON DELETE CASCADE
  );
`);

const poolCount = db.prepare('SELECT COUNT(*) AS c FROM pools').get().c;
if (poolCount === 0) {
  const insertPool = db.prepare(
    `INSERT INTO pools (name, grade, target_rate_pct, tenure_months) VALUES (?, ?, ?, ?)`
  );
  insertPool.run('Steady Saver', 'A', 10.0, 6);
  insertPool.run('Balanced Growth', 'B', 13.5, 9);
  insertPool.run('High Yield', 'C', 16.5, 12);
}

export function dbPathInfo() {
  return dbPath;
}
