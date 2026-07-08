import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, dbPathInfo } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '..', 'client', 'dist');

const app = express();
const PORT = process.env.PORT || 8090;

app.use(express.json());

app.get('/api/health', (req, res) => {
  try {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((row) => row.name);

    const counts = {};
    for (const table of ['sellers', 'scores', 'lenders', 'loans']) {
      if (tables.includes(table)) {
        counts[table] = db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get().c;
      }
    }

    res.json({
      status: 'ok',
      db: {
        path: dbPathInfo(),
        readable: true,
        tables,
        rowCounts: counts,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/seed', (req, res) => {
  try {
    db.exec('DELETE FROM loans; DELETE FROM scores; DELETE FROM lenders; DELETE FROM sellers;');

    const insertSeller = db.prepare(
      `INSERT INTO sellers (name, gmv_monthly, order_count, return_rate, account_age_months, catalog_size)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    const sellerIds = [
      insertSeller.run('Aarav Textiles', 450000, 1200, 0.04, 18, 320).lastInsertRowid,
      insertSeller.run('Bloom Home Decor', 180000, 540, 0.07, 8, 150).lastInsertRowid,
      insertSeller.run('Chetak Electronics', 920000, 2100, 0.02, 30, 500).lastInsertRowid,
    ];

    const insertScore = db.prepare(
      `INSERT INTO scores (seller_id, alt_data_score, bureau_score_sim) VALUES (?, ?, ?)`
    );
    insertScore.run(sellerIds[0], 72.5, 690);
    insertScore.run(sellerIds[1], 58.0, 640);
    insertScore.run(sellerIds[2], 88.3, 760);

    const insertLender = db.prepare(
      `INSERT INTO lenders (name, min_score, max_amount, rate_pct, tenure_months) VALUES (?, ?, ?, ?, ?)`
    );
    const lenderIds = [
      insertLender.run('QuickCapital', 50, 200000, 18.5, 6).lastInsertRowid,
      insertLender.run('MeeshoLend Partners', 65, 1000000, 14.0, 12).lastInsertRowid,
    ];

    const insertLoan = db.prepare(
      `INSERT INTO loans (seller_id, lender_id, amount, status) VALUES (?, ?, ?, ?)`
    );
    insertLoan.run(sellerIds[0], lenderIds[0], 100000, 'approved');
    insertLoan.run(sellerIds[2], lenderIds[1], 500000, 'pending');

    res.json({ status: 'ok', message: 'Seed data inserted' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Serve React static build
app.use(express.static(clientDist));

// SPA fallback — send index.html for any non-API route
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
