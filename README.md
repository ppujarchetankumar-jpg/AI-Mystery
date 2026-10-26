# AI Mystery Room

A fictional detective case-file experience built with React, TypeScript, Express, and a deterministic fixture provider. `spec.md` is the product and engineering contract.

## Current implementation and limits

The app currently implements a fixture-driven product flow. It uses a fixed sample case and demo sign-in; no Gemini calls or MongoDB are used. Session and case state are held in process memory, so deploy restarts clear data, and a single running API instance is required. Demo sign-in does not verify identities or passwords. Case data is isolated between demo sessions, but this is not production authentication or durable storage. The Render setup below is for a shareable demo, not a production launch. Do not enter private information.

MongoDB persistence, real authentication, durable sessions, generation workers, and live Gemini/media adapters remain future work. The visible fixture-mode labels are intentional.

## Run locally

Requirements: Node.js 22 or later and npm 10 or later.

```powershell
npm install
npm run dev
```

Open <http://localhost:5173>, choose **Sign in**, and enter any email for the demo. The Vite development server proxies `/api` requests to Express on port 4000. `GET /api/health` reports the active fixture mode.

Optional local environment setup:

```powershell
Copy-Item .env.example .env
```

## Deploy a demo to Render

The included `render.yaml` builds the React site and Express API together as one Node web service. Express serves the built site and API from the same HTTPS origin, which keeps the session cookie same-site. Render generates `SESSION_SECRET` for the service.

1. Commit and push this project to a GitHub repository. Do not commit `.env` or paste its values into deployment settings; it is ignored by Git.
2. Sign in to Render and choose **New → Blueprint**. Connect the repository and select the branch to deploy.
3. Review the `ai-mystery-room-demo` service from `render.yaml`. The blueprint sets the Node version from `.node-version`, builds with `npm ci && npm run build`, starts with `npm start`, and checks `/api/health`.
4. Apply the blueprint. Let the first build and deploy finish. Render assigns a public `onrender.com` URL.
5. Open that URL, sign in with any email, and create a case. Check `<your-service-url>/api/health` if the page does not load; a healthy fixture API returns JSON with `status: "ok"` and `mode: "fixture"`.
6. To publish an update, push a commit to the connected branch. Render rebuilds and deploys it.

The blueprint uses Render's free web service plan, which can spin down while idle; the first request afterward may take a little time. Availability and plan behavior can change. See Render's current [Node/Express deployment guide](https://render.com/docs/deploy-node-express-app), [Blueprint reference](https://render.com/docs/blueprint-spec), and [environment variable guide](https://render.com/docs/configure-environment-variables).

## Before a production launch

This deployment is a demo only. A restart, redeploy, or instance replacement loses all sessions and cases. Do not scale to multiple instances: the in-memory session store and case map are not shared. The app does not yet implement durable storage, real account authentication, production CSRF protection, or background workers. Follow the production topology and security requirements in `spec.md` before treating it as a production service.

## Commands

```powershell
npm run dev        # API and web app
npm run build      # production builds
npm run typecheck  # strict TypeScript checks
npm test           # fixture/privacy/scoring and UI tests
npm run lint       # strict TypeScript static checks
```

The lint command currently runs strict TypeScript checks; ESLint rules are deferred. See `spec.md` for the complete product contract and implementation milestones.

## Project layout

```text
apps/api/       Express API and fixture-only domain service
apps/web/       React application and case-file UI
packages/shared Shared TypeScript contracts and request schemas
spec.md         Authoritative product and implementation specification
render.yaml     Render Blueprint for a single-service demo deployment
```
