# Fragments

A calm, private-by-default digital notebook for capturing thoughts before organising them.

## Current status

The text-fragment MVP works locally and is also deployed as a remote technical
preview on Cloudflare:

- Production preview: [fragments.jlaguigom-ai.workers.dev](https://fragments.jlaguigom-ai.workers.dev)
- Health check: `/api/health`
- Remote runtime: Cloudflare Worker
- Remote database: Cloudflare D1

Authentication is not implemented yet. The remote preview is therefore public and
should only be used with test content. The next product iteration is users,
authentication, sessions and fragment ownership.

## Requirements

- Node.js 22 or newer
- npm 10 or newer

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The API runs on port 3001 and creates its durable SQLite database at `apps/api/data/fragments.sqlite`.

## Useful commands

```bash
npm run build
npm run typecheck
npm test
```

## Remote deployment with Cloudflare

The production target is Cloudflare Workers + D1. The Worker serves the built Vue
assets and the API from the same origin; D1 provides the remote SQLite database.

1. Create a free Cloudflare account, log in with `npx wrangler login` and install dependencies with `npm install`.
2. Create the database: `npx wrangler d1 create fragments`.
3. Copy the returned database ID into `apps/worker/wrangler.toml`.
4. Build the web app and apply migrations: `npm run build -w @fragments/web` and `npm run db:migrate:remote -w @fragments/worker`.
5. Deploy with `npm run deploy -w @fragments/worker`.

The current production database is already created and bound in
`apps/worker/wrangler.toml`. The database ID is configuration, not an application
secret. Do not commit API tokens or other credentials.

Use `npm run db:migrate:local -w @fragments/worker` and `npm run dev -w @fragments/worker`
to exercise the Worker and a local D1 database. The local Express API remains the
fastest development path and uses `apps/api/data/fragments.sqlite`.

## Structure

- `apps/web` — Vue application
- `apps/api` — Express API and SQLite persistence
- `apps/worker` — Cloudflare Worker, D1 adapter and Wrangler configuration
- `packages/server-core` — async use cases and persistence contracts shared by runtimes
- `packages/shared` — API-facing TypeScript types
- `docs` — architectural decisions and engineering notes

See [the architecture documentation](docs/architecture.md) for the request flow, choices, and testing approach.

Start future work with the [project plan and shared context](docs/project-plan.md).

## GitHub Pages visual demo

GitHub Pages remains a separate visual-only demo. Pushing `master` builds it through
GitHub Actions using sample fragments; edits last only for the current browser
session. It does not use the Express API, Cloudflare Worker or a persistent database.

The Cloudflare Worker URL above is the remote application preview. GitHub Pages is
kept for static visual review and does not replace the remote application.
