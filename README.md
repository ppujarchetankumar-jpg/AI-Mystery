# AI Mystery Room

A fictional detective case-file experience built with React, TypeScript, Express, and a deterministic fixture provider. The project follows `spec.md` as its product contract.

## Current implementation

Milestones 0 and 1: repository foundation and a complete fixture-driven product flow. Fixture mode is deliberately labeled in the UI and API. It uses a fixed sample case so the full experience can be explored without Gemini credentials or a MongoDB instance.

The sample flow includes case creation with scenario/settings review, safe generation progress, a four-suspect/eight-evidence investigation, type-specific artifact renderers, public timeline, reviewed evidence, private-to-session notes, final accusation with up to three cited items, deterministic server-side scoring, and a gated solution/results page. A demo session is established through the login screen. API state is in memory and resets when the API restarts.

**Fixture-mode limitation:** demo login is not production authentication, and fixture cases/session state are not durable. MongoDB persistence, password hashing, durable sessions, generation worker leases/recovery, live Gemini and media adapters, ownership isolation between real users, and production security are later milestones and are not represented as completed.

## Requirements

- Node.js 22 or later
- npm 10 or later
- No MongoDB or AI credentials needed for fixture mode

## Setup

```powershell
npm install
npm run dev
```

Open `http://localhost:5173`. Select **Sign in**, enter any email address, and use the demo. The API runs at `http://localhost:4000`; `GET /api/health` reports the active fixture mode.

## Commands

```powershell
npm run dev        # API and web app
npm run build      # production builds
npm run typecheck  # strict TypeScript checks
npm test           # fixture/privacy/scoring and UI tests
npm run lint       # strict TypeScript static checks
```

The lint command currently runs the strict TypeScript checks; ESLint rules are deferred with the later foundation hardening work.

## Project layout

```text
apps/api/       Express API and fixture-only domain service
apps/web/       React application and case-file UI
packages/shared Shared TypeScript contracts and request schemas
spec.md         Authoritative product and implementation specification
```

## Configuration and safety

`.env.example` documents the intended MongoDB, session, Gemini, media, and generation configuration for later milestones. Live provider calls are not implemented in this phase. The browser never imports fixture truth data; solution material is confined to the API fixture module and the result route requires a persisted-in-process accusation before revealing it. Do not deploy fixture auth or in-memory storage as a production service.
