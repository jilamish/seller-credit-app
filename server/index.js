import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, dbPathInfo } from './db.js';
import { computeScores } from './scoring.js';

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
      db: { path: dbPathInfo(), readable: true, tables, rowCounts: counts },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/sellers', (req, res) => {
  const sellers = db
    .prepare(
      `SELECT s.*, sc.alt_data_score, sc.bureau_score_sim
       FROM sellers s
       LEFT JOIN scores sc ON sc.seller_id = s.id
       ORDER BY s.id DESC`
    )
    .all();
  res.json(sellers);
});

app.post('/api/sellers', (req, res) => {
  try {
    const { name, gmv_monthly, order_count, return_rate, account_age_months, catalog_size } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ status: 'error', message: 'Business name is required' });
    }

    const seller = {
      name: name.trim(),
      gmv_monthly: Number(gmv_monthly) || 0,
      order_count: Number(order_count) || 0,
      return_rate: Number(return_rate) || 0,
      account_age_months: Number(account_age_months) || 0,
      catalog_size: Number(catalog_size) || 0,
    };

    const result = db
      .prepare(
        `INSERT INTO sellers (name, gmv_monthly, order_count, return_rate, account_age_months, catalog_size)
         VALUES (@name, @gmv_monthly, @order_count, @return_rate, @account_age_months, @catalog_size)`
      )
      .run(seller);

    const sellerId = result.lastInsertRowid;
    const { alt_data_score, bureau_score_sim } = computeScores(seller);

    db.prepare(
      `INSERT INTO scores (seller_id, alt_data_score, bureau_score_sim) VALUES (?, ?, ?)`
    ).run(sellerId, alt_data_score, bureau_score_sim);

    res.status(201).json({ id: sellerId, ...seller, alt_data_score, bureau_score_sim });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/sellers/:id', (req, res) => {
  const seller = db
    .prepare(
      `SELECT s.*, sc.alt_data_score, sc.bureau_score_sim
       FROM sellers s
       LEFT JOIN scores sc ON sc.seller_id = s.id
       WHERE s.id = ?`
    )
    .get(req.params.id);

  if (!seller) {
    return res.status(404).json({ status: 'error', message: 'Seller not found' });
  }

  const eligibleLenders = db
    .prepare(`SELECT * FROM lenders WHERE min_score <= ? ORDER BY rate_pct ASC`)
    .all(seller.alt_data_score ?? 0);

  const loans = db
    .prepare(
      `SELECT l.*, ln.name AS lender_name
       FROM loans l JOIN lenders ln ON ln.id = l.lender_id
       WHERE l.seller_id = ? ORDER BY l.created_at DESC`
    )
    .all(req.params.id);

  res.json({ ...seller, eligibleLenders, loans });
});

app.get('/api/lenders', (req, res) => {
  res.json(db.prepare('SELECT * FROM lenders ORDER BY min_score ASC').all());
});

app.post('/api/loans', (req, res) => {
  try {
    const { seller_id, lender_id, amount } = req.body;
    const lender = db.prepare('SELECT * FROM lenders WHERE id = ?').get(lender_id);
    const seller = db
      .prepare(
        `SELECT s.*, sc.alt_data_score FROM sellers s LEFT JOIN scores sc ON sc.seller_id = s.id WHERE s.id = ?`
      )
      .get(seller_id);

    if (!lender || !seller) {
      return res.status(404).json({ status: 'error', message: 'Seller or lender not found' });
    }
    if ((seller.alt_data_score ?? 0) < lender.min_score) {
      return res.status(400).json({ status: 'error', message: 'Seller does not meet this lender\'s minimum score' });
    }
    if (Number(amount) > lender.max_amount) {
      return res.status(400).json({ status: 'error', message: `Amount exceeds lender max of ${lender.max_amount}` });
    }

    const result = db
      .prepare(`INSERT INTO loans (seller_id, lender_id, amount, status) VALUES (?, ?, ?, 'pending')`)
      .run(seller_id, lender_id, Number(amount));

    res.status(201).json({ id: result.lastInsertRowid, seller_id, lender_id, amount: Number(amount), status: 'pending' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/loans', (req, res) => {
  const loans = db
    .prepare(
      `SELECT l.*, s.name AS seller_name, ln.name AS lender_name
       FROM loans l
       JOIN sellers s ON s.id = l.seller_id
       JOIN lenders ln ON ln.id = l.lender_id
       ORDER BY l.created_at DESC`
    )
    .all();
  res.json(loans);
});

app.patch('/api/loans/:id', (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected', 'disbursed'].includes(status)) {
    return res.status(400).json({ status: 'error', message: 'Invalid status' });
  }
  db.prepare('UPDATE loans SET status = ? WHERE id = ?').run(status, req.params.id);
  const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.id);
  res.json(loan);
});

app.use(express.static(clientDist));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
