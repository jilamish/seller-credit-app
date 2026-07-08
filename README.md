# Community Credit

A peer-to-peer BNPL + micro-lending prototype, matching the full "Meesho Community Credit" flow design: shoppers get instant 0%-interest credit at checkout, funded by everyday lenders who pool small amounts (₹500+) into risk-graded pools. Express + React + SQLite, single port (8090) serves both the API and the built frontend.

## Flows

- **Borrow** — browse a product, checkout with Pay Later, pick an EMI plan, complete one-time KYC (PAN + Aadhaar), get instant credit, track repayment, pay installments, and watch your trust score grow.
- **Lend** — add money into a pool (Steady Saver / Balanced Growth / High Yield), browse pool details, invest, track portfolio returns & risk allocation, withdraw idle capital.
- **Ops & Risk** — an underwriting queue for applications that don't auto-approve (low trust score or high credit utilization), with approve/decline actions; a collections dashboard with real days-past-due tracking.
- **How it works** — trust & safety explainer.

Every loan is funded proportionally across all lenders currently in the selected pool (real diversification, not simulated). Every paid installment credits interest back to the funding lenders and raises the borrower's trust score. The underwriting gate and collections dashboard operate on real data, not fixtures.

## API

- `GET /api/health` — confirms the SQLite DB is created/readable, lists tables and row counts.
- `GET /api/pools`, `GET /api/pools/:id` — pool stats and detail.
- `POST /api/lenders`, `GET /api/lenders/:id`, `POST /api/lenders/:id/invest`, `POST /api/lenders/:id/withdraw`
- `POST /api/borrowers`, `GET /api/borrowers/:id`, `POST /api/borrowers/:id/pan`, `POST /api/borrowers/:id/aadhaar-otp`
- `GET /api/products`, `POST /api/orders` — checkout/BNPL order creation (auto-selects funding pool, gates to underwriting if needed).
- `POST /api/installments/:id/pay` — repay an installment; distributes interest to funding lenders, raises trust score.
- `GET /api/ops/queue`, `POST /api/ops/loans/:id/decision`, `GET /api/ops/collections`

Data resets on server restart (no persistent disk on free hosting tiers) — this is a hackathon prototype demonstrating the lending mechanics, not a regulated financial product.

## Run locally

```bash
cd server && npm install
cd ../client && npm install && npm run build
cd ../server && node index.js
```

Then open http://localhost:8090
