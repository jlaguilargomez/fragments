# Fragments

A calm, private-by-default digital notebook for capturing thoughts before organising them.

## Current status

The authenticated text-and-voice fragment MVP works locally and is deployed as a
remote technical preview on Cloudflare:

- Production preview: [fragments.jlaguigom-ai.workers.dev](https://fragments.jlaguigom-ai.workers.dev)
- Health check: `/api/health`
- Remote runtime: Cloudflare Worker
- Remote database: Cloudflare D1
- Authentication: local accounts with 30-day HttpOnly session cookies
- Ownership: every fragment is scoped to its authenticated user
- UI: responsive Vue interface with balanced type scale, compact writing flow and branded SVG icon
- Help: a responsive in-app help screen covering usage, current capabilities, limitations and roadmap
- Voice capture: browser `MediaRecorder`, synchronous Workers AI Whisper transcription, temporary audio only
- Latest deployment: commit `e5bc260` deployed to Cloudflare Workers

Authentication is implemented with local accounts, server-side sessions and
fragment ownership. Email verification and password recovery are not included yet.
Passwords use PBKDF2-HMAC-SHA256 with 100,000 iterations, the highest count
accepted by the current Cloudflare Workers Web Crypto runtime.

## Requirements

- Node.js 22 or newer
- npm 10 or newer

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL printed by `npm run dev` (normally `http://localhost:5173`). The
API runs on port 3001 and creates its durable SQLite database at
`apps/api/data/fragments.sqlite`. In local development, Vite proxies `/auth` and
`/fragments` to Express; the local API does not provide Workers AI transcription.
The Help screen is available from the top bar after signing in. To inspect the
interface without an account, run `VITE_VISUAL_DEMO=true npm run dev -w
@fragments/web -- --host 127.0.0.1`.

## Useful commands

```bash
npm run build
npm run typecheck
npm test
npm run build:worker
```

## Remote deployment with Cloudflare

The production target is Cloudflare Workers + D1. The Worker serves the built Vue
assets and the API from the same origin; D1 provides the remote SQLite database.

1. Create a free Cloudflare account, log in with `npx wrangler login` and install dependencies with `npm install`.
2. Create the database: `npx wrangler d1 create fragments`.
3. Copy the returned database ID into `apps/worker/wrangler.toml`.
4. Build the web app and apply migrations: `npm run build -w @fragments/web` and `npm run db:migrate:remote -w @fragments/worker`.
5. Deploy with `npm run deploy -w @fragments/worker`.

Before a production deployment, run the complete verification sequence:

```bash
npm test
npm run typecheck
npm run build:worker
npm run deploy -w @fragments/worker
```

Use `npx wrangler deploy --dry-run` from `apps/worker` to validate the Worker
bundle and static assets without publishing a new version.

The current production database is already created and bound in
`apps/worker/wrangler.toml`. The database ID is configuration, not an application
secret. Do not commit API tokens or other credentials.

### Free-plan guardrails

Fragments currently uses Cloudflare Workers, D1 and Workers AI on their free
allocations. The voice flow limits each recording to five minutes and each upload
to 10 MB, and discards the audio after transcription. Under Workers Free, the
relevant daily limits are 100,000 Worker requests, 5 million D1 rows read,
100,000 D1 rows written, 5 GB of D1 storage and 10,000 Workers AI neurons. Free
plan limits fail closed when exceeded and reset daily; they do not create paid
overage charges. Workers Paid has a $5/month minimum and can charge for usage
above included allocations, so verify the account plan under Cloudflare Billing
before enabling it. See the [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/),
[D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) and
[Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
documentation.

Use `npm run db:migrate:local -w @fragments/worker` and `npm run dev -w @fragments/worker`
to exercise the Worker and a local D1 database. The local Express API remains the
fastest development path and uses `apps/api/data/fragments.sqlite`.

For test environments, remove only anonymous content without recreating the
database:

```sql
DELETE FROM fragments WHERE user_id IS NULL;
```

To completely reset one test account, replace `TU_EMAIL` and run the following
against the remote D1 database. This removes its sessions, fragments and account:

```bash
npx wrangler d1 execute fragments --remote --command \
"DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email = 'TU_EMAIL');
 DELETE FROM fragments WHERE user_id IN (SELECT id FROM users WHERE email = 'TU_EMAIL');
 DELETE FROM users WHERE email = 'TU_EMAIL';"
```

This operation is irreversible and should never be used for a real account without
an explicit backup or confirmation.

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
