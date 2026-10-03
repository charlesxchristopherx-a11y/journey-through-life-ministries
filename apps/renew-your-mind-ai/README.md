# Renew Your Mind

Renew Your Mind is a small, privacy-conscious Christian reflection tool built for Journey In His Word. A visitor can enter a difficult thought in ordinary language and receive a five-part reflection:

1. Thought
2. Truth
3. Scripture (KJV only)
4. Declaration
5. A small AI-generated action

The app runs as one Cloudflare Worker with static assets, a Workers AI binding, and a rate-limiting binding. The browser never receives an AI credential.

## Safety and Scripture design

- The model can select only from a curated library of verified KJV passages. It cannot supply or invent the displayed Bible text.
- Model output is validated and rendered as plain text.
- The generated action is constrained to small, low-risk steps. The prompt excludes treatment changes, dangerous behavior, major life decisions, financial giving, secrecy, and claims of guaranteed outcomes.
- Explicit self-harm language is intercepted before the AI call and routed to immediate human support resources.
- The application does not save a visitor's thought. Do not add request-body logging.
- This is a reflection tool, not medical care, crisis care, or a substitute for professional support.

## Local development

```bash
npm install
npm test
npm run dev
```

Workers AI usage in local development still uses the connected Cloudflare account.

## Deploy

```bash
npm run check
npm run deploy
```

The included `wrangler.jsonc` creates:

- Static Assets binding: `ASSETS`
- Workers AI binding: `AI`
- Rate Limiting binding: `AI_RATE_LIMITER` (6 requests per 60 seconds per client key and Cloudflare location)

For Git-based deployment, connect this repository under **Workers & Pages → Create application → Import a repository** in the Cloudflare dashboard. Use `npm run deploy` as the deploy command. The Worker will receive a public `workers.dev` address; a custom domain can be attached later without changing the application.

## Content updates

- Example thoughts are in `public/app.js`.
- Verified KJV passages and matching themes are in `src/verses.js`.
- AI behavior and action guardrails are in `src/index.js`.

## License

Application code is provided under the MIT License. Scripture quotations are from the King James Version.
