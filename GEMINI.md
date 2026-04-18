# Project Context: Nightwave

A web-based project (Nightwave) consisting of a Linktree-style landing page and a Rust server application system.

## Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript.
- **Backend:** Cloudflare Pages Functions (`functions/api/apply.js`) — NOT a standalone Worker.
- **Database:** Cloudflare D1 (SQLite-compatible), database `nightwave_db`.
- **Integrations:**
  - Google reCAPTCHA v3 (spam protection, score threshold 0.5).
  - Discord Webhooks (notification on new application).
- **Hosting:** Cloudflare Pages, auto-deployed via GitHub Actions on push to `main`.
- **Assets:** Custom PNG imagery in `images/` directory.

## Key Files
- `index.html` — main linktree page (SEO metadata, canvas animation, social buttons)
- `apply.html` — Rust server application form (live and functional; 17 questions, pill-style inputs, reCAPTCHA v3)
- `rules.html` — server rules page
- `script.js` — canvas ribbon animation, button ripple effects, form submission handler
- `style.css` — dark theme (#111), responsive (max-width 680px)
- `functions/api/apply.js` — Pages Function: validates input, verifies reCAPTCHA, inserts to D1, sends Discord embed
- `worker.js` — reference only, the standalone Worker has been deleted from Cloudflare
- `wrangler.toml` — Pages config, D1 binding, RECAPTCHA_MIN_SCORE var
- `.github/workflows/deploy.yml` — GitHub Actions deploy pipeline

## Infrastructure
- **Cloudflare Pages project:** `nightwave`
- **Account ID:** `90f6cd12811c6b7a86c91424ff618a71`
- **D1 database ID:** `eb668d5d-646c-4e25-84d4-636b55f82c20`
- **Zone ID (onlynightwave.com):** `d972776bb52432eea3caf9463cd9b8be`
- **Custom domains:** `onlynightwave.com` and `www.onlynightwave.com` (both active on Pages)
- **Pages secrets:** `RECAPTCHA_SECRET_KEY`, `DISCORD_WEBHOOK_URL` (set via `wrangler pages secret put`)

## Engineering Standards

### Frontend
- **Styling:** Vanilla CSS only in `style.css`. Maintain the dark-theme aesthetic.
- **Scripting:** Vanilla JS only in `script.js`. No frameworks or build tools.
- **Assets:** Reference images from `images/` using relative paths.

### Backend (Cloudflare Pages Function)
- **Entry point:** `functions/api/apply.js` exports `onRequestPost` — this is a Pages Function, not `export default { fetch }`.
- **Validation:** Server-side validation for all form fields. Parameterized D1 queries only.
- **Security:** Secrets managed via `wrangler pages secret put --project-name nightwave`. Never use `wrangler secret put` (that targets Workers, not Pages).
- **reCAPTCHA:** Guards against missing `RECAPTCHA_SECRET_KEY` (returns 500 if unset). Logs `error-codes` from Google for debugging — check Cloudflare Pages → Functions → Logs.
- **Performance:** Use `truncate()` for Discord embed fields to stay within Discord's 1024-char field limit.

### Deployment & Tooling
- Deploy via GitHub push to `main` (preferred) or `npx wrangler pages deploy . --project-name nightwave`.
- Never use `wrangler deploy` — that targets standalone Workers, not Pages.
- Secrets: `npx wrangler pages secret put <KEY> --project-name nightwave`.
- D1 queries: `npx wrangler d1 execute nightwave_db --remote --command '...'` (use single quotes in PowerShell — double quotes cause SQLITE_ERROR). Alternatively use the Cloudflare Dashboard: dash.cloudflare.com → D1 → nightwave_db → Console.
