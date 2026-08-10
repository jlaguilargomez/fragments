# Fragments

A small, private-by-default digital notebook for capturing thoughts before organising them.

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

## Structure

- `apps/web` — Vue application
- `apps/api` — Express API and SQLite persistence
- `packages/shared` — API-facing TypeScript types
- `docs` — architectural decisions and engineering notes

See [the architecture documentation](docs/architecture.md) for the request flow, choices, and testing approach.

Start future work with the [project plan and shared context](docs/project-plan.md).

## Visual demo on GitHub Pages

Pushing `master` builds a static visual demo through GitHub Actions. The Pages version uses sample fragments and keeps any edits only for the current browser session; it does not include the Express API or persistent SQLite database.
