# Jainam Oswal — Terminal Portfolio

A fully terminal-emulated developer portfolio. The entire UI is a browser-based shell — no nav bars, no hero sections. Every command hits a Go backend; the React frontend is a pure renderer with zero hardcoded portfolio data.

```
Portfolio/
├── frontend/      # React + Vite — terminal UI, command registry, SSE client
├── backend/       # Go + Gin   — API, embedded resume/photo, Gemini, gomail
└── docs/
    └── API_CONTRACT.md   # source of truth for the API contract
```

## Quick start (local)

Two terminals.

```bash
# terminal 1 — backend
cd backend
cp .env.example .env
go mod tidy
go run ./cmd/server               # http://localhost:8080

# terminal 2 — frontend
cd frontend
npm install
cp .env.example .env              # VITE_API_URL=http://localhost:8080
npm run dev                       # http://localhost:5173
```

Open <http://localhost:5173> and type `help`.

## Architecture

```
Browser ─► Terminal (React)
            │
            │  command typed
            ▼
        Command router          ◄── command registry (single source of truth)
            │
            │  fetch / SSE
            ▼
        Gin engine (Go)         ◄── same engine used by local server + Vercel function
            │
            ├─► data/portfolio.go (structs, embedded assets)
            ├─► services/mailer.go  (gomail.v2 SMTP)
            └─► services/llm.go     (Gemini, streaming for /api/ask)
```

The same `internal/app.Build()` factory powers `cmd/server/main.go` (long-running) and `api/index.go` (Vercel function). No code duplication between deployment targets.

## Deployment — Vercel (two projects)

The frontend and backend deploy as **two separate Vercel projects**. The frontend hits the backend's public URL via `VITE_API_URL`; the backend's CORS is locked to `FRONTEND_URL`.

```bash
# backend (Go serverless function)
cd backend
vercel link
vercel env add GEMINI_API_KEY production
vercel env add SMTP_HOST       production
vercel env add SMTP_PORT       production
vercel env add SMTP_USER       production
vercel env add SMTP_PASS       production
vercel env add MAIL_TO         production
vercel env add MAIL_FROM       production
vercel env add FRONTEND_URL    production   # paste frontend URL after first frontend deploy
vercel --prod

# frontend (Vite static site)
cd ../frontend
vercel link
vercel env add VITE_API_URL    production   # paste backend URL from above
vercel --prod
```

After the first round, update each project's cross-reference env var (frontend URL into backend, backend URL into frontend) and redeploy.

## Serverless caveats (read before relying on production)

| Concern                       | Impact                                                                | Mitigation                       |
| ----------------------------- | --------------------------------------------------------------------- | -------------------------------- |
| `/api/summarize` cache        | In-memory — resets every cold start                                   | Acceptable; regenerates rarely   |
| `/api/contact` rate limit     | Per warm container — bypassable via parallel cold starts              | Acceptable for a portfolio       |
| `/api/ask` SSE timeout        | Hobby = 10s, Pro = 60s — long Gemini answers can truncate on Hobby    | Pro tier or keep prompts short   |
| Cold start                    | ~500ms–1s on first hit after idle                                     | Fine                             |
| Outbound SMTP                 | Works                                                                 | —                                |
| Embedded assets               | All at build time via `//go:embed`                                    | Replace `data/*.pdf` and rebuild |

## Replacing placeholder assets

The repo ships with a placeholder resume PDF and profile photo. Swap them in:

```bash
cp /path/to/Jainam_Oswal_Resume.pdf  backend/data/resume.pdf
cp /path/to/jainam.jpg               backend/data/jainam.jpg
```

Then `vercel --prod` from `backend/` to redeploy. Both are picked up by `//go:embed` at compile time — no code changes needed.

## API contract

See [`docs/API_CONTRACT.md`](docs/API_CONTRACT.md). Every endpoint, request shape, and response shape lives there. Both the frontend and backend are built against it.

## Commands

`help` inside the terminal auto-generates the command list from the registry in `frontend/src/commands/index.js`. The registry is the single source of truth — `help` is never hand-edited.

Categories: `system`, `identity`, `skills`, `projects`, `experience`, `community`, `resume`, `socials`, `ai`, `fun`.

Keybinds: `Enter` submit · `↑/↓` history · `Tab` autocomplete · `Ctrl+C` cancel · `Ctrl+L` clear · `theme --toggle` flip dark/light.
