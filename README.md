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
