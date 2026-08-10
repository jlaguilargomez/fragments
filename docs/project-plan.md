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

## Current status — Iteration 1 complete locally

The local MVP supports the complete text-fragment workflow:

- Create a fragment with optional title and required content.
- Store fragments durably in SQLite.
- Read fragments chronologically by day.
- Navigate to previous and next days.
- Edit and delete fragments.
- Clear the main writing form after a successful save.
- Run API tests, type checks, and production builds.

### Current implementation

| Area | Current choice |
| --- | --- |
| Web | Vue 3, TypeScript, Vite, Composition API |
| API | Node.js, Express, TypeScript |
| Persistence | SQLite via `better-sqlite3` |
| Validation | Zod at the API boundary |
| Repository | npm workspaces monorepo |
| Main branch | `master` |
| GitHub repository | `https://github.com/jlaguilargomez/fragments` |

The local web application runs on port `5173`; its API runs on port `3001`. Port `3000` is deliberately avoided because it is occupied by another local service in this environment.

### Published visual demo

A GitHub Actions workflow prepares a **visual-only demo** for GitHub Pages. It uses sample fragments and keeps edits only for the active browser session, because GitHub Pages cannot run the Express API or persist SQLite data.

Before the workflow can deploy, GitHub Pages must be enabled in the repository settings and configured to use **GitHub Actions** as its source. Expected URL once enabled:

`https://jlaguilargomez.github.io/fragments/`

## Deliberate non-goals for the current MVP

Do **not** add these to Iteration 1:

- Authentication, users, or authorisation.
- Voice recording or speech-to-text.
- OpenAI, OpenRouter, LLMs, or AI title generation.
- Contexts, tags, folders, or hierarchical organisation.
- Semantic search, embeddings, vector databases, or chat.
- Export, cloud synchronisation, sharing, analytics, notifications, or mobile apps.

Avoid placeholder code and abstractions for these features until an iteration needs them.

## Architecture guardrails

- Keep the monorepo simple: `apps/web`, `apps/api`, and `packages/shared`.
- Prefer small functions and components, strict TypeScript, explicit naming, and runtime validation.
- Keep transport concerns in Express routes; keep use cases separate from SQLite queries.
- Do not add microservices, CQRS, event sourcing, generic repository frameworks, or dependency-injection containers.
- Use abstractions only when a present problem justifies them.
- If AI is added, keep providers behind a small application-facing interface, but do not create it before it is needed.

See [architecture.md](architecture.md) and the ADRs in [decisions](decisions) for the current technical rationale.

## Roadmap

| Iteration | Outcome | Status |
| --- | --- | --- |
| 1. Core text fragments | Capture, persist, read, edit, and delete text fragments. | Complete locally |
| 2. Authentication and users | Private accounts, sessions, and resource ownership. | Next major iteration |
| 3. Voice capture | Record audio and convert it to text. | Planned |
| 4. AI enrichment | Optional transcription cleanup and title suggestions that preserve voice. | Planned |
| 5. Contexts | Many-to-many, non-hierarchical contexts such as Marco, Work, and Books. | Planned |
| 6+. Discovery and composition | Semantic search, links, book/document generation, and experiments. | Future |

This roadmap is intentionally flexible. Change it based on real use of the app and what is learned.

## Recommended next conversation

The next implementation conversation should normally start **Iteration 2: authentication and users**. Before coding, decide:

1. The hosting target for the production API and database.
2. The authentication approach (session cookies versus tokens) based on that target.
3. The minimum user experience: sign-up, sign-in, and one user's isolated fragments.

As part of Iteration 2, create learning notes on authentication versus authorization, session cookies versus tokens, and resource ownership before or alongside the implementation.

## How to use this document in future conversations

1. Read this file first.
2. Check the current iteration and non-goals before proposing changes.
3. Read the linked architecture and ADR documents when changing technical direction.
4. Update this file after completing an iteration or changing a material decision.
