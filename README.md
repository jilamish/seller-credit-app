# Seller Credit App

Express + React + SQLite prototype. Single port (8090) serves both the API and the built React frontend.

## Run on Replit (no local installs needed)

1. Go to replit.com and create a new Repl → choose "Import from Upload" (or drag-and-drop this zip).
2. Upload `seller-credit-app.zip`.
3. Click **Run**. Replit will install dependencies, build the frontend, and start the server automatically (see `run.sh`).
4. Use the webview URL Replit gives you — that's your public prototype link.

## API

- `GET /api/health` — confirms the SQLite DB is created/readable, lists tables and row counts.
- `POST /api/seed` — clears and inserts sample sellers/scores/lenders/loans (data resets on redeploy — free tier has no persistent disk).

## Run locally

```bash
cd server && npm install
cd ../client && npm install && npm run build
cd ../server && node index.js
```

Then open http://localhost:8090
