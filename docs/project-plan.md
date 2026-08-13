# Fragments — Project plan and shared context

> **Purpose:** this file is the single, quick-to-read project context for any future conversation about Fragments. Update it whenever the current iteration, goals, or significant constraints change.

## Product objective

Fragments is a calm, private digital notebook for emptying the mind with almost no friction.

The core promise is:

> Capture first, organize later.

A person should be able to express a thought and know it is safely stored, without deciding where it belongs first. Fragments can be ideas, memories, tasks, reflections, observations, quotes, or material for future writing.

An important long-term personal use is collecting memories and reflections, alongside topics such as books, work, learning, and personal ideas.

## Product principles

- **Fast capture over organisation.** Writing comes before categorising.
- **A quiet interface.** The product should feel like a notebook or journal, not a SaaS dashboard.
- **Private by default.** Fragments belong to one user, and note titles and content are encrypted in the browser before persistence.
- **AI assists invisibly.** Future AI should preserve the author's voice; it must not invent or aggressively reinterpret content.
- **Learn through the code.** Architecture, decisions, and trade-offs are part of the product documentation.

## Current status — Trial and premium environments

The local MVP supports the complete text-fragment workflow:

- The default `npm run dev` command runs an offline trial with no login or API.
- Trial text fragments persist in versioned browser `localStorage`; GitHub Pages
  uses the same static mode and never consumes Cloudflare resources.
- `npm run dev:premium` runs the authenticated Express/SQLite version locally.

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
- Add a minimal Help screen in the application shell with usage guidance, current
  capabilities, known limitations, privacy notes, and an undated proposed roadmap.
- Verify the complete local flow for create, edit, delete, and day navigation before
  publishing the latest production preview.
- Record short voice notes in browsers with `MediaRecorder`.
- Transcribe voice uploads synchronously with Cloudflare Workers AI, discard the
  temporary audio, and store the result as a user-owned `voice` fragment.
- Keep local development on the Vite/Express proxy while reserving real voice
  transcription for the deployed Worker with the Workers AI binding.
- Encrypt note titles and content in the browser with AES-GCM using a key derived
  from the user's password; the API and D1 store ciphertext only for new or migrated notes.
- Migrate legacy plaintext notes lazily when the authenticated user opens their day.
- Keep the encryption key in browser memory only; a fresh tab or browser restart requires
  the user to authenticate again before notes can be read.

The voice flow and client-side note encryption are implemented and pass local type
checks, builds, and API tests. The D1 migration was applied remotely, the `AI`
binding is active, and the Worker was deployed from commit `1a07924`.

The premium deployment is:

`https://fragments.jlaguigom-ai.workers.dev`

It is private by invitation. Authentication and ownership are active, but email
verification and password recovery are not implemented. Losing the account password
also loses access to encrypted notes. Existing notes become encrypted progressively
when opened after this release. Voice transcription remains a privacy exception:
audio and the resulting text are visible to the Worker/Workers AI before the result
is encrypted in the browser.

The latest verified UI and deployment state is commit `1a07924` on `master`.

### Current implementation

| Area | Current choice |
| --- | --- |
| Web | Vue 3, TypeScript, Vite, Composition API |
| API | Node.js/Express locally; Cloudflare Worker remotely |
| Persistence | Browser `localStorage` for trial; SQLite locally and Cloudflare D1 remotely for premium |
| Validation | Zod at the API boundary |
| Password storage | PBKDF2-HMAC-SHA256, 100,000 iterations, shared by Node and Workers |
| Note encryption | Browser AES-GCM; PBKDF2-derived key with 250,000 iterations; key is never sent to the API |
| Sessions | Server-side records, token digest in D1/SQLite, 30-day HttpOnly cookie |
| Repository | npm workspaces monorepo |
| Local database | SQLite file at `apps/api/data/fragments.sqlite` |
| Remote runtime | Cloudflare Worker serving Vue assets and `/api/*` |
| Remote database | Cloudflare D1 database `fragments` |
| Main branch | `master` |
| GitHub repository | The repository URL is maintained by the project owner. |
| Latest verified release | `1a07924` — client-side end-to-end note encryption |

The trial web application normally runs on port `5173`; Vite may select the next
available port if it is occupied. Premium local development additionally runs
Express on port `3001`, with Vite proxying `/auth` and `/fragments`. The remote
premium application is served by a same-origin Cloudflare Worker with D1.

### Published environments

A GitHub Actions workflow prepares the **offline trial** for GitHub Pages. It
seeds welcome fragments once and persists edits in each visitor's browser.

Before the workflow can deploy, GitHub Pages must be enabled in the repository settings and configured to use **GitHub Actions** as its source. Expected URL once enabled:

The GitHub Pages URL is maintained by the project owner and deployment settings.

The premium application is deployed separately with Wrangler to:

`https://fragments.jlaguigom-ai.workers.dev`

It serves the compiled Vue assets and the Worker API. D1 migrations are applied
explicitly with `npm run db:migrate:remote -w @fragments/worker`. Setting the
`SIGNUP_INVITE_CODE` Worker secret closes public registration without changing
login or account persistence.

## Deliberate non-goals for the current product

Do **not** add these yet:

- Email verification and password recovery.
- Password reset or server-side recovery of encrypted notes without a user-held recovery key.
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
| 3a. Help and product guidance | Explain the current workflow, capabilities, limitations, privacy notes, and proposed future direction. | Complete locally and remotely |
| 3b. Client-side note encryption | Encrypt note titles and content before API persistence; migrate legacy notes progressively. | Complete locally and remotely |
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
