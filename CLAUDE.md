# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nightwave is a social media link hub (linktree-style) for a Twitch streamer, featuring a canvas-based intro animation, social media buttons, a "Rust Application" form, and a "Bean" mascot character. The frontend is static HTML/CSS/JS; the backend is a Cloudflare Worker with D1 (SQLite) for form submission storage.

## Commands

No build system or package.json — this is a static site with a Cloudflare Pages backend.

```bash
# Local development (serves Pages Functions + static files)
wrangler pages dev .

# Deploy manually (GitHub Actions handles this automatically on push to main)
npx wrangler pages deploy . --project-name nightwave --branch main --commit-dirty=true

# Set Pages secrets (RECAPTCHA_SECRET_KEY, DISCORD_WEBHOOK_URL)
npx wrangler pages secret put RECAPTCHA_SECRET_KEY --project-name nightwave
npx wrangler pages secret put DISCORD_WEBHOOK_URL --project-name nightwave

# Query the D1 database
npx wrangler d1 execute nightwave_db --command "SELECT * FROM applications ORDER BY created_at DESC LIMIT 10;"
```

## Architecture

**Frontend** (`index.html`, `apply.html`, `script.js`, `style.css`):
- `index.html` — main linktree page with SEO metadata (JSON-LD structured data, OG/Twitter cards), canvas animation, and social buttons
- `apply.html` — Rust application form (currently hidden/in-progress)
- `script.js` — canvas ribbon animation (8 S-curved colored ribbons), button ripple effects, staggered entrance animations, and form handling
- `style.css` — dark theme (#111), responsive (max-width 680px), Nightwave/Bean branding

**Backend** (`functions/api/apply.js`):
- Cloudflare Pages Function (route: `POST /api/apply`) — NOT a standalone Worker
- Validates input, verifies reCAPTCHA v3 (score ≥ 0.5), stores plain-text in D1, sends Discord embed webhook
- Binds to D1 via `DB`; secrets: `RECAPTCHA_SECRET_KEY`, `DISCORD_WEBHOOK_URL`; var: `RECAPTCHA_MIN_SCORE`
- `worker.js` exists in repo as reference only — the standalone Worker has been deleted from Cloudflare

**Config** (`wrangler.toml`):
- Pages project: `nightwave`, `pages_build_output_dir = "."`
- D1 binding: `DB` → `nightwave_db` (ID: `eb668d5d-646c-4e25-84d4-636b55f82c20`)
- Var: `RECAPTCHA_MIN_SCORE = "0.5"`

**Deployment** (`.github/workflows/deploy.yml`):
- Auto-deploys on push to `main` via GitHub Actions using `wrangler pages deploy`
- Requires GitHub secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

**DNS / Hosting**:
- Cloudflare Pages project: `nightwave` (account: `90f6cd12811c6b7a86c91424ff618a71`)
- Custom domains: `onlynightwave.com` (A record, CNAME-flattened) and `www.onlynightwave.com` (CNAME → `nightwave.pages.dev`)
- Zone ID: `d972776bb52432eea3caf9463cd9b8be`
- D1 database ID: `eb668d5d-646c-4e25-84d4-636b55f82c20`

**Assets** (`images/`): Reference with relative paths. Key assets: `Bean.png` (mascot), `background.png`, `Nightwave with Bean Logo.png`.

## Engineering Standards

- **Styling**: Vanilla CSS only in `style.css`. Maintain the Nightwave/Bean dark-theme aesthetic.
- **Scripting**: Vanilla JS only in `script.js`. No frameworks or build tools.
- **Assets**: Reference images from `images/` using relative paths.
- **Deployment**: Frontend deploys via GitHub → Cloudflare Pages. Worker deploys via `wrangler deploy`.
