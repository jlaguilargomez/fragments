# Fragments

A calm, private-by-default notebook for capturing thoughts before organising them.

## Two environments

Fragments has a public trial and a premium deployment:

- **Trial:** use the [GitHub Pages demo](https://jlaguilargomez.github.io/fragments/) or run `npm run dev`. It requires no account or network API and stores editable text fragments in `localStorage` in the current browser. Clearing site data removes them. Voice capture is not available.
- **Premium:** use the private [Cloudflare deployment](https://fragments.jlaguigom-ai.workers.dev). It keeps the current login/session flow, browser-side note encryption, Cloudflare Worker API, D1 persistence and Workers AI voice transcription. New accounts require the invitation code configured by the owner.

The environments are intentionally independent: trial data is never copied to
Cloudflare and premium data is never loaded by the trial.

## Requirements

- Node.js 22 or newer
- npm 10 or newer

## Local development

```bash
npm install
npm run dev
```

The default command starts the offline trial at the Vite URL (normally
`http://localhost:5173`). It does not start Express or make API requests.

To run the premium flow locally with Express and SQLite instead:

```bash
npm run dev:premium
```

The local premium API runs on port 3001 and stores its database at
`apps/api/data/fragments.sqlite`.

## Useful commands

```bash
npm run build
npm run typecheck
npm test
npm run build:worker
```

## GitHub Pages

GitHub Actions builds `apps/web` with `VITE_TRIAL_MODE=true` and deploys the
static result to GitHub Pages. The site has no server component: every visitor
has an isolated browser-local trial store. It is suitable for sharing publicly,
visual review and trying the text workflow without consuming Cloudflare
requests, D1 operations or Workers AI credits.

## Premium Cloudflare deployment

The Worker serves the premium Vue build and `/api/*` from the same origin. D1
stores users, sessions and user-owned encrypted fragments; Workers AI handles
the temporary voice transcription upload.

1. Log in with `npx wrangler login` and install dependencies with `npm install`.
2. Create or use the D1 database configured in `apps/worker/wrangler.toml`.
3. Build the premium web app and apply migrations:

   ```bash
   npm run build -w @fragments/web
   npm run db:migrate:remote -w @fragments/worker
   ```

4. Configure the Worker secret before deployment:

   ```bash
   npx wrangler secret put SIGNUP_INVITE_CODE -c apps/worker/wrangler.toml
   ```

5. Deploy:

   ```bash
   npm run deploy -w @fragments/worker
   ```

When `SIGNUP_INVITE_CODE` is set, premium signup rejects requests without the
matching code while existing users can still log in. Removing the secret makes
signup public again, which keeps this restriction reversible. Never commit the
invitation code or other credentials.

Use `npx wrangler deploy --dry-run` from `apps/worker` to validate a bundle
without publishing it. Before a real deployment run the complete verification:

```bash
npm test
npm run typecheck
npm run build:worker
```

## Structure

- `apps/web` — Vue trial and premium frontend, API adapters and encryption
- `apps/api` — local Express API and SQLite persistence for premium development
- `apps/worker` — Cloudflare Worker, D1 adapter and Wrangler configuration
- `packages/server-core` — shared asynchronous use cases and repository contracts
- `packages/shared` — shared TypeScript types
- `docs` — architecture, decisions and engineering notes

See [the architecture documentation](docs/architecture.md) and
[the project plan](docs/project-plan.md) for the technical rationale.
