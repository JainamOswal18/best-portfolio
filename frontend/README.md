# Jainam Oswal — Terminal Portfolio (frontend)

React + Vite frontend that renders a portfolio as a terminal. All portfolio
content is fetched from the Go + Gin backend described in
`../docs/API_CONTRACT.md` — there is no hard-coded portfolio data in the JS.

## Stack

- React 19 + Vite
- Plain CSS (CSS variables, no Tailwind, no UI libraries)
- JetBrains Mono via `@fontsource/jetbrains-mono`

## Setup

```bash
npm install
cp .env.example .env       # set VITE_API_URL if not localhost:8080
npm run dev
```

Open <http://localhost:5173>. The page boots by calling `GET /api/init`; if the
backend is unreachable a fallback banner is shown so the UI still loads.

## Environment

| Variable        | Default                  | Purpose                  |
| --------------- | ------------------------ | ------------------------ |
| `VITE_API_URL`  | `http://localhost:8080`  | Base URL of the API.     |

## Scripts

- `npm run dev` — Vite dev server with HMR.
- `npm run build` — production build to `dist/`.
- `npm run preview` — preview the built bundle locally.
- `npm run lint` — eslint over `src/`.

## Commands

`help` inside the terminal lists every command, grouped by category. The list
is generated from `src/commands/index.js` — the single source of truth. Each
command supports `--help` / `-h`. Keybinds: `Enter` submit, `↑/↓` history,
`Tab` autocomplete, `Ctrl+C` cancel current request or contact form,
`Ctrl+L` / `Cmd+K` clear screen.

## Theming

`theme --toggle` (or `theme`) flips between dark and light, persisted in
`localStorage` under `portfolio-theme`. Default is dark. `prefers-reduced-motion`
disables the cursor blink and matrix-rain easter egg.

## Deployment (Vercel)

```bash
cd frontend
vercel login         # one-time
vercel link          # one-time — creates a Vercel project for the frontend
vercel env add VITE_API_URL production
# paste the backend's deployed URL when prompted, e.g.
#   https://jainam-portfolio-backend.vercel.app
vercel --prod
```

Vercel auto-detects Vite from `package.json`. The bundled `vercel.json` handles
SPA fallback to `/index.html` plus long-cache headers on the hashed
`/assets/*` bundle.

The frontend and backend are two **separate Vercel projects**. The frontend
calls the backend via its public URL — set in `VITE_API_URL`. CORS on the
backend is restricted to the `FRONTEND_URL` env var, so set that on the backend
to the frontend's production URL.

## Project layout

```
src/
├── api/client.js              fetch wrappers + SSE consumer
├── commands/                  command handlers + registry
├── components/                Terminal, OutputBlock, InputLine, Loader, MatrixRain, …
├── hooks/                     useTerminal (state) + useCommandHandler (routing)
├── index.css                  CSS variables, theme tokens, layout
├── main.jsx                   React entry, font + style imports
└── App.jsx                    renders <Terminal />
```
