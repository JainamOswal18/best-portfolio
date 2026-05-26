# API Contract — Jainam Oswal Terminal Portfolio

Shared interface between the Go + Gin backend and the React + Vite frontend.
All responses are `application/json` unless noted. All endpoints are prefixed with `/api`.

Base URL is provided to frontend via `VITE_API_URL` (e.g. `http://localhost:8080`).

---

## Conventions

- Error response shape (any non-2xx):
  ```json
  { "error": "human readable message", "code": "OPTIONAL_ENUM" }
  ```
- Timestamps are RFC3339 UTC strings.
- All GET endpoints are idempotent and safe to cache for 5 minutes on the client.

---

## GET /api/health
```json
{ "status": "ok", "timestamp": "2026-05-23T12:00:00Z" }
```

## GET /api/init
Returned on first frontend load — drives the boot banner.
```json
{
  "name": "Jainam Oswal",
  "tagline": "Full Stack Engineer · CGPA 9.6 · Building in public",
  "banner": "<multi-line ASCII art string>",
  "prompt": "jainam@portfolio:~$",
  "commands": [
    { "name": "help", "category": "system", "summary": "Show available commands" },
    { "name": "whoami", "category": "identity", "summary": "Who is Jainam?" }
    // ... full registry
  ]
}
```

## GET /api/whoami
```json
{
  "name": "Jainam Oswal",
  "title": "Full Stack Engineer",
  "university": "Bharati Vidyapeeth, Pune",
  "cgpa": "9.6",
  "photo_url": "/static/jainam.jpg",
  "location": "Pune, India"
}
```

## GET /api/about
```json
{
  "summary": "One-paragraph TL;DR.",
  "bio": "Full multi-paragraph bio.",
  "education": {
    "degree": "B.Tech IT",
    "institution": "Bharati Vidyapeeth",
    "years": "2023–2027",
    "cgpa": "9.6"
  },
  "interests": ["Mountain trekking", "Forts & hill stations", "Open source", "Hackathons"]
}
```

## GET /api/skills
```json
{
  "languages":     ["Java","C","Python","JavaScript","SQL","Bash"],
  "frontend":      ["HTML5","CSS3","React","Bootstrap","EJS","Axios"],
  "backend":       ["Node.js","Express.js","NestJS","gRPC","Supabase","JWT","OAuth2"],
  "databases":     ["MySQL","PostgreSQL","MongoDB","SQLite"],
  "devops":        ["AWS (EC2, S3, Lambda, Glue)","Docker","Git","GCP (Cloud Run, Storage, SQL)"],
  "system-design": ["Microservices","Load Balancing","Caching","Sharding","CAP Theorem"]
}
```

## GET /api/skills/:category
Returns one of the arrays above based on `:category` (`languages`, `frontend`, `backend`, `databases`, `devops`, `system-design`).
```json
{ "category": "backend", "items": ["Node.js", "..."] }
```
404 if the category does not exist.

## GET /api/projects
```json
{
  "projects": [
    { "slug": "foresightflow", "name": "ForesightFlow", "tagline": "97-KPI analytics engine on GCP" }
    // ...
  ]
}
```

## GET /api/projects/:slug
```json
{
  "slug": "foresightflow",
  "name": "ForesightFlow",
  "tagline": "97-KPI analytics engine on GCP",
  "description": "Full description",
  "stack": ["Go", "GCP Cloud Run", "WebSocket", "Gemini"],
  "highlights": ["bullet 1", "bullet 2"],
  "github": "https://github.com/...",
  "live": "https://..."
}
```
404 if slug not found.

## GET /api/experience
```json
{
  "experience": [
    {
      "slug": "curlscape",
      "company": "CurlScape Solutions",
      "title": "Full Stack Developer Intern",
      "duration": "April 2026 – Present",
      "current": true,
      "summary": "AI-native codebase, Go + TypeScript microservices monorepo",
      "highlights": ["20+ services", "GCP Cloud Run", "GDPR-compliant AI recruiter platform"]
    }
  ]
}
```

## GET /api/experience/:slug
Single experience entry, same shape as items above.

## GET /api/community
```json
{
  "roles": [
    { "title": "GDG on Campus Organizer", "detail": "..." },
    { "title": "Dev-a-thon '26 Lead", "detail": "..." },
    { "title": "MetaMask Ambassador", "detail": "..." }
  ],
  "impact": "500+ students impacted",
  "hackathons": [
    { "name": "JPMC Code for Good", "result": "Finalist · Top 1,500 / 50,000+" },
    { "name": "100x Engineers", "result": "Top 100 / 3,500+" },
    { "name": "Innerve 9", "result": "Top 31 / 2,500+" },
    { "name": "Imagine Hackathon 2025", "result": "Top 75 / 3,000+" }
  ]
}
```

## GET /api/socials
```json
{
  "socials": [
    { "name": "github",   "url": "https://github.com/JainamOswal18" },
    { "name": "linkedin", "url": "https://linkedin.com/in/jainam-oswal" },
    { "name": "email",    "url": "mailto:jainamoswal1811@gmail.com", "display": "jainamoswal1811@gmail.com" }
  ]
}
```

## GET /api/resume
Serves the embedded PDF directly with `Content-Type: application/pdf` and `Content-Disposition: inline; filename="Jainam_Oswal_Resume.pdf"`.

Frontend triggers `window.open('${VITE_API_URL}/api/resume', '_blank')`.

## GET /api/resume/preview
```json
{
  "preview": "Plain text resume formatted for terminal display (multi-line string)"
}
```

## POST /api/contact
Request:
```json
{ "name": "string", "email": "string", "message": "string" }
```
Rate-limited: 3 requests per IP per hour. Validates non-empty fields and valid email.

Success (200):
```json
{ "ok": true, "message": "Message delivered. Auto-reply sent to your inbox." }
```
Validation error (400):
```json
{ "error": "email is invalid", "field": "email" }
```
Rate-limit (429):
```json
{ "error": "too many requests, try again later", "retry_after_seconds": 1800 }
```

## POST /api/ask
Request:
```json
{ "question": "what is your strongest backend project?" }
```
Response is **Server-Sent Events** (`text/event-stream`). Each event:
```
data: {"token": "ForesightFlow "}
```
Final event:
```
event: done
data: {"done": true}
```
On error:
```
event: error
data: {"error": "model unavailable"}
```

## POST /api/roast
Request body: `{}` (no payload required).
Response:
```json
{ "roast": "Witty 2-3 sentence roast string" }
```

## GET /api/summarize
Cached after first call.
```json
{ "summary": "One paragraph AI-generated bio." }
```

---

## CORS
Allow only `FRONTEND_URL` env var origin. Allow methods `GET, POST, OPTIONS`. Allow headers `Content-Type`.

## Rate limiting
- `/api/contact`: 3 / IP / hour
- `/api/ask`, `/api/roast`: 20 / IP / hour
- Other GETs: unrestricted (cached)
