# Project Context: Nightwave

A web-based project (Nightwave) consisting of a Linktree-style landing page and a Rust server application system.

## Tech Stack
- **Frontend:** HTML5, CSS3, Vanilla JavaScript.
- **Backend:** Cloudflare Workers (ES Modules).
- **Database:** Cloudflare D1 (SQLite-compatible).
- **Integrations:** 
  - Google reCAPTCHA v3 (Spam protection).
  - Discord Webhooks (Notification system).
- **Assets:** Custom PNG imagery located in the `images/` directory.

## Engineering Standards

### Frontend
- **Styling:** Use Vanilla CSS in `style.css`. Maintain the high-polish aesthetic with custom animations and interactive ripples.
- **Scripting:** Keep logic in `script.js`. Use modern ES6+ features but avoid heavy frameworks.
- **Assets:** Reference images from the `images/` directory using relative paths.

### Backend (Cloudflare Worker)
- **Validation:** Always perform server-side validation for all incoming form data in `worker.js`.
- **Security:**
  - Use parameterized queries for all D1 database interactions to prevent SQL injection.
  - Manage all sensitive keys (Discord Webhooks, reCAPTCHA Secrets) via `wrangler secret put`.
  - Maintain the reCAPTCHA v3 score-based verification flow.
- **Performance:** Keep the worker lightweight; use `truncate()` for external API payloads (like Discord embeds) to stay within size limits.

### Deployment & Tooling
- Use `wrangler` for deployment and secret management.
- Always run commands via `npx wrangler` if not installed globally.
