import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, dbPathInfo } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '..', 'client', 'dist');

const app = express();
const PORT = process.env.PORT || 8090;

app.use(express.json());

function poolStats(poolId) {
  const invested = db
    .prepare('SELECT COALESCE(SUM(amount),0) AS v FROM investments WHERE pool_id = ?')
    .get(poolId).v;
  const deployed = db
    .prepare(
      `SELECT COALESCE(SUM(lf.amount),0) AS v
       FROM loan_fundings lf JOIN loans l ON l.id = lf.loan_id
       WHERE l.pool_id = ?`
    )
    .get(poolId).v;
  const lenderCount = db
    .prepare('SELECT COUNT(DISTINCT lender_id) AS c FROM investments WHERE pool_id = ?')
    .get(poolId).c;
  const loanCount = db.prepare('SELECT COUNT(*) AS c FROM loans WHERE pool_id = ?').get(poolId).c;
  return { invested, deployed, available: Math.max(invested - deployed, 0), lenderCount, loanCount };
}

app.get('/api/health', (req, res) => {
  try {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((row) => row.name);

    const counts = {};
    for (const table of ['pools', 'lenders', 'investments', 'borrowers', 'loans', 'loan_fundings', 'installments', 'ledger']) {
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

app.get('/api/pools', (req, res) => {
  const pools = db.prepare('SELECT * FROM pools ORDER BY target_rate_pct ASC').all();
  res.json(pools.map((p) => ({ ...p, stats: poolStats(p.id) })));
});

app.post('/api/lenders', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ status: 'error', message: 'Name is required' });
  const result = db.prepare('INSERT INTO lenders (name) VALUES (?)').run(name.trim());
  res.status(201).json({ id: result.lastInsertRowid, name: name.trim() });
});

app.get('/api/lenders', (req, res) => {
  res.json(db.prepare('SELECT * FROM lenders ORDER BY id DESC').all());
});

app.get('/api/lenders/:id', (req, res) => {
  const lender = db.prepare('SELECT * FROM lenders WHERE id = ?').get(req.params.id);
  if (!lender) return res.status(404).json({ status: 'error', message: 'Lender not found' });

  const invested = db
    .prepare('SELECT COALESCE(SUM(amount),0) AS v FROM investments WHERE lender_id = ?')
    .get(lender.id).v;
  const deployed = db
    .prepare('SELECT COALESCE(SUM(amount),0) AS v FROM loan_fundings WHERE lender_id = ?')
    .get(lender.id).v;
  const returns = db
    .prepare("SELECT COALESCE(SUM(amount),0) AS v FROM ledger WHERE lender_id = ? AND type = 'emi_collected'")
    .get(lender.id).v;

  const investments = db
    .prepare(
      `SELECT i.*, p.name AS pool_name, p.grade, p.target_rate_pct
       FROM investments i JOIN pools p ON p.id = i.pool_id
       WHERE i.lender_id = ? ORDER BY i.created_at DESC`
    )
    .all(lender.id);

  const activity = db
    .prepare('SELECT * FROM ledger WHERE lender_id = ? ORDER BY created_at DESC LIMIT 10')
    .all(lender.id);

  res.json({
    ...lender,
    invested,
    deployed,
    returns,
    currentValue: invested + returns,
    loansFunded: db.prepare('SELECT COUNT(DISTINCT loan_id) AS c FROM loan_fundings WHERE lender_id = ?').get(lender.id).c,
    investments,
    activity,
  });
});

app.post('/api/lenders/:id/invest', (req, res) => {
  try {
    const { pool_id, amount } = req.body;
    const lender = db.prepare('SELECT * FROM lenders WHERE id = ?').get(req.params.id);
    const pool = db.prepare('SELECT * FROM pools WHERE id = ?').get(pool_id);
    if (!lender || !pool) return res.status(404).json({ status: 'error', message: 'Lender or pool not found' });
    if (!(Number(amount) >= 500)) {
      return res.status(400).json({ status: 'error', message: 'Minimum investment is ₹500' });
    }

    db.prepare('INSERT INTO investments (lender_id, pool_id, amount) VALUES (?, ?, ?)').run(
      lender.id,
      pool.id,
      Number(amount)
    );
    db.prepare(
      "INSERT INTO ledger (lender_id, type, amount, note) VALUES (?, 'invested', ?, ?)"
    ).run(lender.id, Number(amount), `Added to ${pool.name}`);

    res.status(201).json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

function creditLimitFor(trustScore) {
  return Math.round((trustScore * 15) / 100) * 100;
}

app.post('/api/borrowers', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ status: 'error', message: 'Name is required' });
  const result = db.prepare('INSERT INTO borrowers (name) VALUES (?)').run(name.trim());
  const borrower = db.prepare('SELECT * FROM borrowers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...borrower, creditLimit: creditLimitFor(borrower.trust_score) });
});

app.get('/api/borrowers', (req, res) => {
  res.json(db.prepare('SELECT * FROM borrowers ORDER BY id DESC').all());
});

app.get('/api/borrowers/:id', (req, res) => {
  const borrower = db.prepare('SELECT * FROM borrowers WHERE id = ?').get(req.params.id);
  if (!borrower) return res.status(404).json({ status: 'error', message: 'Borrower not found' });

  const loans = db
    .prepare(
      `SELECT l.*, p.name AS pool_name, p.grade
       FROM loans l JOIN pools p ON p.id = l.pool_id
       WHERE l.borrower_id = ? ORDER BY l.created_at DESC`
    )
    .all(borrower.id)
    .map((loan) => ({
      ...loan,
      installments: db
        .prepare('SELECT * FROM installments WHERE loan_id = ? ORDER BY seq_no ASC')
        .all(loan.id),
    }));

  res.json({ ...borrower, creditLimit: creditLimitFor(borrower.trust_score), loans });
});

app.post('/api/loans', (req, res) => {
  try {
    const { borrower_id, pool_id, amount, purpose } = req.body;
    const borrower = db.prepare('SELECT * FROM borrowers WHERE id = ?').get(borrower_id);
    const pool = db.prepare('SELECT * FROM pools WHERE id = ?').get(pool_id);
    if (!borrower || !pool) return res.status(404).json({ status: 'error', message: 'Borrower or pool not found' });

    const loanAmount = Number(amount);
    const limit = creditLimitFor(borrower.trust_score);
    if (loanAmount > limit) {
      return res.status(400).json({ status: 'error', message: `Exceeds your credit limit of ₹${limit.toLocaleString('en-IN')}` });
    }

    const { available } = poolStats(pool.id);
    if (loanAmount > available) {
      return res.status(400).json({
        status: 'error',
        message: `This pool only has ₹${Math.round(available).toLocaleString('en-IN')} available right now — try a smaller amount or another pool.`,
      });
    }

    const investors = db
      .prepare(
        `SELECT lender_id, SUM(amount) AS total FROM investments WHERE pool_id = ? GROUP BY lender_id HAVING total > 0`
      )
      .all(pool.id);
    const poolTotal = investors.reduce((sum, i) => sum + i.total, 0);
    if (poolTotal <= 0) {
      return res.status(400).json({ status: 'error', message: 'No lenders have funded this pool yet.' });
    }

    const totalRepayable = Math.round(loanAmount * (1 + (pool.target_rate_pct / 100) * (pool.tenure_months / 12)));
    const installmentAmount = Math.round(totalRepayable / pool.tenure_months);

    const insertLoan = db.prepare(
      `INSERT INTO loans (borrower_id, pool_id, amount, purpose, tenure_months, installment_amount, total_repayable)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    const loanId = insertLoan.run(
      borrower.id,
      pool.id,
      loanAmount,
      purpose || 'General',
      pool.tenure_months,
      installmentAmount,
      totalRepayable
    ).lastInsertRowid;

    const insertFunding = db.prepare('INSERT INTO loan_fundings (loan_id, lender_id, amount) VALUES (?, ?, ?)');
    for (const inv of investors) {
      const share = inv.total / poolTotal;
      const fundingAmount = Math.round(loanAmount * share * 100) / 100;
      if (fundingAmount > 0) insertFunding.run(loanId, inv.lender_id, fundingAmount);
    }

    const insertInstallment = db.prepare(
      'INSERT INTO installments (loan_id, seq_no, amount, due_offset_days) VALUES (?, ?, ?, ?)'
    );
    for (let i = 1; i <= pool.tenure_months; i++) {
      insertInstallment.run(loanId, i, installmentAmount, i * 30);
    }

    res.status(201).json({ id: loanId, amount: loanAmount, installmentAmount, tenureMonths: pool.tenure_months, totalRepayable, fundedBy: investors.length });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/installments/:id/pay', (req, res) => {
  try {
    const installment = db.prepare('SELECT * FROM installments WHERE id = ?').get(req.params.id);
    if (!installment) return res.status(404).json({ status: 'error', message: 'Installment not found' });
    if (installment.status === 'paid') return res.status(400).json({ status: 'error', message: 'Already paid' });

    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(installment.loan_id);
    const pool = db.prepare('SELECT * FROM pools WHERE id = ?').get(loan.pool_id);

    db.prepare("UPDATE installments SET status = 'paid', paid_at = datetime('now') WHERE id = ?").run(installment.id);

    const interestPerInstallment = (loan.total_repayable - loan.amount) / loan.tenure_months;
    const fundings = db.prepare('SELECT * FROM loan_fundings WHERE loan_id = ?').all(loan.id);
    const insertLedger = db.prepare(
      "INSERT INTO ledger (lender_id, loan_id, type, amount, note) VALUES (?, ?, 'emi_collected', ?, ?)"
    );
    for (const f of fundings) {
      const share = f.amount / loan.amount;
      const credit = Math.round(interestPerInstallment * share * 100) / 100;
      if (credit > 0) insertLedger.run(f.lender_id, loan.id, credit, `EMI collected · ${pool.name}`);
    }

    const borrower = db.prepare('SELECT * FROM borrowers WHERE id = ?').get(loan.borrower_id);
    const newTrust = Math.min(borrower.trust_score + 5, 900);
    db.prepare('UPDATE borrowers SET trust_score = ? WHERE id = ?').run(newTrust, borrower.id);

    const remaining = db
      .prepare("SELECT COUNT(*) AS c FROM installments WHERE loan_id = ? AND status != 'paid'")
      .get(loan.id).c;
    if (remaining === 0) {
      db.prepare("UPDATE loans SET status = 'completed' WHERE id = ?").run(loan.id);
    }

    res.json({ status: 'ok', trustScore: newTrust, loanCompleted: remaining === 0 });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.use(express.static(clientDist));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
