# Journey Through Life Ministries — Website

A fresh, static rebuild of journeythroughlifeministries.net, built to deploy on Cloudflare Workers (static assets).

## Structure

- `public/` — the actual site that gets served (HTML/CSS/JS). This is what Cloudflare deploys.
- `src/` — the source templates used to generate `public/`:
  - `src/templates/base.html` — shared header/nav/footer shell (Jinja2)
  - `src/pages/*.html` — per-page content, dropped into the shell
  - `src/assets/` — stylesheet and JS (copied as-is into `public/assets`)
  - `src/build.py` — generator script

## Editing content

1. Edit the relevant file in `src/pages/` (or `src/templates/base.html` for nav/footer changes).
2. Rebuild:
   ```bash
   pip install -r src/requirements.txt
   python3 src/build.py            # writes to jtlm-site/dist by default
   ```
   Or run the generator directly against this repo:
   ```bash
   cd src && python3 -c "
import build, os
build.ROOT = os.path.dirname(os.path.abspath('build.py'))
build.DIST = '../public'
build.main()
"
   ```
3. Commit both `src/` and the regenerated `public/` files.

## Deploying

This repo is set up for **Cloudflare Workers with static assets** (the current recommended path — Cloudflare Pages is being phased out in favor of this).

- `wrangler.jsonc` points at `public/` as the assets directory.
- Easiest: in the Cloudflare dashboard, go to **Workers & Pages → Create → Connect to Git**, pick this repo, and Cloudflare will auto-build/deploy on every push to `main`.
- Or from the command line: `npx wrangler deploy`.
- After the first deploy, add your custom domain (journeythroughlifeministries.net) under the Worker's **Settings → Domains & Routes**, and update the domain's nameservers/DNS to point at Cloudflare if it isn't already.

## Still to wire up

- **Store checkout** (`public/store.html`) — the "Shop Now" button is a placeholder. Add your real store/checkout link.
- **Donate button** (`public/donate.html`) — the PayPal button is a placeholder. Add your real PayPal button code or link.
- **Prayer request / contact forms** — currently submit via [FormSubmit.co](https://formsubmit.co) to `support@journeythroughlifeministries.net`. The first submission will land an activation email from FormSubmit that needs to be confirmed once.
