# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Nightwave is a social media link hub (linktree-style) for a Twitch streamer, featuring a canvas-based intro animation, social media buttons, a "Rust Application" form, and a "Bean" mascot character. The frontend is static HTML/CSS/JS; the backend is a Cloudflare Worker with D1 (SQLite) for form submission storage.

## Commands

No build system or package.json — this is a static site with a Cloudflare Worker backend.

```bash
# Local development (serves worker + static files)
wrangler dev

# Deploy the Cloudflare Worker
wrangler deploy

# Set the encryption secret (required for form submission)
wrangler secret put MASTER_KEY

# Create the D1 database (first-time setup)
wrangler d1 create nightwave_db
```

After creating the D1 database, update `database_id` in `wrangler.toml` with the returned ID.

## Architecture

**Frontend** (`index.html`, `apply.html`, `script.js`, `style.css`):
- `index.html` — main linktree page with SEO metadata (JSON-LD structured data, OG/Twitter cards), canvas animation, and social buttons
- `apply.html` — Rust application form (currently hidden/in-progress)
- `script.js` — canvas ribbon animation (8 S-curved colored ribbons), button ripple effects, staggered entrance animations, and form handling
- `style.css` — dark theme (#111), responsive (max-width 680px), Nightwave/Bean branding

**Backend** (`worker.js`):
- Cloudflare Worker handling POST form submissions
- Encrypts every form field with AES-GCM (random IV per field) before storing in D1
- Binds to D1 database via `DB` binding; encryption algorithm set via `ENCRYPTION_ALGORITHM` env var; `MASTER_KEY` is a Worker secret

**Config** (`wrangler.toml`):
- Worker name: `nightwave`, entry: `worker.js`
- D1 binding: `DB` → `nightwave_db` (database ID must be filled in)
- Var: `ENCRYPTION_ALGORITHM = "AES-GCM"`

**Assets** (`images/`): Reference with relative paths. Key assets: `Bean.png` (mascot), `background.png`, `Nightwave with Bean Logo.png`.

## Engineering Standards

- **Styling**: Vanilla CSS only in `style.css`. Maintain the Nightwave/Bean dark-theme aesthetic.
- **Scripting**: Vanilla JS only in `script.js`. No frameworks or build tools.
- **Assets**: Reference images from `images/` using relative paths.
- **Deployment**: Frontend deploys via GitHub → Cloudflare Pages. Worker deploys via `wrangler deploy`.
