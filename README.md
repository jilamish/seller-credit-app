# Fairy Godrobe

A wardrobe/styling web app matching the "Fairy Godrobe" concept pitch deck screen-for-screen, wired up with real functionality. Express + React (Vite) + SQLite, single port (8090) serves both the API and the built frontend.

## Try it

Demo account: **demo@fairygodrobe.app** / **demo1234** — pre-loaded with 20 closet items, followed influencers, and notifications so it's explorable immediately. Or register a new account and go through onboarding yourself.

## Flows

- **Marketing** — hero, "You decide / Handled quietly" split, personas, closing CTA.
- **Onboarding** (6 steps) — style vibe, budget, shopping platforms, beauty profile (skin tone/undertone/makeup vibe), declutter pass, welcome.
- **Build the closet** — snap a photo and auto-tag it (real Claude vision call if `ANTHROPIC_API_KEY` is set, otherwise a graceful deterministic mock), searchable/filterable grid, item detail with real cost-per-wear.
- **Get dressed by occasion** — live weather (Open-Meteo, no key needed) + an outfit-generation algorithm that assembles real combos from your closet, flags the one missing piece, and scores match %.
- **Beauty pairing** — makeup look + nail shades generated from the outfit and your undertone, with real seeded products.
- **Influencer inspiration** — follow/search creators, a feed scored against your actual closet, "recreate this look" showing owned vs. missing pieces, trending shoppable feed, in-app notifications.
- **Shop the gap** — a real algorithm picks the single missing item that unlocks the most new outfit combinations, compares prices across Meesho/Myntra/Ajio, and completes the purchase with a confetti screen.
- **AI stylist chat** — "Your Fairy Godmother" references your actual closet items by name. Uses the real Claude API if `ANTHROPIC_API_KEY` is set, otherwise a rule-based fallback that still builds real outfit recommendations from your closet data.

## Environment variables

- `ANTHROPIC_API_KEY` (optional) — enables real Claude vision for closet auto-tagging and real Claude chat for the AI stylist. Without it, both features fall back to deterministic, still-functional mock logic.
- `PORT` — set automatically by Render.

## API

- `GET /api/health` — DB status, table list, row counts.
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` — email/password auth with bcrypt + token sessions.
- `POST /api/onboarding/step` — persists each onboarding step.
- `GET /api/closet`, `GET /api/closet/:id`, `POST /api/closet`, `POST /api/closet/analyze`, `PATCH /api/closet/:id/wear`
- `GET /api/weather`, `GET /api/occasions`, `GET /api/occasions/:occasion/outfits`, `POST /api/outfits`, `GET /api/outfits/:id`, `POST /api/outfits/:id/wear`
- `GET /api/outfits/:id/makeup`, `GET /api/outfits/:id/nails`
- `GET /api/influencers`, `POST /api/influencers/:id/follow`, `GET /api/feed`, `GET /api/looks/:id/recreate`, `GET /api/trending`, `GET /api/notifications`
- `GET /api/gap`, `GET /api/gap/:id/price`, `POST /api/gap/:id/purchase`
- `GET /api/chat`, `POST /api/chat`

Data and uploaded photos reset on server restart (no persistent disk on free hosting tiers) — the demo account reseeds automatically.

## Run locally

```bash
cd server && npm install
cd ../client && npm install && npm run build
cd ../server && node index.js
```

Then open http://localhost:8090
