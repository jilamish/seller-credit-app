# Community Credit

A peer-to-peer micro-lending prototype: everyday people lend small amounts (₹500+) into risk-graded pools, and borrowers get instant credit funded proportionally across every lender in that pool. Express + React + SQLite, single port (8090) serves both the API and the built frontend.

## How it works

- **Lend** — add money to one of three pools (Steady Saver / Balanced Growth / High Yield), each with a target return, risk grade, and tenure.
- **Borrow** — enter an amount and purpose, get an instant decision based on a transparent trust score, and see your repayment schedule.
- Every loan is funded proportionally across all lenders currently in that pool (diversification). Every on-time installment increases the borrower's trust score and credits interest back to the funding lenders in real time.

## API

- `GET /api/health` — confirms the SQLite DB is created/readable, lists tables and row counts.
- `GET /api/pools` — pool list with live stats (invested, deployed, available).
- `POST /api/lenders`, `GET /api/lenders/:id`, `POST /api/lenders/:id/invest`
- `POST /api/borrowers`, `GET /api/borrowers/:id`
- `POST /api/loans` — apply for instant credit.
- `POST /api/installments/:id/pay` — repay an installment; distributes interest to funding lenders.

Data resets on server restart (no persistent disk on free hosting tiers) — this is a hackathon prototype demonstrating the lending mechanics, not a regulated financial product.

## Run locally

```bash
cd server && npm install
cd ../client && npm install && npm run build
cd ../server && node index.js
```

Then open http://localhost:8090
