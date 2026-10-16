# BuilderHub

React (Vite) builder website: resume, cover letter, portfolio, business card (QR), ID card, certificate, marksheet,
attendance, fee receipt, timetable, admit card, progress report, photo studio, student table, bulk PDF, AI images.

## Run

The frontend and backend are separate packages. In two terminals, from the project root:

```bash
npm install --prefix frontend
npm install --prefix server
npm run server        # API on http://localhost:4000
npm run dev           # UI on http://localhost:5173
```

The Vite dev server automatically proxies `/api` requests to the backend. No frontend API URL is needed for local development. Put your `MONGODB_URI` and a private `JWT_SECRET` in `server/.env` (copy `server/.env.example` first). Without a Mongo URI the backend falls back to local JSON storage. The production UI build is `npm run build`; it writes to `frontend/dist/`.

Keep `server/.env` private and never commit your database URI or JWT secret. Existing `server/db.json` records are imported into MongoDB when the backend connects.
## What needs a backend and what doesn't

| Feature | Where it runs |
|---|---|
| All 11 document builders, templates, accent colors, RTL/Urdu documents | Browser |
| PNG / JPG / PDF export (3× resolution), watermark | Browser |
| ATS score checker, cover-letter text, LinkedIn optimizer (rule-based) | Browser |
| Background remover (AI model downloaded once, runs locally), bg color, passport sheet, social sizes, ID layout | Browser |
| Student data table + CSV, one-click demo data, dark/light mode, English/Urdu UI | Browser; student records can sync to backend |
| Portfolio export (download HTML) and share links (document packed into the URL) | Browser |
| Bulk generate (multi-page PDF) | Browser |
| Login + saved projects | Browser (localStorage) **or** backend for cross-device |
| Short share links (`#/share/s:abc123`) | Backend (optional) |
| AI image from prompt | Free pollinations.ai from the browser, **or** your own key via backend |
| Real payments (Premium templates, remove watermark, bulk) | **Backend required** — see below |

## Monetization

- Free: free templates, “Made with BuilderHub” watermark, bulk limited to 3 records.
- Pro: ★ templates, no watermark, unlimited bulk.
- The “Upgrade to Pro (demo)” button unlocks Pro locally **without payment** — it is a demo. Before charging real users,
  integrate a gateway (Stripe, JazzCash, Easypaisa…) and let its webhook set `plan = 'pro'` on the server
  (`/api/plan/upgrade` is disabled unless `ALLOW_FAKE_UPGRADE=true`), and read the plan from the login response.
  Client-side checks can always be bypassed, so enforce paid limits on the server if revenue depends on it.

## Notes

- Documents are fixed single-page sheets (A4 etc.); a warning shows if text overflows.
- Share links without a backend contain the whole document in the URL; photos make them long.
- Urdu: toggle the language button for RTL UI; tick “Right-to-left document” to flip a document’s layout.
- Rule-based ATS/LinkedIn/cover-letter tools are guidance, not a real ATS or an LLM. A server-side LLM endpoint can replace them.
