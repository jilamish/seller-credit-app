import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, dbPathInfo } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, '..', 'client', 'dist');

const app = express();
const PORT = process.env.PORT || 8090;

app.use(express.json());

// ---------- helpers ----------

function poolStats(poolId) {
  const invested = db
    .prepare('SELECT COALESCE(SUM(amount),0) AS v FROM investments WHERE pool_id = ?')
    .get(poolId).v;
  const deployed = db
    .prepare(
      `SELECT COALESCE(SUM(lf.amount),0) AS v
       FROM loan_fundings lf JOIN loans l ON l.id = lf.loan_id
       WHERE l.pool_id = ? AND l.status IN ('active','completed')`
    )
    .get(poolId).v;
  const lenderCount = db
    .prepare('SELECT COUNT(DISTINCT lender_id) AS c FROM investments WHERE pool_id = ?')
    .get(poolId).c;
  const loanCount = db.prepare("SELECT COUNT(*) AS c FROM loans WHERE pool_id = ? AND status IN ('active','completed')").get(poolId).c;
  return { invested, deployed, available: Math.max(invested - deployed, 0), lenderCount, loanCount };
}

function creditLimitFor(trustScore) {
  return Math.round((trustScore * 15) / 100) * 100;
}

function usedCreditFor(borrowerId) {
  return db
    .prepare("SELECT COALESCE(SUM(amount),0) AS v FROM loans WHERE borrower_id = ? AND status IN ('active','pending_review')")
    .get(borrowerId).v;
}

function selectFundingPool(amount) {
  const pools = db.prepare('SELECT * FROM pools ORDER BY target_rate_pct ASC').all();
  for (const pool of pools) {
    if (poolStats(pool.id).available >= amount) return pool;
  }
  return null;
}

// Splits `amount` across every lender currently invested in `pool`, proportional
// to their share, then generates the installment schedule.
function fundAndScheduleLoan(loanId, pool, amount, tenureMonths, installmentAmount, dueOffsets) {
  const investors = db
    .prepare('SELECT lender_id, SUM(amount) AS total FROM investments WHERE pool_id = ? GROUP BY lender_id HAVING total > 0')
    .all(pool.id);
  const poolTotal = investors.reduce((sum, i) => sum + i.total, 0);

  const insertFunding = db.prepare('INSERT INTO loan_fundings (loan_id, lender_id, amount) VALUES (?, ?, ?)');
  for (const inv of investors) {
    const share = inv.total / poolTotal;
    const fundingAmount = Math.round(amount * share * 100) / 100;
    if (fundingAmount > 0) insertFunding.run(loanId, inv.lender_id, fundingAmount);
  }

  const insertInstallment = db.prepare(
    'INSERT INTO installments (loan_id, seq_no, amount, due_offset_days) VALUES (?, ?, ?, ?)'
  );
  dueOffsets.forEach((offset, idx) => {
    insertInstallment.run(loanId, idx + 1, installmentAmount, offset);
  });

  return investors.length;
}

function lenderInterestPerInstallment(loan, pool) {
  if (!pool) return 0;
  return (loan.amount * (pool.target_rate_pct / 100) * (loan.tenure_months / 12)) / loan.tenure_months;
}

function planTerms(plan, price) {
  if (plan === '15day') return { tenureMonths: 1, fee: 0, dueOffsets: [15] };
  if (plan === '3emi') return { tenureMonths: 3, fee: 0, dueOffsets: [30, 60, 90] };
  if (plan === '6emi') return { tenureMonths: 6, fee: 30, dueOffsets: [30, 60, 90, 120, 150, 180] };
  return null;
}

// ---------- health ----------

app.get('/api/health', (req, res) => {
  try {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all()
      .map((row) => row.name);

    const counts = {};
    for (const table of ['pools', 'lenders', 'investments', 'borrowers', 'products', 'loans', 'loan_fundings', 'installments', 'ledger']) {
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

// ---------- pools ----------

app.get('/api/pools', (req, res) => {
  const pools = db.prepare('SELECT * FROM pools ORDER BY target_rate_pct ASC').all();
  res.json(pools.map((p) => ({ ...p, stats: poolStats(p.id) })));
});

app.get('/api/pools/:id', (req, res) => {
  const pool = db.prepare('SELECT * FROM pools WHERE id = ?').get(req.params.id);
  if (!pool) return res.status(404).json({ status: 'error', message: 'Pool not found' });
  const loans = db.prepare("SELECT amount FROM loans WHERE pool_id = ? AND status IN ('active','completed')").all(pool.id);
  const avgLoan = loans.length ? loans.reduce((s, l) => s + l.amount, 0) / loans.length : 0;
  const onTimePct = (() => {
    const row = db
      .prepare(
        `SELECT
           SUM(CASE WHEN i.status = 'paid' THEN 1 ELSE 0 END) AS paid,
           COUNT(*) AS total
         FROM installments i JOIN loans l ON l.id = i.loan_id
         WHERE l.pool_id = ?`
      )
      .get(pool.id);
    return row.total > 0 ? Math.round((row.paid / row.total) * 1000) / 10 : null;
  })();
  res.json({ ...pool, stats: poolStats(pool.id), borrowerCount: loans.length, avgLoan, onTimePct });
});

// ---------- lenders ----------

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

  const grossInvested = db.prepare('SELECT COALESCE(SUM(amount),0) AS v FROM investments WHERE lender_id = ?').get(lender.id).v;
  const withdrawn = db
    .prepare("SELECT COALESCE(SUM(amount),0) AS v FROM ledger WHERE lender_id = ? AND type = 'withdrawn'")
    .get(lender.id).v;
  const invested = grossInvested - withdrawn;
  const deployed = db.prepare('SELECT COALESCE(SUM(amount),0) AS v FROM loan_fundings WHERE lender_id = ?').get(lender.id).v;
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
    .prepare('SELECT * FROM ledger WHERE lender_id = ? ORDER BY created_at DESC LIMIT 15')
    .all(lender.id);

  const repayRow = db
    .prepare(
      `SELECT SUM(CASE WHEN i.status = 'paid' THEN 1 ELSE 0 END) AS paid, COUNT(*) AS total
       FROM installments i
       JOIN loans l ON l.id = i.loan_id
       JOIN loan_fundings lf ON lf.loan_id = l.id
       WHERE lf.lender_id = ?`
    )
    .get(lender.id);
  const onTimeRepaidPct = repayRow.total > 0 ? Math.round((repayRow.paid / repayRow.total) * 1000) / 10 : null;

  const gradeRows = db
    .prepare(
      `SELECT p.grade, SUM(i.amount) AS amount
       FROM investments i JOIN pools p ON p.id = i.pool_id
       WHERE i.lender_id = ? GROUP BY p.grade`
    )
    .all(lender.id);
  const allocation = gradeRows.map((g) => ({
    grade: g.grade,
    amount: g.amount,
    pct: invested > 0 ? Math.round((g.amount / grossInvested) * 1000) / 10 : 0,
  }));

  res.json({
    ...lender,
    invested,
    available: Math.max(invested - deployed, 0),
    deployed,
    returns,
    returnPct: invested > 0 ? Math.round((returns / invested) * 1000) / 10 : 0,
    currentValue: invested + returns,
    loansFunded: db.prepare('SELECT COUNT(DISTINCT loan_id) AS c FROM loan_fundings WHERE lender_id = ?').get(lender.id).c,
    onTimeRepaidPct,
    allocation,
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

    db.prepare('INSERT INTO investments (lender_id, pool_id, amount) VALUES (?, ?, ?)').run(lender.id, pool.id, Number(amount));
    db.prepare("INSERT INTO ledger (lender_id, type, amount, note) VALUES (?, 'invested', ?, ?)").run(
      lender.id,
      Number(amount),
      `Added to ${pool.name}`
    );

    res.status(201).json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.post('/api/lenders/:id/withdraw', (req, res) => {
  try {
    const { amount } = req.body;
    const lender = db.prepare('SELECT * FROM lenders WHERE id = ?').get(req.params.id);
    if (!lender) return res.status(404).json({ status: 'error', message: 'Lender not found' });

    const grossInvested = db.prepare('SELECT COALESCE(SUM(amount),0) AS v FROM investments WHERE lender_id = ?').get(lender.id).v;
    const withdrawn = db
      .prepare("SELECT COALESCE(SUM(amount),0) AS v FROM ledger WHERE lender_id = ? AND type = 'withdrawn'")
      .get(lender.id).v;
    const deployed = db.prepare('SELECT COALESCE(SUM(amount),0) AS v FROM loan_fundings WHERE lender_id = ?').get(lender.id).v;
    const available = grossInvested - withdrawn - deployed;

    if (Number(amount) > available) {
      return res.status(400).json({ status: 'error', message: `Only ₹${Math.round(available).toLocaleString('en-IN')} is available to withdraw right now.` });
    }

    db.prepare("INSERT INTO ledger (lender_id, type, amount, note) VALUES (?, 'withdrawn', ?, 'Withdrawn to bank')").run(
      lender.id,
      Number(amount)
    );

    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------- products ----------

app.get('/api/products', (req, res) => {
  res.json(db.prepare('SELECT * FROM products').all());
});

// ---------- borrowers ----------

app.post('/api/borrowers', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ status: 'error', message: 'Name is required' });
  const result = db.prepare('INSERT INTO borrowers (name) VALUES (?)').run(name.trim());
  const borrower = db.prepare('SELECT * FROM borrowers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...borrower, creditLimit: creditLimitFor(borrower.trust_score), usedCredit: 0 });
});

app.get('/api/borrowers', (req, res) => {
  res.json(db.prepare('SELECT * FROM borrowers ORDER BY id DESC').all());
});

app.get('/api/borrowers/:id', (req, res) => {
  const borrower = db.prepare('SELECT * FROM borrowers WHERE id = ?').get(req.params.id);
  if (!borrower) return res.status(404).json({ status: 'error', message: 'Borrower not found' });

  const loans = db
    .prepare(
      `SELECT l.*, p.name AS pool_name, p.grade, pr.name AS product_name
       FROM loans l
       LEFT JOIN pools p ON p.id = l.pool_id
       LEFT JOIN products pr ON pr.id = l.product_id
       WHERE l.borrower_id = ? ORDER BY l.created_at DESC`
    )
    .all(borrower.id)
    .map((loan) => ({
      ...loan,
      installments: db.prepare('SELECT * FROM installments WHERE loan_id = ? ORDER BY seq_no ASC').all(loan.id),
    }));

  const usedCredit = usedCreditFor(borrower.id);
  const limit = creditLimitFor(borrower.trust_score);

  res.json({ ...borrower, creditLimit: limit, usedCredit, availableCredit: Math.max(limit - usedCredit, 0), loans });
});

app.post('/api/borrowers/:id/pan', (req, res) => {
  const { pan } = req.body;
  if (!pan || pan.trim().length < 4) return res.status(400).json({ status: 'error', message: 'Enter a valid PAN' });
  const last4 = pan.trim().slice(-4).toUpperCase();
  db.prepare('UPDATE borrowers SET pan_last4 = ? WHERE id = ?').run(last4, req.params.id);
  res.json({ status: 'ok', pan_last4: last4 });
});

app.post('/api/borrowers/:id/aadhaar-otp', (req, res) => {
  db.prepare('UPDATE borrowers SET aadhaar_verified = 1 WHERE id = ?').run(req.params.id);
  res.json({ status: 'ok' });
});

// ---------- checkout / BNPL orders ----------

app.post('/api/orders', (req, res) => {
  try {
    const { borrower_id, product_id, plan } = req.body;
    const borrower = db.prepare('SELECT * FROM borrowers WHERE id = ?').get(borrower_id);
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
    const terms = planTerms(plan);
    if (!borrower || !product || !terms) return res.status(404).json({ status: 'error', message: 'Invalid order request' });
    if (!borrower.aadhaar_verified) {
      return res.status(400).json({ status: 'error', message: 'Complete KYC verification first' });
    }

    const amount = product.price;
    const limit = creditLimitFor(borrower.trust_score);
    const used = usedCreditFor(borrower.id);
    if (used + amount > limit) {
      return res.status(400).json({ status: 'error', message: `Exceeds your available credit of ₹${Math.max(limit - used, 0).toLocaleString('en-IN')}` });
    }

    const installmentAmount = Math.round((amount + terms.fee) / terms.tenureMonths);
    const planLabel = plan === '15day' ? 'Pay in 15 days' : plan === '3emi' ? '3 monthly EMIs' : '6 monthly EMIs';

    const needsReview = borrower.trust_score < 600 || amount > limit * 0.8;

    const insertLoan = db.prepare(
      `INSERT INTO loans (borrower_id, product_id, amount, fee, purpose, plan_label, tenure_months, installment_amount, status)
       VALUES (?, ?, ?, ?, 'Shopping', ?, ?, ?, ?)`
    );
    const loanId = insertLoan.run(
      borrower.id,
      product.id,
      amount,
      terms.fee,
      planLabel,
      terms.tenureMonths,
      installmentAmount,
      needsReview ? 'pending_review' : 'active'
    ).lastInsertRowid;

    if (needsReview) {
      return res.status(202).json({ status: 'pending_review', id: loanId, message: 'Your application needs a quick manual review. Check back shortly.' });
    }

    const pool = selectFundingPool(amount);
    if (!pool) {
      db.prepare("UPDATE loans SET status = 'declined' WHERE id = ?").run(loanId);
      return res.status(400).json({ status: 'error', message: 'No lender capacity available right now — please try again later.' });
    }
    db.prepare('UPDATE loans SET pool_id = ? WHERE id = ?').run(pool.id, loanId);
    const fundedBy = fundAndScheduleLoan(loanId, pool, amount, terms.tenureMonths, installmentAmount, terms.dueOffsets);

    res.status(201).json({
      status: 'active',
      id: loanId,
      amount,
      fee: terms.fee,
      installmentAmount,
      tenureMonths: terms.tenureMonths,
      planLabel,
      fundedBy,
    });
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
    const pool = loan.pool_id ? db.prepare('SELECT * FROM pools WHERE id = ?').get(loan.pool_id) : null;

    db.prepare("UPDATE installments SET status = 'paid', paid_at = datetime('now') WHERE id = ?").run(installment.id);

    const interestPerInstallment = lenderInterestPerInstallment(loan, pool);
    const fundings = db.prepare('SELECT * FROM loan_fundings WHERE loan_id = ?').all(loan.id);
    const insertLedger = db.prepare(
      "INSERT INTO ledger (lender_id, loan_id, type, amount, note) VALUES (?, ?, 'emi_collected', ?, ?)"
    );
    for (const f of fundings) {
      const share = f.amount / loan.amount;
      const credit = Math.round(interestPerInstallment * share * 100) / 100;
      if (credit > 0) insertLedger.run(f.lender_id, loan.id, credit, `EMI collected · ${pool ? pool.name : 'loan'}`);
    }

    const borrower = db.prepare('SELECT * FROM borrowers WHERE id = ?').get(loan.borrower_id);
    const newTrust = Math.min(borrower.trust_score + 5, 900);
    db.prepare('UPDATE borrowers SET trust_score = ? WHERE id = ?').run(newTrust, borrower.id);

    const remaining = db.prepare("SELECT COUNT(*) AS c FROM installments WHERE loan_id = ? AND status != 'paid'").get(loan.id).c;
    if (remaining === 0) {
      db.prepare("UPDATE loans SET status = 'completed' WHERE id = ?").run(loan.id);
    }

    res.json({ status: 'ok', trustScore: newTrust, loanCompleted: remaining === 0 });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ---------- ops: underwriting & collections ----------

app.get('/api/ops/queue', (req, res) => {
  const rows = db
    .prepare(
      `SELECT l.*, b.name AS borrower_name, b.trust_score
       FROM loans l JOIN borrowers b ON b.id = l.borrower_id
       WHERE l.status = 'pending_review'
       ORDER BY l.created_at ASC`
    )
    .all();

  const queue = rows.map((loan) => {
    const priorCompleted = db
      .prepare("SELECT COUNT(*) AS c FROM loans WHERE borrower_id = ? AND status = 'completed'")
      .get(loan.borrower_id).c;
    const limit = creditLimitFor(loan.trust_score);
    const flags = [];
    if (loan.trust_score < 600) flags.push('Low score');
    if (priorCompleted === 0) flags.push('Thin file');
    if (loan.amount > limit * 0.9) flags.push('High utilisation');

    return { ...loan, limit, flags };
  });

  res.json({
    pending: queue,
    autoApprovedToday: db.prepare("SELECT COUNT(*) AS c FROM loans WHERE status IN ('active','completed')").get().c,
  });
});

app.post('/api/ops/loans/:id/decision', (req, res) => {
  try {
    const { action, amount } = req.body;
    const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(req.params.id);
    if (!loan) return res.status(404).json({ status: 'error', message: 'Application not found' });
    if (loan.status !== 'pending_review') return res.status(400).json({ status: 'error', message: 'Already decided' });

    if (action === 'decline') {
      db.prepare("UPDATE loans SET status = 'declined' WHERE id = ?").run(loan.id);
      return res.json({ status: 'declined' });
    }

    const finalAmount = amount ? Number(amount) : loan.amount;
    const pool = selectFundingPool(finalAmount);
    if (!pool) return res.status(400).json({ status: 'error', message: 'No lender capacity available right now.' });

    const installmentAmount = Math.round((finalAmount + loan.fee) / loan.tenure_months);
    const dueOffsets = Array.from({ length: loan.tenure_months }, (_, i) => (i + 1) * 30);

    db.prepare("UPDATE loans SET amount = ?, pool_id = ?, installment_amount = ?, status = 'active' WHERE id = ?").run(
      finalAmount,
      pool.id,
      installmentAmount,
      loan.id
    );
    fundAndScheduleLoan(loan.id, pool, finalAmount, loan.tenure_months, installmentAmount, dueOffsets);

    res.json({ status: 'active', amount: finalAmount });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.get('/api/ops/collections', (req, res) => {
  const rows = db
    .prepare(
      `SELECT i.id, i.amount, i.due_offset_days, l.created_at AS loan_created_at, l.id AS loan_id, l.borrower_id
       FROM installments i JOIN loans l ON l.id = i.loan_id
       WHERE i.status = 'due'`
    )
    .all();

  const buckets = { '1-30': { amount: 0, count: 0 }, '31-60': { amount: 0, count: 0 }, '60+': { amount: 0, count: 0 } };
  const overdueList = [];
  const now = Date.now();

  for (const row of rows) {
    const dueAt = new Date(row.loan_created_at.replace(' ', 'T') + 'Z').getTime() + row.due_offset_days * 86400000;
    const daysPastDue = Math.floor((now - dueAt) / 86400000);
    if (daysPastDue <= 0) continue;

    const bucketKey = daysPastDue <= 30 ? '1-30' : daysPastDue <= 60 ? '31-60' : '60+';
    buckets[bucketKey].amount += row.amount;
    buckets[bucketKey].count += 1;
    overdueList.push({ ...row, daysPastDue });
  }

  const totalOverdue = Object.values(buckets).reduce((s, b) => s + b.amount, 0);
  const paidCount = db.prepare("SELECT COUNT(*) AS c FROM installments WHERE status = 'paid'").get().c;
  const overdueCount = overdueList.length;
  const recoveryRate = paidCount + overdueCount > 0 ? Math.round((paidCount / (paidCount + overdueCount)) * 1000) / 10 : 100;

  overdueList.sort((a, b) => b.daysPastDue - a.daysPastDue);

  res.json({
    totalOverdue,
    recoveryRate,
    buckets,
    overdue: overdueList.slice(0, 10),
  });
});

app.use(express.static(clientDist));

app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
