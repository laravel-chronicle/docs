# Laravel Chronicle Docs

This directory contains the Docusaurus site for the `laravel-chronicle/core` package documentation.

## What is here

- package documentation pages under [`docs/`](./docs)
- the homepage and custom theme styling under [`src/`](./src)
- static site assets such as the Chronicle logo and favicon under [`static/`](./static)

## Install dependencies

```bash
npm install
```

## Local development

Run the docs site locally:

```bash
npm run start
```

Build and serve the production output locally:

```bash
npm run build
npm run serve
```

## Useful scripts

- `npm run start` starts the local development server
- `npm run build` creates the production build in `build/`
- `npm run serve` serves the built site locally
- `npm run clear` clears the Docusaurus cache
- `npm run typecheck` runs TypeScript checks for the docs app

## Docs structure

The sidebar is defined in [`sidebars.ts`](./sidebars.ts).

The current information architecture is organized as:

- top-level onboarding pages
- `Foundations`
- `Guides`
- `Reference`
- `Operations`

## Updating the docs

When updating documentation for `laravel-chronicle/core`:

1. verify the behavior against the code in `../core`
2. update the relevant page under [`docs/`](./docs)
3. run `npm run build` to catch broken routes, links, and MDX issues

## Deployment

The site is hosted on Cloudflare Pages. Every push to `main` runs [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml), which builds the site and uploads `build/` to the `laravel-chronicle-docs` Pages project with Wrangler.

The workflow needs two repository secrets:

- `CLOUDFLARE_API_TOKEN` — an API token with the `Cloudflare Pages: Edit` permission
- `CLOUDFLARE_ACCOUNT_ID` — the Cloudflare account that owns the Pages project

Response headers for the hosted site are defined in [`static/_headers`](./static/_headers).
