
AI Mystery Room — Single Source of Truth Specification
Document type: Product + Software Requirements + Technical Design Specification (SDD/SRS)
Status: Authoritative implementation contract for Codex
Version: 1.0
Last reviewed: 2026-10-25
Product name: AI Mystery Room
Primary stack: MongoDB, Express, React, Node.js (MERN)
AI provider: Google Gemini through the official @google/genai JavaScript/TypeScript SDK

Instruction to Codex: Treat this file as the authoritative source of truth for the project. Read it before changing code. Implement the requirements, invariants, API contracts, and acceptance criteria below. If the existing repository conflicts with this document, preserve existing working code where practical but update it to comply with this document. Do not silently invent product behavior. If a provider API, model, SDK, or hosting capability has changed, isolate the change behind an adapter and update this document's relevant section and the tests before relying on it. Do not mark a phase complete until its acceptance criteria pass.

1. Product Overview
AI Mystery Room is a single-player, AI-generated fictional investigation website. A user submits a short scenario or story. The backend uses Gemini to create a self-consistent mystery case with suspects, a known culprit, a timeline, and evidence artifacts such as chat transcripts, images, CCTV-style stills, timestamped events, witness statements, and documents. The player inspects the evidence, takes notes, and submits a final accusation. Only after the final accusation may the system reveal the culprit, explanation, and evidence chain.

The experience should feel like a polished digital detective case file—not a generic chatbot. The AI is a case author, not a live oracle that changes the solution during play. Each case must have one fixed intended solution before the player enters the investigation.

1.1 Product promise
Turn a short fictional premise into an engaging, solvable investigation.
Give the player believable, readable evidence that can be inspected and compared.
Ensure there is exactly one intended culprit, with enough evidence to infer the answer.
Keep the answer and all hidden truth metadata private until the player commits to a final accusation.
Work reliably even when AI generation or media generation is slow, rate-limited, or fails.
1.2 Core game loop
The user signs in or creates an account.
The user enters a scenario and chooses optional settings.
The server creates a generation job and builds the complete case.
The server validates the case and its solution; invalid cases are repaired or failed, never playable.
The player opens the ready case and sees the briefing and suspects.
The player explores evidence, marks items as reviewed, and writes private notes.
The player chooses one suspect and optionally cites evidence/reasoning, then submits a final accusation.
The server calculates the score and returns the result plus the full solution.
The case remains available in My Cases, with its state and final result saved.
1.3 Definitions
Case: A single generated mystery, including its public briefing, suspects, evidence, and protected solution.
Public case data: Information permitted to be sent to the browser before a final accusation.
Truth/solution data: Culprit ID, motive, method, hidden canonical facts, evidence interpretations, clue importance, acceptable supporting evidence IDs, and the final explanation.
Evidence item: A public artifact a player can inspect.
Critical clue: An evidence item that supports the intended solution. This classification is private until the result is revealed.
Red herring: A plausible but ultimately non-decisive detail that does not contradict the canonical truth.
Generation job: Server-side asynchronous work that builds and validates a case.
Ready case: A case whose text, suspects, evidence IDs, media references, and solution have passed validation and have been atomically committed.
2. Scope
2.1 MVP — must ship
Responsive web application built with React and TypeScript.
Express + Node.js API written in TypeScript.
MongoDB persistence via Mongoose or an equally well-supported typed persistence layer.
Account registration, login, logout, and server-side sessions.
Scenario form with genre, difficulty, and optional media settings.
Background case-generation job with progress/status polling and recoverable failures.
Gemini text generation using the official @google/genai SDK from the server only.
Structured JSON generation with schema validation and additional semantic/logic validation.
Fixed culprit and solution persisted before a case is marked ready.
At least 4 suspects and 8 evidence items per ready case.
Evidence types: chat transcript, witness statement, document/report, timeline/CCTV event log, and image or CCTV-style still where image generation is available.
Evidence viewer, suspect dossiers, chronology/timeline view, evidence discovery tracking, private notes, final accusation, results/solution reveal, and My Cases listing.
Server-side scoring using deterministic rules.
Deletion of an owned case and its related evidence, solution, job records, and media references.
Strong solution-secrecy guarantees and authorization checks.
Unit, integration, and end-to-end tests; an AI mock/provider fake for test runs.
.env.example, setup instructions, README, and maintainable source structure.
2.2 MVP media behavior
All visible evidence should be represented as fictional artifacts. The first release must not depend on real video generation to make a playable case. “CCTV recording” can be a visually styled CCTV viewer containing an AI-generated still or several still frames, camera label, timestamp, and a concise event log. Do not label a still image as a playable video. If a supported video-generation provider/model is configured and passes a startup capability/configuration check, real short clips may be enabled behind a provider adapter. A missing video capability must gracefully fall back to stills and a timestamped transcript.

Image generation is also adapter-based. A case must remain playable when image generation is disabled, temporarily unavailable, or over budget; use a clearly marked designed placeholder with evidence metadata, not a broken image icon. Do not silently pass private truth/solution text directly into public media prompts.

2.3 Explicitly out of scope for MVP
Multiplayer/co-op investigations or live chat between players.
Public case marketplace or sharing links that expose private cases.
Leaderboards, subscriptions, purchases, payments, and in-app currency.
User-uploaded real surveillance footage or real-person identity investigation.
Fully generated long-form video, voice acting, or interactive 3D scenes.
AI-based open-ended answer scoring or an AI chatbot that can reveal clues on demand.
Mobile native apps.
Admin content marketplace and creator tooling.
Build these only after the MVP is stable and the core acceptance criteria pass.

3. Product Principles and Non-Negotiable Invariants
These requirements take precedence over implementation convenience.

3.1 Truth invariants
TRUTH-01 — One culprit: Every playable case has exactly one intended culprit among the listed suspects.

TRUTH-02 — Fixed before play: The full truth model and final explanation are generated, validated, and persisted before the case transitions to ready.

TRUTH-03 — Immutable truth: Once ready, the culprit, canonical timeline, motive, method, and truth-to-evidence mapping cannot be changed by later AI calls or normal gameplay actions. A case repair must create a new generation version and must not modify a case that has already been played.

TRUTH-04 — Solvable: The case must contain at least 3 independent, mutually consistent supporting evidence items pointing to the culprit. They must cover at least two distinct reasoning dimensions, such as opportunity, timeline contradiction, access, physical/digital trace, or witness inconsistency. No essential inference may rely on information absent from the case.

TRUTH-05 — Plausible alternative: At least one alternative suspect and one red herring should initially be plausible. Red herrings must be explained in the final solution and must not falsify the canonical truth.

TRUTH-06 — Stable IDs: Suspect and evidence IDs are generated by the application or validated as stable unique IDs. All internal references must resolve to existing IDs.

3.2 Anti-spoiler invariants
SECRET-01 — Separate storage: Store the solution/truth document in a separate MongoDB collection from the public case and public evidence records. Do not put the culprit ID, hidden clue labels, private truth notes, accepted evidence IDs, or solution text into public case documents.

SECRET-02 — Explicit DTOs: All API responses must be built using explicit public Data Transfer Objects (DTOs) or allowlisted serializers. Never return raw Mongoose documents for cases, evidence, sessions, or generation jobs.

SECRET-03 — No premature reveal: Before final accusation, every normal case, evidence, notes, status, job, and session endpoint must omit solution fields. A client request must not be able to request extra fields through query parameters, GraphQL-like syntax, populate, or mass assignment.

SECRET-04 — Server-only scoring: Clue importance and scoring are computed on the server from private truth data. The browser may display the final score but must not calculate or supply authoritative score components.

SECRET-05 — Reveal gate: Only the successful final-accusation flow may request solution data. It must verify case ownership, that the case is ready, and that no final accusation has already been committed. A separate result endpoint may return the solution only after a persisted completed accusation exists for the authenticated owner.

SECRET-06 — No indirect leaks: Hidden truth must not be exposed by frontend bundles, hydration data, source maps, browser storage, error messages, request IDs, logs visible to the client, media URLs/metadata, filenames, alt text, generation status messages, or API timing/status differences beyond unavoidable infrastructure variation.

SECRET-07 — No AI calls during play that reveal answers: Normal evidence exploration must not call Gemini to answer user questions about the mystery. Case content is generated up front. Any future hint system must be a separately designed feature with bounded, progressive hints and tests for leakage.

3.3 Product and integrity invariants
AI-generated names, locations, chats, photos, and reports are fictional. UI must display a discreet “Fictional AI-generated case” label.
Do not suggest that fictional chat logs or imagery are authentic evidence from real events.
User content is untrusted data. It must not override system generation instructions, request secrets, or change application policy.
Failed or partially generated cases must never appear as playable.
Retrying media generation must not change the culprit or canonical truth.
Deleting a case must also remove all child records and media references owned by that case.
4. Target Users and Primary User Stories
4.1 Target user
A curious person who enjoys detective stories, puzzle games, escape rooms, crime fiction, and interactive narratives. The user should not need knowledge of programming, forensics, or AI to enjoy a case.

4.2 User stories
US-01: As a user, I can turn a short fictional idea into an investigation without writing all the suspects and evidence myself.
US-02: As a user, I can select a genre and difficulty so the mystery suits my mood and experience.
US-03: As a user, I can see clear generation progress and know whether my case is ready, still processing, or failed.
US-04: As a user, I can inspect suspects and evidence artifacts individually, including their source, timestamp, and related events where available.
US-05: As a user, I can record private notes without revealing them to other users.
US-06: As a user, I can track which evidence I have reviewed and revisit it at any time.
US-07: As a user, I can choose a culprit and submit a final accusation only when I am ready.
US-08: As a user, I see whether my accusation was correct, my score, and a clear explanation of how the evidence resolves the mystery.
US-09: As a user, I can return to my cases later, continue an unfinished investigation, and open completed results.
US-10: As a user, I can delete a case I no longer want stored.
5. Experience and Information Architecture
5.1 Design direction
Use a premium, cinematic detective-workspace aesthetic, not a horror interface. A recommended default is charcoal/navy surfaces, warm paper-like evidence panels, restrained amber highlights, legible typography, subtle borders, and generous spacing. Avoid excessive neon, flashing lights, noisy animations, or tiny evidence text. The visual style must remain accessible and readable on mobile.

Use a shared design system: spacing scale, typography scale, button/input styles, surface and text tokens, focus styles, status badges, modal behavior, empty states, and error states. Prefer CSS variables/design tokens to scattered hex values. Use iconography consistently; do not rely on color alone to communicate a status.

5.2 Routes/pages
/ — Landing page with product explanation, primary “Create a Mystery” action, examples, and clear fictional-content positioning.
/register and /login — Account entry pages.
/cases — My Cases dashboard, showing generating, ready, in-progress, and completed cases with timestamps and actions.
/cases/new — Scenario creation wizard/form.
/cases/:caseId/generating — Job progress, safe progress labels, retry guidance, and return-to-dashboard action.
/cases/:caseId — Investigation workspace (briefing, suspects, evidence, timeline, notes, and accusation action).
/cases/:caseId/results — Final result and solution; inaccessible as a reveal page until a final accusation has been saved.
A not-found page and a reusable error boundary.
5.3 Create Mystery form
Required field:

scenario: 50–1,500 characters after trimming. The helper text should recommend fictional names and details, and explain that the AI will use the idea as inspiration, not necessarily preserve every sentence verbatim.
Optional fields with defaults:

genre: classic_detective | heist | missing_object | campus_mystery | sci_fi | thriller (default classic_detective). Keep any sensitive/horror settings out of MVP.
difficulty: easy | medium | hard (default medium).
includeImages: boolean (default true if provider configured).
includeCctvStills: boolean (default true).
Do not let the user supply a culprit, solution, system prompt, raw model ID, media-provider URL, or arbitrary generation parameters.

Show a review step before submission with the normalized scenario and selected settings. Disable duplicate submit while a request is in flight. Display validation messages next to the relevant control.

5.4 Generation progress
Use real job state, not an invented percentage. Display a step-oriented progress indicator with safe public stages such as:

Validating scenario
Building the case
Checking timeline and evidence
Creating evidence visuals
Finalizing case file
The UI may map server states to labels, but must not display culprit, private facts, hidden clue importance, or raw prompts. A generation job can remain in progress while an AI provider is slow. Poll with bounded exponential backoff (approximately 1–2 seconds initially, increasing to at most 5 seconds), pause polling when the tab is hidden when practical, and stop when a terminal state is received.

5.5 Investigation workspace
Use a desktop layout with a navigation rail/sidebar and evidence work area, adapting to stacked tabs/drawers on mobile. Required sections:

Case Briefing: public incident summary, location, time window, case rules, fictional-content label.
Suspects: suspect cards with name, portrait if available, role, public biography, known relationship to incident, and visible statements/alibis. Never show hidden reasoning labels.
Evidence Locker: filter by type, sort by time/title, unread/reviewed state, and evidence cards.
Evidence Viewer: selected artifact rendered as a chat transcript, image viewer, CCTV still/frame viewer, timeline event, report/document, or witness statement. Show source, date/time, and context when applicable.
Timeline: chronologically ordered public events, including unknown/approximate times explicitly labelled as such. It must not silently invent exact timestamps.
Notes: private plain-text investigation notes saved for this user/case. Notes are not shared or sent to Gemini.
Final Accusation: a deliberate action with a confirmation step. The confirmation states that this submits the final answer and cannot be changed in MVP.
Do not hide essential evidence solely behind hover interactions or color. All evidence interactions must be keyboard accessible.

5.6 Evidence types
At minimum support these public type values:

chat_transcript: fictional messages rendered in a familiar messaging layout. Do not use WhatsApp logos or imply the transcript is authentic. Use neutral “Chat Transcript” branding or an explicitly fictional imitation.
image: a generated photo/still of a location, object, or fictional character. Add accessible alt text and an AI-generated label.
cctv_stills: one or more still frames with camera ID, timestamps, and an event summary. Provide controls to step through the stills; do not claim it is a video file.
cctv_log: timestamped camera events and possible blind spots or recording gaps.
witness_statement: a first-person statement with the statement time/source.
document: memo, receipt, schedule, report, access log, or other text-based document.
timeline_event: a public event with a timestamp or time range and a source.
Use at least 8 total evidence items in a ready case. Target 8–12. Text evidence is mandatory; generated image or video output is optional based on provider configuration. Evidence must be distinct and useful—do not pad with repetitive artifacts.

5.7 Accusation and results
The player must select one of the actual listed suspects. They may optionally:

Select up to 3 evidence items they believe support the accusation.
Enter a short explanation (0–1,000 characters).
Confirmation modal must summarize the selected suspect and state “Submit final accusation”. After server confirmation, lock the accusation, mark the investigation completed, and navigate to results. Do not reveal anything before the final submission succeeds.

The results page shows:

Correct/incorrect outcome.
Culprit’s identity.
Full concise explanation: motive, method, opportunity, and relevant timeline.
Canonical timeline.
Evidence-by-evidence interpretation: supporting clues, misleading clues, and how contradictions are resolved.
Score and deterministic score breakdown.
Actions to view the case file and return to My Cases.
If the accusation request fails before a final result is persisted, keep the selection and allow a safe retry. If the server persisted the result but the client lost the response, a subsequent result request must retrieve the same result, not submit a second accusation.

6. Functional Requirements
6.1 Account and ownership
FR-AUTH-01: Register, log in, and log out users.
FR-AUTH-02: Hash passwords using a modern password-hashing algorithm such as Argon2id; never store plaintext passwords.
FR-AUTH-03: Use server-side sessions and secure cookies; do not store session tokens in localStorage.
FR-AUTH-04: All case, note, evidence-discovery, and result endpoints must verify owner identity. A user cannot access or mutate another user's records by guessing IDs.
FR-AUTH-05: Rate-limit login and registration endpoints. Return generic authentication errors that do not reveal whether an email address is registered.
6.2 Case creation and generation
FR-GEN-01: Validate input on server, regardless of client validation.
FR-GEN-02: Create a case record and generation job, then return 202 Accepted; the request must not wait for all AI/media generation.
FR-GEN-03: Enforce a per-owner active-job limit and configurable rate/cost limits.
FR-GEN-04: Generation states: queued, validating_input, generating_blueprint, validating_case, generating_media, persisting, ready, failed, cancelled.
FR-GEN-05: The case becomes playable only after all required validation and persistence steps complete.
FR-GEN-06: Retry transient provider/network/rate-limit errors with bounded exponential backoff and jitter; respect Retry-After when available. Do not retry permanent invalid-input errors indefinitely.
FR-GEN-07: Use a configurable maximum generation duration and bounded repair attempts (default: at most 2 whole-blueprint repair attempts after the first generation). On exhaustion, set a safe failure state with a retry option; never expose internal prompts/provider details to the user.
FR-GEN-08: Log operational status with correlation/job IDs while redacting scenario content, credentials, and solution data from normal logs.
FR-GEN-09: Use a provider adapter for text, image, and optional video generation. The rest of the app must not depend on provider-specific response shapes.
FR-GEN-10: In test mode, use deterministic fixture generation; tests must not require live Gemini credentials or incur real provider costs.
6.3 Evidence and investigation
FR-PLAY-01: Ready case briefing and public suspect list are available to the owner.
FR-PLAY-02: Owner can list/open evidence by stable ID.
FR-PLAY-03: Marking evidence as reviewed is idempotent and stored server-side.
FR-PLAY-04: Evidence filters and sorting are based only on public evidence fields.
FR-PLAY-05: Notes are private to the owner and case; support create/update and delete/clear behavior.
FR-PLAY-06: The application never makes a Gemini request in response to opening an evidence item or saving notes.
FR-PLAY-07: The investigation can be resumed after page reload or logout/login.
FR-PLAY-08: Before final accusation, users may revise notes and revisit evidence. They may not alter generated evidence or suspects.
6.4 Accusation, reveal, and scoring
FR-RESULT-01: The final accusation must reference a listed suspect ID, and only IDs belonging to this case are accepted.
FR-RESULT-02: At most one final accusation per investigation is allowed in MVP.
FR-RESULT-03: Persist the accusation, completion timestamp, selected evidence IDs, correctness, and score using an atomic/conditional update to prevent double submission.
FR-RESULT-04: Return the solution only after the accusation is successfully committed.
FR-RESULT-05: The result endpoint returns the same stored result on repeated requests and never recomputes/changes the truth.
FR-RESULT-06: Do not send the private truth document in a pre-accusation response even if the player submits a guessed culprit through a non-final endpoint.
6.5 Case management
FR-CASE-01: My Cases lists the authenticated user's cases with title, creation time, public status, and user-facing progress.
FR-CASE-02: Users can open ready cases and completed results.
FR-CASE-03: Users can delete their own cases with confirmation.
FR-CASE-04: Deletion cancels or marks in-flight jobs and deletes case-specific public and private records. Delete media from storage where supported; if provider/storage deletion is asynchronous, record cleanup state and retry safely.
FR-CASE-05: A failed case can be retried by creating a new generation attempt/version. A ready case's truth must not be silently regenerated.
7. Technical Architecture
7.1 Stack and conventions
Runtime: Node.js 22 or later when using @google/genai SDK v3.x. Pin the chosen SDK version in the lockfile and follow its matching official documentation.
Language: TypeScript on client and server, with strict mode enabled.
Frontend: React, Vite, React Router, a query/cache layer such as TanStack Query, and a form/validation approach shared with the server where practical.
Backend: Express 5.x or the currently supported stable Express major version; modular routers/services/controllers.
Database: MongoDB with Mongoose or equivalent. Use explicit schema validation and indexes for ownership, job-state lookup, and unique constraints.
Validation: Zod for client/server boundary validation and Gemini structured output schema where supported.
AI: Official @google/genai JavaScript/TypeScript SDK in Node only.
Testing: Vitest or Jest for unit/integration tests, React Testing Library for UI, Playwright for end-to-end tests, Supertest for HTTP integration.
Lint/format: ESLint + Prettier; strict TypeScript; no ignored type errors to ship.
Do not hardcode a model ID throughout the app. Read it from environment configuration and validate it in startup/health diagnostics. Keep provider usage behind interfaces so model deprecations are isolated.

7.2 High-level component diagram
Browser: React UI
Express API
Auth + Ownership Middleware
MongoDB
Generation Job Queue/Worker
Case Generation Service
Gemini Text Adapter
Image Provider Adapter
Video Provider Adapter
Schema + Logic Validators
Object Storage
HTTPS JSON
optional
7.3 Backend boundaries
Routes: Parse and validate request shape, then delegate. No business logic or direct AI calls in routes.
Controllers: Translate request/response DTOs and HTTP statuses.
Services: Case management, generation orchestration, investigation state, accusation, score calculation, cleanup.
Repositories/models: Persistence, indexes, ownership-scoped query helpers, solution repository access.
AI adapters: Provider-specific SDK configuration, timeouts, parsing, retries, and normalized errors.
Validators: Input schemas, model-output schemas, semantic case validator, media manifest validator, response DTO types.
Serializers/DTOs: Explicitly map DB objects to safe public response shapes.
Only the accusation/result domain service may import or call the solution repository. Add a code comment and an automated architecture/security test for this boundary where practical.

7.4 Generation worker strategy
Generation must be asynchronous. In development, a simple worker process may poll MongoDB for queued jobs using atomic job claims/lease expiry. For production, run the worker as a separate process/service or use a durable queue. The API must not depend on a long-running HTTP request remaining open while Gemini or media generation runs.

Minimum job reliability:

Atomic claim/lease so two workers do not generate the same job simultaneously.
Lease expiry and recovery for crashed workers.
Idempotent stage operations where practical.
Explicit retry count and nextAttemptAt.
Terminal states ready, failed, and cancelled.
Cleanup of orphaned partial media and partial records.
A unique/idempotency key can prevent accidental duplicate case creation when a client retries the same submission.
7.5 Media storage
Use a MediaStorage interface, not absolute local paths in MongoDB. Store metadata such as object key, MIME type, byte size, width/height/duration when applicable, provider name, generated timestamp, and a safe storage reference. Serve media only after verifying case ownership or use short-lived signed URLs. Never put the culprit ID, hidden clue type, internal prompt, or truth data in object keys, filenames, public URLs, or metadata.

Local filesystem storage is acceptable for local development only. Production storage must be durable and support deletion. Do not commit generated user artifacts or credentials into git.

8. Data Model
Use stable ObjectIds or UUIDs. Store timestamps in UTC. Add createdAt and updatedAt consistently. The following models are the logical contract; adjust Mongoose syntax as needed but preserve the field meanings and security boundaries.

8.1 users
type User = {
  _id: ObjectId;
  email: string;              // normalized lowercase, unique index
  passwordHash: string;       // never returned to client
  displayName?: string;
  createdAt: Date;
  updatedAt: Date;
};
Index: unique { email: 1 }.

8.2 cases — public case record
type CaseStatus = 'queued' | 'generating' | 'ready' | 'failed' | 'deleting';
type Genre = 'classic_detective' | 'heist' | 'missing_object' | 'campus_mystery' | 'sci_fi' | 'thriller';
type Difficulty = 'easy' | 'medium' | 'hard';

type PublicCase = {
  _id: ObjectId;
  ownerId: ObjectId;
  generationJobId: ObjectId;
  title: string;
  originalScenario: string;  // private to owner but not secret answer; never include in logs by default
  genre: Genre;
  difficulty: Difficulty;
  status: CaseStatus;
  publicBriefing?: {
    summary: string;
    incidentType: string;
    locationLabel: string;
    incidentWindow: { startLabel: string; endLabel: string };
    publicRules: string[];
  };
  suspects?: Array<{
    id: string;
    displayName: string;
    role: string;
    biography: string;
    publicRelationship: string;
    publicStatement?: string;
    portraitMediaId?: string;
  }>;
  timeline?: Array<{
    id: string;
    label: string;
    timeLabel: string;       // display label; may express approximate ranges
    sortTime?: Date;          // only if a real normalized time is known
    description: string;
    sourceEvidenceIds: string[];
  }>;
  generationVersion: number;
  schemaVersion: number;
  mediaStatus: 'not_requested' | 'partial' | 'complete' | 'fallback';
  readyAt?: Date;
  failedAt?: Date;
  safeFailureCode?: string;
  createdAt: Date;
  updatedAt: Date;
};
Important: do not add culpritId, solution, hiddenFacts, criticalEvidenceIds, redHerringIds, truthLabels, motivePrivate, or equivalent fields to this collection. If the scenario should not be shown to any other user, retain the ownership constraint even for originalScenario.

Indexes: { ownerId: 1, createdAt: -1 }, { status: 1, updatedAt: 1 }, { generationJobId: 1 }.

8.3 evidence — public artifacts
type EvidenceType =
  | 'chat_transcript' | 'image' | 'cctv_stills' | 'cctv_log'
  | 'witness_statement' | 'document' | 'timeline_event';

type PublicEvidence = {
  _id: ObjectId;
  id: string;              // public stable ID, unique within case
  caseId: ObjectId;
  ownerId: ObjectId;       // duplicated for safe ownership filters
  type: EvidenceType;
  title: string;
  shortDescription: string;
  sourceLabel: string;
  occurredAtLabel?: string;
  sortTime?: Date;
  body: unknown;           // discriminated union; validate separately per type
  mediaIds: string[];
  relatedPublicEvidenceIds: string[]; // only if relationship is public and not a spoiler
  createdAt: Date;
};
Define a TypeScript discriminated union for body. Examples:

Chat: participants[], ordered messages[] with timestampLabel, senderId, and text.
Image: caption, altText, and optional visible image details.
CCTV stills: cameraLabel, frames[] containing timestampLabel, mediaId, and publicFrameDescription.
CCTV log: cameraLabel, recordingWindow, events[], and public gap/unknown labels.
Witness statement: witnessName, statementAtLabel, statementText.
Document: documentType, documentDateLabel, issuerLabel, and contentBlocks[].
Timeline event: eventLabel, timeLabel, and description.
Do not include hidden truthTags, isCritical, points, suspectLikelihood, or private interpretations in evidence records. Evidence body schemas must be validated on insert and on serialization.

Indexes: unique { caseId: 1, id: 1 }, { caseId: 1, sortTime: 1 }, { ownerId: 1, caseId: 1 }.

8.4 case_solutions — protected truth data
type CaseSolution = {
  _id: ObjectId;
  caseId: ObjectId;           // unique
  ownerId: ObjectId;
  culpritSuspectId: string;
  canonicalIncident: {
    motive: string;
    method: string;
    opportunity: string;
    conciseTruth: string;
    canonicalFacts: Array<{ id: string; fact: string }>;
    canonicalTimeline: Array<{
      id: string;
      timeLabel: string;
      fact: string;
      suspectIdsInvolved: string[];
    }>;
  };
  evidenceInterpretations: Array<{
    evidenceId: string;
    classification: 'critical' | 'supporting' | 'red_herring' | 'neutral';
    privateExplanation: string;
    supportsSuspectIds: string[];
    contradictsSuspectIds: string[];
    canonicalFactIds: string[];
  }>;
  acceptedReasoningEvidenceIds: string[];
  validation: {
    validationVersion: string;
    validatedAt: Date;
    checksPassed: string[];
  };
  frozenAt: Date;
  createdAt: Date;
};
Index: unique { caseId: 1 }. This collection is never serialized directly. acceptedReasoningEvidenceIds must contain valid evidence IDs and should normally represent the strongest supporting evidence, not every vaguely relevant item.

8.5 generation_jobs
Fields: _id, ownerId, caseId, status, stage, attempt, maxAttempts, leaseOwner, leaseExpiresAt, nextAttemptAt, safeProgressMessage, safeErrorCode, startedAt, finishedAt, createdAt, updatedAt, and a non-sensitive correlation ID. Do not store secrets or copy the solution into job status fields. If raw provider payloads are needed for a short debugging window, store them in a separately protected diagnostic mechanism with redaction and retention controls—not in public job responses.

Indexes: { status: 1, nextAttemptAt: 1 }, { leaseExpiresAt: 1 }, { ownerId: 1, createdAt: -1 }, { caseId: 1 }.

8.6 investigation_sessions
One investigation session per owner and case in MVP:

type InvestigationSession = {
  _id: ObjectId;
  ownerId: ObjectId;
  caseId: ObjectId;
  reviewedEvidenceIds: string[];
  notes: string;
  accusation?: {
    suspectId: string;
    selectedEvidenceIds: string[];
    reasoning?: string;
    submittedAt: Date;
    isCorrect: boolean;
    score: number;
    scoreBreakdown: { culprit: number; evidence: number; reasoning: number };
  };
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};
Unique index { ownerId: 1, caseId: 1 }. The accusation fields become immutable after completion. The public session DTO omits correctness, score, private solution, and score components until completedAt exists.

8.7 media_assets
Fields: _id, caseId, ownerId, kind: 'image' | 'video' | 'placeholder', storageKey, mimeType, sizeBytes, dimensions/duration if known, provider, providerModel, promptVersion (not raw prompt), status, createdAt, and deletedAt?. Never expose raw provider responses or private prompts to the client.

8.8 MongoDB validation and invariants
Use Zod validation before persistence and consider MongoDB schema validation for stable production collections. Use unique indexes to enforce relationships that must not duplicate. Use atomic conditional updates for final accusation and job claiming. Use a transaction where supported when committing a ready case plus public evidence plus solution. If transactions are not available in a deployment, implement a staging/commit design where the case remains non-ready until every required document is persisted and validated.

9. Gemini and AI Generation Specification
9.1 SDK and configuration
Use the official @google/genai package from the server only.
Choose and pin a currently supported Node.js and SDK version. SDK v3.x requires Node.js 22 or later; do not assume an older runtime is sufficient.
Never expose GEMINI_API_KEY or a provider credential to the React bundle.
Keep text/image/video model IDs configurable. Verify current model capability, access, billing, and limitations against official documentation during implementation; model names and preview availability can change.
Use structured JSON output with a defined schema when supported, then validate the parsed result with Zod and semantic validators. Structured output improves shape consistency but does not prove story logic is correct.
Apply request timeouts, bounded retries, output-token limits, and redacted error handling.
Required environment variables (names may be changed only with documentation updates):

NODE_ENV=development
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/ai_mystery_room
SESSION_SECRET=replace-with-a-long-random-secret
GEMINI_API_KEY=
GEMINI_TEXT_MODEL=
GEMINI_IMAGE_MODEL=
GEMINI_VIDEO_MODEL=
ENABLE_IMAGE_GENERATION=true
ENABLE_VIDEO_GENERATION=false
MEDIA_STORAGE_DRIVER=local
MEDIA_STORAGE_LOCAL_DIR=./storage/media
MAX_ACTIVE_JOBS_PER_USER=1
MAX_CASES_PER_USER_PER_HOUR=3
MAX_GENERATION_ATTEMPTS=3
Validate required configuration at startup. In development, missing Gemini configuration may allow fixture mode, but the application must show a clear developer-only warning. In production, do not report provider-backed generation as working when the API key/model is absent.

9.2 Generation pipeline
The pipeline must use this order:

Input validation and moderation: Trim scenario, enforce length, validate options, and reject disallowed requests to identify or accuse real people or to generate realistic defamatory claims about a named private person. The product is for fiction.
Create queued job: Save a case with queued status and a generation job. Return 202 Accepted immediately.
Generate canonical blueprint: Ask Gemini for one structured case blueprint containing public story data and a private truth plan as separate subobjects. The model must know the intended culprit from the beginning, not guess one after evidence has been written.
Parse and validate: Parse strict JSON and validate with Zod. Reject unknown fields where feasible, duplicate IDs, empty content, unsupported evidence types, invalid IDs, missing suspect references, and schema violations.
Semantic consistency checks: Run deterministic validators described below. If invalid, perform at most the configured bounded whole-blueprint repair/regeneration attempts. Never patch a single clue in a way that leaves the previously generated culprit/solution inconsistent.
Optional critic pass: An additional Gemini review may inspect a serialized case for contradictions and solvability. Treat its feedback as advisory; programmatic requirements remain authoritative. Do not expose critic output.
Generate media prompts: Create narrow prompts anchored to approved public facts. Each prompt should specify only the content needed for the specific public artifact. Do not include hidden motive, culprit identity, internal evidence classification, or secret reasoning unless it is strictly necessary for the image and cannot reveal a spoiler; default to omitting those facts.
Generate media: Call the image provider for selected assets. If provider is unavailable or a media call fails after retries, create fallback assets or mark mediaStatus: partial/fallback, according to configuration. Text evidence is still mandatory.
Validate media manifest: Ensure every referenced media ID exists, MIME type and size are allowed, alt text exists for images, and no internal prompt/provider metadata is public.
Persist atomically: Save public case, public evidence, media references, protected solution, and validation report. Only after every required record exists and all checks pass, set case to ready and job to ready.
Return safe status: The polling endpoint returns a neutral stage/message and case ID, never the generated blueprint or solution.
9.3 Required blueprint schema (logical contract)
Codex should implement a shared TypeScript type plus Zod schema. The exact nesting may be adapted to the Gemini SDK's supported JSON Schema subset, but preserve the following semantics and keep public/private fields separate after parsing.

type CaseBlueprint = {
  publicCase: {
    title: string;
    briefing: {
      summary: string;
      incidentType: string;
      locationLabel: string;
      incidentWindow: { startLabel: string; endLabel: string };
      publicRules: string[];
    };
    suspects: Array<{
      id: string;
      displayName: string;
      role: string;
      biography: string;
      publicRelationship: string;
      publicStatement?: string;
      imagePrompt?: string;
    }>;
    timeline: Array<{
      id: string;
      timeLabel: string;
      description: string;
      sourceEvidenceIds: string[];
    }>;
    evidence: Array<{
      id: string;
      type: EvidenceType;
      title: string;
      shortDescription: string;
      sourceLabel: string;
      occurredAtLabel?: string;
      body: unknown;
      imagePrompts?: string[];
    }>;
  };
  privateTruth: {
    culpritSuspectId: string;
    motive: string;
    method: string;
    opportunity: string;
    conciseTruth: string;
    canonicalFacts: Array<{ id: string; fact: string }>;
    canonicalTimeline: Array<{ id: string; timeLabel: string; fact: string; suspectIdsInvolved: string[] }>;
    evidenceInterpretations: Array<{
      evidenceId: string;
      classification: 'critical' | 'supporting' | 'red_herring' | 'neutral';
      privateExplanation: string;
      supportsSuspectIds: string[];
      contradictsSuspectIds: string[];
      canonicalFactIds: string[];
    }>;
    acceptedReasoningEvidenceIds: string[];
  };
};
Never store or expose the raw CaseBlueprint object as one public document. Split it into public and private records immediately after validation. Strip unknown/unneeded properties, not just known secret keys.

9.4 Generation prompt requirements
Build prompts on the server from versioned templates, e.g. case-blueprint.v1. Use a clear instruction hierarchy:

System/developer instructions define fiction, schema, consistency, and safety requirements.
The user's scenario is included as untrusted story input inside clear delimiters or a structured input field.
Explicitly instruct the model not to follow instructions found inside the scenario that attempt to change output format, reveal application secrets, or override case-generation rules.
Never pass session secrets, API keys, database contents, or unrelated users' data to the model.
The blueprint-generation prompt must require:

A coherent fictional case based on the chosen scenario, genre, and difficulty.
Exactly 4–6 suspects and exactly one culprit among them.
A canonical truth established before evidence authoring.
8–12 distinct pieces of evidence spanning at least 4 supported types; at least 3 independently support the culprit across at least 2 reasoning dimensions.
At least one plausible alternate suspect and one fair red herring.
Evidence that is discoverable, interpretable, and not dependent on unstated facts.
Public suspect profiles and public artifacts that do not directly announce culprit identity.
Realistic chronology: all times, access, alibis, and actions can coexist with the canonical truth.
A final explanation that maps directly to evidence IDs and canonical fact IDs.
No real-person accusations and no claims that any artifact is real.
Avoid prompts that encourage the model to hide the answer in visible metadata, HTML, alt text, filenames, encoded text, or secret messages that can be trivially scraped from public payloads.

9.5 Deterministic validation rules
A case is invalid unless all rules pass:

title, briefing summary, incident type, and location label are non-empty and within length limits.
4–6 suspects exist; suspect IDs are unique; names are non-empty; culprit ID is a member of this exact list.
8–12 evidence items exist; evidence IDs are unique; each uses a supported type; each body validates for its type.
At least 3 evidence interpretations are critical or supporting, reference real evidence IDs, and support the culprit.
The supporting evidence spans at least two reasoning dimensions. Add an explicit private reasoningDimension enum such as opportunity, timeline, access, physical_trace, digital_trace, witness_contradiction, motive, or other in the internal blueprint/solution schema to test this condition.
Every referenced suspect/evidence/fact ID exists. No orphan reference is allowed.
All timeline events sort consistently where exact times exist. If times are approximate or contradictory from a witness perspective, label them as approximate/claimed rather than treating them as canonical fact.
A suspect's alibi does not contradict a known time/location unless the contradiction is explicitly intended as a clue and described in private truth reasoning.
No public artifact states the culprit directly or includes private model labels/classifications.
Every critical clue has a plain-language interpretation in the final solution.
Red herrings have a canonical explanation and do not create a second equally valid solution.
No required evidence is missing, inaccessible, or referenced only through a failed media asset.
Content does not include live URLs that the app will automatically fetch. The model must never be allowed to trigger arbitrary URL fetches, shell commands, tools, or database queries.
If a model-generated case fails to establish one unique supported culprit, discard and regenerate/repair the entire blueprint. Do not “guess” a culprit in application code after the evidence has been written.

9.6 Media-generation constraints
Generate one media item at a time or use bounded concurrency; avoid uncontrolled parallel calls.
Configure image dimensions/aspect ratio and output types using the current provider API's supported settings.
Treat generated images and video as untrusted binary output: validate response type, size, dimensions/duration, and storage rules before publication.
Keep an image-generation prompt free of sensitive solution details and avoid embedding legible text into generated imagery when evidence content should be accurate; render key text as HTML/text in the UI instead.
For message screenshots or reports, prefer composing the artifact from validated structured text in React over generating the exact text inside an image, because image models may render text inaccurately.
For CCTV in MVP, prefer generating visual stills and render timestamp/camera overlays in the application.
If video generation is enabled, it must use a current supported model exposed through an adapter and must be tested against the account/project's actual access and limits. If not available, switch to stills without failing the case.
Provider freshness note (reviewed 2026-10-25): Google's current video documentation reports that the Veo 3.1 Preview Gemini API model IDs were shut down on 2026-10-22 and points developers toward the currently supported video-generation path. Do not copy old preview model IDs from tutorials. The MVP must ship with ENABLE_VIDEO_GENERATION=false; enable video only after checking the official documentation, account access, billing, request format, and output behavior at implementation time.
Mark content as AI-generated in the UI. Do not claim media authenticity.
9.7 Provider errors, costs, and quotas
Implement normalized internal errors such as AI_RATE_LIMITED, AI_UNAVAILABLE, AI_TIMEOUT, AI_INVALID_OUTPUT, AI_SAFETY_BLOCK, and MEDIA_UNAVAILABLE. Do not return provider raw error text to the browser.

Use bounded retry with exponential backoff and jitter for transient errors and 429s. Use request/token/media concurrency limits and per-user generation limits. Track aggregate usage by job/model/type when usage metadata is available; do not log prompt text or secrets to analytics. Add a configuration switch to disable video and/or image generation quickly. Before production, set budget alerts and review model pricing and account limits. Never assume a given free-tier quota or preview model remains available.

10. REST API Contract
Base path: /api/v1. All JSON endpoints use Content-Type: application/json when a body is present. The API uses cookies for sessions. All owner-specific endpoints require authentication and ownership checks.

10.1 Common success/error shape
Success examples use resource-specific data; do not wrap secret internal objects in generic dumps.

Error shape:

{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the highlighted fields.",
    "requestId": "req_...",
    "details": [{ "field": "scenario", "message": "Scenario is required." }]
  }
}
details must contain only safe, actionable information. Never include stack traces, raw model output, solution fields, prompt templates, environment variables, or database query details.

10.2 Auth endpoints
POST /auth/register — body { email, password, displayName? }; returns public user DTO and sets session cookie.
POST /auth/login — body { email, password }; returns public user DTO and sets session cookie.
POST /auth/logout — invalidates session and clears cookie.
GET /auth/me — returns { user: { id, email, displayName? } } for the active session.
Suggested statuses: 201 register, 200 login/logout/me, 400 validation failure, 401 unauthenticated/invalid credentials, 409 account conflict when it does not disclose unnecessary account information, 429 rate limited.

10.3 Case endpoints
POST /cases — create generation job. Body { scenario, genre?, difficulty?, includeImages?, includeCctvStills?, idempotencyKey? }. Response 202:
{
  "case": { "id": "...", "title": "Case generation in progress", "status": "queued" },
  "job": { "id": "...", "status": "queued", "stage": "validating_input", "message": "Preparing your case file." }
}
The initial placeholder title must not pretend the final title is ready. It may be omitted until completion.

GET /cases — list current owner's cases. Support bounded pagination and filter by public status. Return public summary DTOs only.
GET /cases/:caseId — public case detail and public suspects/briefing/timeline only if ready; for processing states, return safe status info. Never return solution.
DELETE /cases/:caseId — delete an owned case; return 204 or a safe deletion-job DTO if cleanup is asynchronous.
GET /generation-jobs/:jobId — safe job status for the owner and its related case only.
10.4 Evidence endpoints
GET /cases/:caseId/evidence — list public evidence metadata. Support type, reviewed, sort, and bounded pagination. Do not add fields from case_solutions.
GET /cases/:caseId/evidence/:evidenceId — get one public evidence artifact. Verify it belongs to the specified case and owner.
POST /cases/:caseId/evidence/:evidenceId/reviewed — idempotently record that the owner reviewed this artifact; return public reviewed state only.
DELETE /cases/:caseId/evidence/:evidenceId/reviewed — optional unreview action if UI supports it; never delete the artifact itself.
10.5 Notes and investigation session
GET /cases/:caseId/investigation — returns reviewed IDs, notes, completed flag, and safe accusation status; pre-completion DTO excludes correctness, score, culprit, and solution.
PUT /cases/:caseId/notes — body { notes: string }, max 10,000 characters. Notes must not be sent to Gemini and must be escaped on display.
POST /cases/:caseId/accusation — body:
{
  "suspectId": "suspect_...",
  "selectedEvidenceIds": ["evidence_...", "evidence_..."],
  "reasoning": "Optional short explanation"
}
Validate that the suspect exists in this case; 0–3 unique selected evidence IDs must belong to this case; reasoning max 1,000 characters. On successful atomic commit, return the result DTO and solution. If completed already, return the existing result rather than changing it.

GET /cases/:caseId/results — 403 or 409 with generic safe error before a committed accusation; after completion, return the same result and solution. Do not make this endpoint a way to preview the solution.
10.6 DTO rules
PublicCaseDTO before accusation: id, title, status, genre, difficulty, publicBriefing, suspects, timeline, mediaStatus, timestamps, investigation progress summary when appropriate. No truth fields.

EvidenceDTO: id, type, title, shortDescription, sourceLabel, public time labels, validated public body, media display URLs/IDs, reviewed. No secret classification or internal IDs.

GenerationJobDTO: id, safe status, safe stage, safe message, createdAt, updatedAt, optional finishedAt. No raw model response/prompt/truth.

ResultDTO after accusation: caseId, accusation, isCorrect, culprit (public suspect DTO), solution (motive, method, opportunity, concise truth), canonicalTimeline, evidenceInterpretations mapped to public evidence titles and explanations, score, scoreBreakdown, completedAt.

10.7 HTTP status and idempotency
200 OK: read/update successful.
201 Created: registration or immediate resource creation when appropriate.
202 Accepted: generation queued.
204 No Content: successful deletion/logout when appropriate.
400 Bad Request: schema invalid.
401 Unauthorized: no valid session.
403 Forbidden: no permission or solution is not yet available (do not leak which hidden condition failed when risky).
404 Not Found: resource missing or not owned; consider returning 404 for cross-owner IDs to reduce enumeration.
409 Conflict: invalid state transition, case not ready, duplicate finalization conflict.
413 Payload Too Large: request body limit exceeded.
429 Too Many Requests: request/user/provider quota exceeded.
500 Internal Server Error: generic safe message and request ID.
503 Service Unavailable: temporary AI/storage/DB unavailability where retry may succeed.
All write endpoints must be safe against repeated requests. Use idempotency keys for case creation where feasible and an atomic compare-and-set for accusation submission.

11. Scoring Rules
Score is deterministic, calculated on the server when the final accusation is committed. Maximum: 100 points.

Culprit identification: 60 points. 60 if the selected suspect equals the stored culprit; otherwise 0.
Evidence reasoning: 25 points. Let selected be the distinct evidence IDs the player selected, and accepted be acceptedReasoningEvidenceIds from the private solution. matched = |selected ∩ accepted|. target = min(3, |accepted|). If target is 0, award 0 and flag the generated case as invalid during validation. Otherwise award round(25 * min(matched, target) / target).
Evidence exploration: 15 points. Let critical be the set of unique evidence IDs classified critical or supporting in the private solution, and reviewed be the session's unique reviewed evidence IDs. Award round(15 * |critical ∩ reviewed| / |critical|). The validator must ensure |critical| > 0.
Do not reveal the identities of accepted evidence or critical clues before accusation. The browser submits IDs, not point values. Deduplicate IDs before scoring. Scores are not intended to evaluate the natural-language quality of the explanation; no generative AI judge is required.

12. Security, Privacy, and Abuse Prevention
12.1 Application security
Use HTTPS in production.
Configure Express with security headers (e.g., Helmet), a strict CORS allowlist, a small JSON body limit, safe error handlers, and app.disable('x-powered-by').
Use secure session cookies: HttpOnly, Secure in production, appropriate SameSite, a generic cookie name, and a strong secret. Apply CSRF protection to state-changing cookie-authenticated requests (including Origin/Referer validation or a well-supported CSRF mechanism).
Use parameterized/typed MongoDB queries. Never pass raw user-provided objects directly as Mongo filters or updates. Reject query operators and validate IDs.
Render generated text as text, not unsafe HTML. Avoid dangerouslySetInnerHTML. If markdown is introduced later, sanitize it with an allowlist.
Restrict allowed MIME types/size for media, verify file content rather than trusting file extensions, and never accept arbitrary server file paths.
Avoid open redirects and server-side request forgery: do not fetch model-provided or user-provided URLs automatically.
Rate limit auth, case generation, polling, and accusation endpoints. Apply per-user and per-IP limits where sensible.
Use a dependency lockfile, automated dependency/security checks, and supported package versions.
Do not log passwords, session IDs, authorization cookies, API keys, prompt content, private solution fields, or full generated evidence.
12.2 Ownership and secret access
Every case-scoped database read must include both caseId and authenticated ownerId where practical.
Every evidence ID must be resolved within the selected case and owner; do not trust client-provided IDs.
The result service verifies owner, case readiness, and committed accusation state before loading the solution.
No direct public media URL may reveal objects belonging to other users. Use private storage and signed URLs or an ownership-checked media route.
Consider MongoDB users/roles and database-network restrictions appropriate to the deployment. Application code must still preserve collection separation and DTO allowlists.
12.3 AI safety and fictional content
Treat the scenario as untrusted content, not privileged instructions.
Do not build features that identify real suspects, analyze a real individual's guilt, generate fake evidence intended to mislead authorities, or impersonate real private people. Keep the app clearly fictional.
If a user provides a real person's name plus allegations, redirect the scenario to fictional names or reject it according to a clear moderation policy.
AI-generated artifacts must be labelled fictional and should not use real personal contact details or active real account identifiers.
Do not include arbitrary code execution, shell commands, tool calls, or unrestricted web search in the case-generation path.
12.4 Privacy and deletion
Collect only information needed for accounts, cases, and gameplay.
Make notes private to the user and do not send them to external AI providers.
Delete user-owned case data and stored media when a case is deleted. Document retention behavior for backups and logs.
Do not retain raw prompts/responses by default. If temporary diagnostics are necessary, redact and automatically expire them.
Provide a short privacy notice explaining that scenario text is sent to Google Gemini for case generation and that media may be sent to a configured AI media provider.
13. Non-Functional Requirements
13.1 Performance and reliability
Normal API reads/writes (excluding external AI/media calls) should target p95 below 500 ms under an agreed modest test load.
Case creation endpoint should return promptly after validation and job persistence; it must not wait for content generation.
Generation must show useful status and end in either ready or a retryable/final failed state. It must not remain silently stuck forever; use job leases and stale-job recovery.
Evidence browsing and notes must remain usable while other media assets are pending only if the case is already valid/ready; otherwise keep the case non-playable until required public records exist.
All lists and polls need pagination/bounds; never return unlimited records.
13.2 Accessibility
Target WCAG 2.2 AA practices.
All buttons, tabs, modals, evidence viewers, and accusation controls must work with keyboard navigation.
Visible focus indication, labels for form controls, semantic headings, useful alt text, adequate contrast, and screen-reader announcements for job status updates.
Honor prefers-reduced-motion; never rely on animation to communicate status.
On mobile, avoid tiny click targets and horizontal overflow. Evidence text must zoom/read comfortably.
13.3 Browser support and responsive behavior
Support current stable Chrome, Edge, Firefox, and Safari. Layout breakpoints must cover mobile, tablet, laptop, and wide desktop. No critical workflow may require hover or drag-and-drop.

13.4 Maintainability and observability
Enable strict TypeScript and linting.
Keep configuration, prompts, schemas, and provider adapters separated.
Include a health endpoint that reports API/database availability and configuration presence without exposing credentials or internal service data.
Use structured logs with request/job correlation IDs and safe normalized error codes.
Document database migrations/index creation and operational configuration.
14. Required Project Structure
Codex may refine naming, but keep equivalent boundaries and modules.

ai-mystery-room/
├── README.md
├── SPEC.md                         # copy this specification here; authoritative in repo
├── package.json                    # workspace root if using npm workspaces
├── .env.example
├── .gitignore
├── docs/
│   ├── ARCHITECTURE.md             # diagrams/decisions that supplement but do not contradict SPEC.md
│   ├── API.md                      # endpoint details derived from this spec
│   ├── AI_GENERATION.md            # prompt/schema/validator behavior derived from this spec
│   └── SECURITY.md                 # threat controls and verification plan
├── client/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── app/                    # router, providers, error boundaries
│       ├── components/             # shared accessible UI
│       ├── features/
│       │   ├── auth/
│       │   ├── cases/
│       │   ├── generation/
│       │   ├── investigation/
│       │   ├── evidence/
│       │   ├── notes/
│       │   └── results/
│       ├── lib/                    # API client, query client, utilities
│       ├── styles/                 # tokens, global styles
│       └── test/
└── server/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── app.ts
        ├── server.ts
        ├── config/
        ├── middleware/             # auth, csrf, rate limits, errors, request IDs
        ├── routes/
        ├── controllers/
        ├── services/
        │   ├── auth.service.ts
        │   ├── cases.service.ts
        │   ├── generation.service.ts
        │   ├── investigation.service.ts
        │   ├── accusation.service.ts
        │   └── deletion.service.ts
        ├── repositories/           # explicit public and solution repositories
        ├── models/
        ├── validators/
        │   ├── input.schemas.ts
        │   ├── blueprint.schema.ts
        │   ├── case.logic-validator.ts
        │   └── dto.schemas.ts
        ├── ai/
        │   ├── interfaces.ts
        │   ├── gemini-text.adapter.ts
        │   ├── image.adapter.ts
        │   ├── video.adapter.ts
        │   ├── prompts/
        │   └── usage.ts
        ├── jobs/
        ├── storage/
        ├── serializers/             # allowlisted public DTO mapping
        ├── utils/
        └── test/
            ├── fixtures/
            ├── unit/
            ├── integration/
            └── security/
Required repository-level files: .gitignore excludes .env, node_modules, build outputs, logs, local media, and secrets. .env.example contains names and safe placeholders only. README documents prerequisites, install, env setup, start commands, tests, local MongoDB, fixture mode, and AI provider configuration.

15. Testing Strategy
15.1 Unit tests
Must cover:

Scenario length/options validation.
Blueprint schema parsing and unknown-field handling.
Unique suspect/evidence ID validation.
Culprit membership validation.
Canonical timeline consistency rules.
Critical evidence count and reasoning-dimension coverage.
Missing/orphan reference detection.
Truth/public serialization separation.
Score formula, rounding, duplicate evidence handling, empty sets, and wrong culprit.
Job retry/backoff and safe error normalization.
Media manifest and MIME/size validation.
15.2 Integration tests
Use an isolated test database and mocked AI/media providers. Cover:

Register/login/logout and cookie/session behavior.
Creating a job returns quickly with 202.
Job lifecycle from queued to ready and failed.
Invalid AI blueprint is rejected and bounded retries work.
Ready case includes all public evidence and a separate solution record.
Evidence opened/reviewed and notes saved across reloads.
Correct and incorrect final accusation.
Duplicate accusation is idempotent and cannot change a completed result.
Case deletion removes associated records and media references.
A second user cannot read or mutate the first user's case, notes, evidence, or result.
15.3 Anti-spoiler security tests (mandatory release blockers)
Create a fixture case with unmistakable sentinel secret values, e.g. SECRET_CULPRIT_SENTINEL and SECRET_TRUTH_SENTINEL. Before accusation, call every endpoint accessible to the owner and assert that serialized response bodies, headers, public media metadata, and status messages contain neither sentinel and contain no forbidden fields. Scan the frontend's network fixtures and generated client bundle for test-only sentinel values. Then submit an accusation and verify the solution is revealed only after persistence.

Test direct requests to:

GET /cases/:id
GET /cases/:id/evidence
GET /cases/:id/evidence/:evidenceId
GET /cases/:id/investigation
GET /generation-jobs/:jobId
GET /cases/:id/results before accusation
Also test IDOR, mass assignment, NoSQL injection payloads, oversized body, XSS-like scenario/note text, CSRF, repeated accusation, guessed evidence IDs from another case, and media URL access.

15.4 End-to-end tests
At minimum, automate these user journeys:

New user registers, submits scenario, sees generation progress, reaches a ready investigation, and sees suspects/evidence.
User reviews evidence, adds notes, reloads, and sees state preserved.
User submits the wrong culprit and sees the result/solution only after submission.
User submits the correct culprit in a separate fixture case and receives the expected deterministic score.
User attempts to open results before accusation and cannot see solution data.
User deletes an owned case.
User A cannot access User B's case using copied IDs.
Mock external AI in CI; add a separate optional manual smoke test for real Gemini credentials and media provider access. Normal CI must not require paid API calls.

15.5 Build quality gates
Before marking a phase complete, run and pass:

TypeScript type check.
Lint and format checks.
Unit tests.
Integration tests.
Frontend production build.
E2E critical path.
Dependency audit or configured vulnerability check.
Do not suppress errors to make tests pass. Document any accepted limitation in README and this spec.

16. Acceptance Criteria (Definition of Done)
AC-01: Generation
Given a valid scenario and configured AI provider, when the user submits it, the API responds with a job quickly and the UI shows safe progress.
A successful job produces a ready case containing 4–6 suspects and 8–12 unique evidence items.
Every ready case has one stored culprit, a canonical timeline, and a valid explanation mapping.
An invalid case never becomes ready.
AC-02: Playability and solvability
At least three independent evidence items support the culprit across at least two reasoning dimensions.
All critical evidence is reachable and rendered.
The final explanation accounts for both decisive clues and any red herring.
A case remains playable when media generation fails, using a fallback when needed.
AC-03: Anti-spoiler
Before final accusation, none of the normal API responses expose the culprit, solution text, private clue categories, accepted reasoning evidence, or score metadata.
Public case and evidence DB records do not contain private solution fields.
After a committed final accusation, result endpoint returns the same complete solution on repeated requests.
AC-04: Investigation state
The user can open all evidence, mark it reviewed, save notes, navigate between suspects/evidence, and resume after reload.
Notes are private and are not sent to Gemini.
AC-05: Final accusation and score
The player can select only an actual case suspect.
A final accusation is committed at most once and cannot be overwritten by repeated requests.
Server-side score is deterministic, matches the documented formula, and does not trust client-supplied score values.
AC-06: Ownership and privacy
Users cannot read, edit, delete, or reveal another user's case/solution by changing IDs.
Deleting an owned case triggers deletion of its related private/public records and media references.
No API key, password hash, session secret, or private solution appears in client code or normal logs.
AC-07: UX and accessibility
Primary flows work in current desktop and mobile browsers.
Forms, progress status, evidence navigation, modals, notes, and accusation are keyboard accessible.
Loading, empty, failed, and retry states are implemented, not just happy paths.
AC-08: Reliability and setup
Setup instructions work from a fresh clone with required environment variables and MongoDB.
Fixture mode supports local development and CI without external AI calls.
A stuck worker/job can be recovered without producing a playable partial case.
17. Implementation Milestones
Codex should implement in small compiling increments and maintain README.md, tests, and docs as it goes.

Milestone 0 — Repository audit and foundation
Inspect repository before editing; identify existing conventions and scripts.
Establish monorepo/workspaces if needed, TypeScript strict mode, linting, formatting, test runner, env validation, README, and .env.example.
Create server health endpoint, frontend shell, routing, shared design tokens, and safe error boundary.
Exit gate: clean build and test command work from a fresh install.
Milestone 1 — UX with deterministic fixtures
Implement landing page, auth screens, My Cases, create form, generation screen, investigation workspace, evidence viewer by type, timeline, notes, accusation modal, and result page.
Add realistic mock cases and fixture generation service.
Exit gate: core flow works end-to-end with no live AI, including correct/incorrect result fixtures.
Milestone 2 — Persistence and authentication
Implement MongoDB models, indexes, sessions, ownership middleware, case/evidence/investigation CRUD, and deletion.
Split public case/evidence storage from case_solutions.
Add API DTO serializers and IDOR tests.
Exit gate: all state survives reload and ownership tests pass.
Milestone 3 — Generation jobs and validators
Implement generation job states, worker lease/recovery, schema validators, deterministic semantic validators, safe progress API, and bounded retries.
Add invalid fixture blueprints to prove the validator rejects contradictions, duplicate IDs, missing clues, and invalid culprit references.
Exit gate: valid blueprint becomes ready, invalid blueprint never does, and job recovery tests pass.
Milestone 4 — Gemini text provider
Implement @google/genai adapter, current SDK/model configuration, versioned prompts, structured output, parse handling, normalized errors, request timeout, retries, and usage metadata where available.
Use fixture mode for normal automated tests.
Exit gate: manual real-provider smoke test generates and validates a case without solution leakage.
Milestone 5 — AI-generated media
Implement storage abstraction, image adapter, alt text and fallback rendering, CCTV still presentation, asset cleanup, and optional video adapter behind a flag.
Exit gate: text-only/fallback mode still produces fully playable cases; media URLs are ownership-safe.
Milestone 6 — Final accusation, security, and release hardening
Implement atomic accusation, immutable result, scoring, solution reveal, anti-spoiler sentinel tests, security middleware, rate limits, accessibility pass, browser testing, logs/health checks, dependency scan, and deployment documentation.
Exit gate: every acceptance criterion and build quality gate passes.
Do not start advanced features until Milestone 6 is complete.

18. Codex Working Rules
Read first: Read SPEC.md and the current repository structure before editing.
Plan briefly: For a multi-step feature, state the intended files and acceptance tests, then implement in small vertical slices.
No fake completion: Do not create dead buttons, placeholder routes presented as complete, or mocked AI presented as live AI. If fixture mode is used, label it as fixture/dev mode.
No hidden assumptions: Use the defaults in this document. If a material conflict requires a new decision, record it in docs/ARCHITECTURE.md and update SPEC.md.
Protect the solution by construction: Keep solution data in its own repository/module and never expose raw documents. Prefer allowlisted response DTOs over blocklists.
Test every boundary: Validate inputs, AI output, database writes, ownership, and API responses.
Do not hardcode secrets or provider models: Use environment configuration, startup validation, and adapters.
Keep code typed: Avoid any except at narrow untrusted SDK boundaries; immediately parse unknown content into validated types.
Use real content shapes: Evidence renderers must have type-specific components. Do not render all artifacts as generic paragraphs.
Do not overbuild: Keep MVP boundaries. Multiplayer, payments, public sharing, open-ended AI hints, and long-form video remain out of scope.
Update docs with behavior: Any endpoint, data model, state transition, score, or security invariant change must update this spec and tests in the same change.
Run actual commands: Report which builds/tests passed and which could not be run. Never claim test success without executing the command.
Finish with a concise handoff: Summarize shipped features, configuration needed, tests run, known limitations, and the next milestone. Do not claim the app is production-ready if security, deployment, or acceptance gates remain incomplete.
Initial Codex task
Start with Milestone 0, then implement Milestone 1 completely using deterministic fixtures. Do not begin Gemini integration until the fixture-driven product flow and page structure are functional. Before adding live provider calls, implement the public/private data split and anti-spoiler tests so every subsequent generation change is tested against the reveal rules.

19. Environment and Deployment Requirements
19.1 Local development
Provide exact root commands for install, development, build, type-check, test, and lint.
Include a safe local MongoDB configuration and instructions.
Include fixture/demo mode so UI development is possible without Gemini credentials.
Use .env locally and keep it out of version control.
Store local media in an ignored directory with a cleanup script.
19.2 Production topology
Recommended deployment separates:

React static frontend hosting.
Express API service.
Generation worker service.
MongoDB managed instance with backups and restricted network access.
Private object storage for generated media.
If using one Node deployment for the MVP, preserve the worker abstraction and ensure the chosen host supports durable background processing. Do not assume serverless request handlers can run long background tasks after returning a response.

19.3 Production configuration and readiness
Secure session secret and API keys stored in deployment secrets manager.
HTTPS and strict CORS origin list.
NODE_ENV=production; secure cookie settings enabled.
Database indexes created and validated before launch.
Generation limits, provider budgets, and safe error logging configured.
Health/readiness checks do not reveal secret values.
Backup, deletion, and incident-response procedures documented.
Run anti-spoiler, access-control, and E2E tests against the release candidate before making it public.
20. Decisions That Must Not Be Reopened Without Updating This Spec
Area	MVP decision
Product type	Single-player fictional detective investigation website
Main stack	MERN with TypeScript
AI	Gemini text generation through official server-side @google/genai SDK
Truth creation	Entire intended truth is fixed before the case becomes playable
Culprit	Exactly one culprit among 4–6 suspects
Evidence count	8–12 items; minimum 8
Evidence logic	At least 3 independent supporting clues across 2+ reasoning dimensions
Storage security	Public case/evidence and private solution in separate collections
Reveal gate	Reveal only after a final accusation is successfully persisted
Final attempt	One final accusation per investigation in MVP
Media	AI images and CCTV-style stills/logs; actual video is optional and adapter-based
User state	Authenticated owner, private notes, reviewed evidence, saved result
Scoring	Server-side deterministic 100-point rubric documented in Section 11
Generation	Async jobs; invalid/partial cases never playable
Testing	CI uses mocked AI; live-provider smoke test is separate
Out of scope	Multiplayer, payments, public marketplace, long-form video, open-ended AI hints
21. Official Documentation References
These links are implementation references, not permission to weaken the product requirements. Confirm the live documentation and account access when integrating provider-specific features. Checked for this spec on 2026-10-25.

Google Gen AI JavaScript/TypeScript SDK (@google/genai): https://googleapis.github.io/js-genai/
Use the official SDK. Its documentation warns against exposing API keys in client code and notes SDK v3.x requires Node.js 22 or later.
Gemini structured outputs: https://ai.google.dev/gemini-api/docs/structured-output
Use schema-constrained JSON output where supported, followed by independent schema and semantic validation.
Gemini image generation: https://ai.google.dev/gemini-api/docs/image-generation
Check currently supported image models and request options at integration time.
Gemini video generation: https://ai.google.dev/gemini-api/docs/video
Video capabilities and model availability change; use the configured provider adapter and keep video optional.
Gemini API rate limits: https://ai.google.dev/gemini-api/docs/rate-limits
Enforce bounded concurrency and budget/rate-limit-aware retries; actual limits depend on project, model, and usage tier.
Gemini API errors: https://ai.google.dev/gemini-api/docs/api-errors
Normalize provider errors and use bounded retry for transient/rate-limit conditions.
Express production security: https://expressjs.com/en/advanced/best-practice-security/
Apply input validation, TLS, secure cookies, security headers, rate limiting, and safe production error handling.
MongoDB schema validation: https://www.mongodb.com/docs/manual/core/schema-validation/
Use schema validation to prevent invalid field types and values from being written.
OWASP Top 10 (2025): https://owasp.org/www-project-top-ten/
Use as a baseline for access-control, configuration, supply-chain, injection, authentication, and related security risks.
Final Release Rule
AI Mystery Room is not complete merely because the pages render or Gemini returns JSON. It is complete only when a real or deterministic case can be generated, validated as uniquely solvable, investigated end-to-end, scored correctly, and revealed at the correct time—with automated proof that the culprit and solution remain unavailable to the browser before final accusation.

⋮⋮⋮⋮