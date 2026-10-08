# Longinset Web — Keyan Groups Archival Vault

React + Vite implementation of the Longinset archival vault, with Supabase auth/Postgres and Groq AI behind serverless functions. Designed for Vercel, runs locally too.

## Scripts

```bash
npm install
npm run dev       # Vite (5173) + Express AI proxy (3001) concurrently
npm run build     # production build → dist/
npm run lint      # eslint
npm run seed      # load ../historical_vault_data.csv into Supabase (idempotent)
npm run start     # run only the AI proxy
```

## Environment

Copy `.env.example` → `.env`:

| Variable | Where it's used |
|---|---|
| `VITE_SUPABASE_URL` | browser client (public) |
| `VITE_SUPABASE_ANON_KEY` | browser client (public, RLS-protected) |
| `GROQ_API_KEY` | **secret** — `server/` + `api/` only |
| `PORT` | local dev proxy port (default 3001) |

## API endpoints

| Route | Purpose |
|---|---|
| `POST /api/deep-dive` | `{title, description}` → AI markdown report |
| `POST /api/current-affairs` | → 5 historical events from today's date |
| `POST /api/discover` | `{query}` → structured incident (title/date/summary/image) |
| `GET  /api/health` | service + key status |

Locally these are Express routes; on Vercel each `api/*.js` is a serverless function sharing `server/groq.js`.

## Vercel

- **Root Directory:** `webapp`
- Build/output come from `vercel.json`
- Set all env vars in the dashboard, then redeploy (VITE_ vars are baked at build time)
