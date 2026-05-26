# Jainam Oswal — Portfolio Backend

Go + Gin backend powering the terminal portfolio. Designed to run **either** as a long-running server (local dev, Render, Railway) **or** as a Vercel serverless function — same code, two entry points.

```
backend/
├── api/index.go          # Vercel serverless entry — wraps the Gin engine
├── cmd/server/main.go    # Local long-running server entry
├── internal/app/         # Shared engine factory (used by both entries)
├── handlers/             # HTTP handlers
├── data/                 # Portfolio content + embedded assets (banner, resume, photo)
├── middleware/           # CORS, security headers, rate limit
├── services/             # gomail.v2 wrapper + Gemini client
├── vercel.json
├── go.mod
└── .env.example
```

## Run locally

```bash
cp .env.example .env
go mod tidy
go run ./cmd/server
```

Server listens on `:8080`. API is mounted at `/api/*`.

## Environment variables

| Variable         | Description                                              | Default                         |
| ---------------- | -------------------------------------------------------- | ------------------------------- |
| `PORT`           | HTTP port (local dev only — Vercel ignores)              | `8080`                          |
| `FRONTEND_URL`   | Allowed CORS origin                                      | `http://localhost:5173`         |
| `GEMINI_API_KEY` | Gemini key. Blank disables AI endpoints (stub response). | (empty)                         |
| `SMTP_HOST`      | SMTP server host. Blank = dev mode (logs to stdout).     | (empty)                         |
| `SMTP_PORT`      | SMTP port                                                | `587`                           |
| `SMTP_USER`      | SMTP username                                            | (empty)                         |
| `SMTP_PASS`      | SMTP password                                            | (empty)                         |
| `MAIL_TO`        | Inbox to receive contact submissions                     | `jainamoswal1811@gmail.com`     |
| `MAIL_FROM`      | From address on outgoing mail                            | `portfolio@jainamoswal.com`     |

## Endpoints

All endpoints are under `/api`. See [`docs/API_CONTRACT.md`](../docs/API_CONTRACT.md) for full request/response shapes.

| Method | Path                     | Notes                                            |
| ------ | ------------------------ | ------------------------------------------------ |
| GET    | `/api/health`            | Liveness probe                                   |
| GET    | `/api/init`              | Banner + command registry                        |
| GET    | `/api/photo`             | Embedded profile photo (JPEG)                    |
| GET    | `/api/whoami`            | Identity card                                    |
| GET    | `/api/about`             | Bio, education, interests                        |
| GET    | `/api/skills`            | All skill categories                             |
| GET    | `/api/skills/:category`  | One category                                     |
| GET    | `/api/projects`          | Project summaries                                |
| GET    | `/api/projects/:slug`    | Project detail                                   |
| GET    | `/api/experience`        | Experience list                                  |
| GET    | `/api/experience/:slug`  | Experience detail                                |
| GET    | `/api/community`         | Roles, impact, hackathons                        |
| GET    | `/api/socials`           | Social links                                     |
| GET    | `/api/resume`            | Inline embedded PDF                              |
| GET    | `/api/resume/preview`    | Plain-text resume                                |
| GET    | `/api/summarize`         | Cached Gemini bio                                |
| POST   | `/api/contact`           | Rate-limited 3/hour/IP, sends email              |
| POST   | `/api/ask`               | SSE Gemini stream, rate-limited 20/hour/IP       |
| POST   | `/api/roast`             | One-shot Gemini roast, rate-limited 20/hour/IP   |

All bundled assets (`banner.txt`, `resume.pdf`, `jainam.jpg`) live inside `data/` and are embedded into the binary via `//go:embed`. Replace those files and rebuild — no filesystem access at runtime.

## Deployment — Vercel (serverless)

The `api/index.go` file is a [Vercel Go Function](https://vercel.com/docs/functions/runtimes/go). The `vercel.json` rewrite sends every `/api/*` path to that single function, which hands the request off to the Gin engine (same one used by `cmd/server`).

```bash
cd backend
vercel login           # one-time
vercel link            # one-time — creates a Vercel project for the backend
vercel env add GEMINI_API_KEY production
vercel env add SMTP_HOST production
# ...repeat for SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_TO, MAIL_FROM, FRONTEND_URL
vercel --prod
```

Then set the frontend's `VITE_API_URL` env var to the backend's deployed URL (e.g. `https://jainam-portfolio-backend.vercel.app`).

### Serverless caveats (read before deploying)

| Concern                        | Behaviour on Vercel                                                                 | Verdict for a portfolio                                          |
| ------------------------------ | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `summarize` cache              | Per warm container only — resets on each cold start                                 | Fine. Gemini regenerates ~once per cold start (≈ pennies / mo).  |
| Contact rate limit (3/h/IP)    | Per warm container — a determined spammer could bypass via parallel cold starts     | Acceptable for a personal site. Add Vercel KV later if abused.   |
| SSE `/api/ask` stream timeout  | 10s on Hobby, 60s on Pro. Hobby is tight for long Gemini answers                    | Hobby works for short prompts. Upgrade to Pro for safety.        |
| Cold starts                    | First request after idle = ~500ms–1s startup penalty                                | Fine for a portfolio.                                            |
| Filesystem writes              | Read-only except `/tmp`                                                             | Not used here — all assets are embedded.                         |

### Deployment — Render / Railway (long-running, alternative)

If you outgrow the serverless caveats:

1. Build command: `go build -o portfolio-backend ./cmd/server`
2. Start command: `./portfolio-backend`
3. Set the environment variables above.
4. Drop the real `Jainam_Oswal_Resume.pdf` and `jainam.jpg` into `data/` before deploying — both are embedded at build time via `go:embed`.

## Replacing the placeholder assets

Both the resume PDF and the profile photo ship as placeholders. To swap them in:

```bash
cp /path/to/real_resume.pdf backend/data/resume.pdf
cp /path/to/jainam.jpg      backend/data/jainam.jpg
```

Then rebuild / redeploy. The `//go:embed` directives pick them up at compile time — no code changes needed.
