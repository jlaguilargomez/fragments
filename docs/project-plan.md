# Fragments — Project plan and shared context

> **Purpose:** this file is the single, quick-to-read project context for any future conversation about Fragments. Update it whenever the current iteration, goals, or significant constraints change.

## Product objective

Fragments is a calm, private digital notebook for emptying the mind with almost no friction.

The core promise is:

> Capture first, organize later.

A person should be able to express a thought and know it is safely stored, without deciding where it belongs first. Fragments can be ideas, memories, tasks, reflections, observations, quotes, or material for future writing.

An important long-term personal use is collecting memories and reflections about Marco, alongside topics such as books, work, learning, and personal ideas.

## Product principles

- **Fast capture over organisation.** Writing comes before categorising.
- **A quiet interface.** The product should feel like a notebook or journal, not a SaaS dashboard.
- **Private by default.** Fragments will eventually belong to one user and must never leak across users.
- **AI assists invisibly.** Future AI should preserve the author's voice; it must not invent or aggressively reinterpret content.
- **Learn through the code.** Architecture, decisions, and trade-offs are part of the product documentation.

## Current status — Iteration 3 complete locally, remotely, and in production preview

The local MVP supports the complete text-fragment workflow:

- Create a fragment with optional title and required content.
- Store fragments durably in SQLite.
- Read fragments chronologically by day.
- Navigate to previous and next days.
- Edit and delete fragments.
- Clear the main writing form after a successful save.
- Run API tests, type checks, and production builds.
- Run the same fragment workflow remotely through Cloudflare Workers + D1.
- Serve the Vue application and API from the same remote origin.
- Register, sign in, restore and revoke server-side sessions with HttpOnly cookies.
- Associate fragment reads and writes with the authenticated user.
- Reset individual test accounts directly in D1 without recreating the database.
- Apply a UI/UX refinement pass with a consistent type scale, shared content alignment,
  a more compact editor, responsive mobile spacing, and the branded SVG icon in the
  application shell and authentication screen.
- Verify the complete local flow for create, edit, delete, and day navigation before
  publishing the latest production preview.
- Record short voice notes in browsers with `MediaRecorder`.
- Transcribe voice uploads synchronously with Cloudflare Workers AI, discard the
  temporary audio, and store the result as a user-owned `voice` fragment.
- Keep local development on the Vite/Express proxy while reserving real voice
  transcription for the deployed Worker with the Workers AI binding.

The voice flow is implemented and passes local type checks, builds, and API tests.
The D1 migration was applied remotely, the `AI` binding is active, and the Worker
was deployed from commit `e5bc260`.

The current remote technical preview is:

`https://fragments.jlaguigom-ai.workers.dev`

It is a technical preview. Authentication and ownership are active, but email
verification and password recovery are not implemented. Only test content should
be entered.

The latest verified UI and deployment state is commit `e5bc260` on `master`.

### Current implementation

| Area | Current choice |
| --- | --- |
| Web | Vue 3, TypeScript, Vite, Composition API |
| API | Node.js/Express locally; Cloudflare Worker remotely |
| Persistence | SQLite via `better-sqlite3` locally; Cloudflare D1 remotely |
| Validation | Zod at the API boundary |
| Password storage | PBKDF2-HMAC-SHA256, 100,000 iterations, shared by Node and Workers |
| Sessions | Server-side records, token digest in D1/SQLite, 30-day HttpOnly cookie |
| Repository | npm workspaces monorepo |
| Local database | SQLite file at `apps/api/data/fragments.sqlite` |
| Remote runtime | Cloudflare Worker serving Vue assets and `/api/*` |
| Remote database | Cloudflare D1 database `fragments` |
| Main branch | `master` |
| GitHub repository | `https://github.com/jlaguilargomez/fragments` |
| Latest verified release | `e5bc260` — voice capture, Workers AI transcription, and local proxy |

The local web application normally runs on port `5173`; Vite may select the next
available port if it is occupied. Its API runs on port `3001`, with Vite proxying
`/auth` and `/fragments`. Port `3000` is deliberately avoided because it is
occupied by another local service in this environment. The remote application is
served by a same-origin Cloudflare Worker with D1.

### Published environments

A GitHub Actions workflow prepares a **visual-only demo** for GitHub Pages. It uses sample fragments and keeps edits only for the active browser session, because GitHub Pages cannot run the Express API or persist SQLite data.

Before the workflow can deploy, GitHub Pages must be enabled in the repository settings and configured to use **GitHub Actions** as its source. Expected URL once enabled:

`https://jlaguilargomez.github.io/fragments/`

The functional remote preview is deployed separately with Wrangler to:

`https://fragments.jlaguigom-ai.workers.dev`

It serves the compiled Vue assets and the Worker API. D1 migrations are applied
explicitly with `npm run db:migrate:remote -w @fragments/worker`.

## Deliberate non-goals for the current product

Do **not** add these yet:

- Email verification and password recovery.
- OpenAI/OpenRouter chat models, transcription cleanup, or AI title generation.
- Contexts, tags, folders, or hierarchical organisation.
- Semantic search, embeddings, vector databases, or chat.
- Export, cloud synchronisation, sharing, analytics, notifications, or mobile apps.

Avoid placeholder code and abstractions for these features until an iteration needs them.

## Architecture guardrails

- Keep the monorepo simple: `apps/web`, `apps/api`, `apps/worker`, `packages/server-core`, and `packages/shared`.
- Prefer small functions and components, strict TypeScript, explicit naming, and runtime validation.
- Keep transport concerns in Express or Worker routes; keep use cases separate from database queries.
- Do not add microservices, CQRS, event sourcing, generic repository frameworks, or dependency-injection containers.
- Use abstractions only when a present problem justifies them.
- If AI is added, keep providers behind a small application-facing interface, but do not create it before it is needed.

See [architecture.md](architecture.md) and the ADRs in [decisions](decisions) for the current technical rationale. The Worker deployment instructions are in the repository README.

## Roadmap

| Iteration | Outcome | Status |
| --- | --- | --- |
| 1. Core text fragments | Capture, persist, read, edit, and delete text fragments. | Complete locally and remotely |
| 2. Authentication, users, and interface refinement | Private accounts, sessions, resource ownership, and the first responsive visual system. | Complete locally and remotely |
| 3. Voice capture | Record audio and convert it to text. | Complete locally and remotely |
| 4. AI enrichment | Optional transcription cleanup and title suggestions that preserve voice. | Planned |
| 5. Contexts | Many-to-many, non-hierarchical contexts such as Marco, Work, and Books. | Planned |
| 6+. Discovery and composition | Semantic search, links, book/document generation, and experiments. | Future |

This roadmap is intentionally flexible. Change it based on real use of the app and what is learned.

## Cost and usage guardrails

The current deployment uses the free allocations of Workers, D1 and Workers AI.
The application caps voice recordings at five minutes and uploads at 10 MB, and
does not store original audio. Under Workers Free, the relevant limits are
100,000 Worker requests/day, 5 million D1 rows read/day, 100,000 D1 rows
written/day, 5 GB of D1 storage and 10,000 Workers AI neurons/day. Exceeding a
free limit makes further operations fail until the daily reset; it does not create
overage billing. Workers Paid has a $5/month minimum and usage-based charges, so
the Cloudflare account plan should be checked before enabling it. See the official
[Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/),
[D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) and
[Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)
pages.

## Recommended next conversation

The next useful product step is to decide whether test-account reset should remain a
documented D1 operation or become a user-facing “delete account” flow. After that,
the roadmap continues with optional AI enrichment: cleanup and title suggestions
that preserve the author's voice.

## How to use this document in future conversations

1. Read this file first.
2. Check the current iteration and non-goals before proposing changes.
3. Read the linked architecture and ADR documents when changing technical direction.
4. Update this file after completing an iteration or changing a material decision.
