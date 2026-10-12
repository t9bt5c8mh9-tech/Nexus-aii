# Nexus-aii

A browser-based image editor with repair tools and layered PSD export.

## Local development

Requires Node.js 20.19 or newer.

```sh
npm install
npm run dev
```

Create a production build with `npm run build`; the static site is written to
`dist/`. Run `npm run preview` to preview that build locally.

## Deploy to Cloudflare Pages

Connect this repository to Cloudflare Pages and use:

- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`

The included `wrangler.jsonc` also identifies the Pages build output directory
for Wrangler-based workflows. This browser-only app does not currently require
Workers, database, or storage bindings.

For a manual deployment, authenticate with `npx wrangler login`, create a Pages
project named `nexus-aii` in Cloudflare, then run `npm run deploy`. Configure
custom domains in the Cloudflare Pages project settings.

## Cloudflare runbook

Nexus-aii is a static site served by Cloudflare Pages, so there is no origin
server, session, cookie, WebSocket or SSE handling to configure, and no
environment variables or bindings are required. Cloudflare terminates HTTPS and
Pages redirects HTTP to HTTPS itself.

1. Build and deploy: `npm install && npm run deploy` (after `npx wrangler login`
   and creating a Pages project named `nexus-aii`).
2. Add a custom domain under Pages project > Custom domains. Cloudflare creates
   the proxied (orange cloud) CNAME record automatically.
3. SSL/TLS mode: use **Full** or **Full (strict)**. Do not use **Flexible**; it
   is not needed for Pages and can cause redirect loops if combined with an
   "Always Use HTTPS" origin redirect.
4. Caching: `public/_headers` is copied to `dist/` and sets immutable caching
   for hashed `/assets/*` and revalidation for `index.html`. No CORS headers
   are set since the app only serves same-origin static files.
