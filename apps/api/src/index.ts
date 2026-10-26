import express, { type Request, type Response, type NextFunction } from 'express';
import session from 'express-session';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import { accusationSchema, createCaseSchema, type PublicCase, type PublicResult, type SafeJob } from '@mystery/shared';
import { makeFixtureCase, scoreAccusation } from './fixture.js';

declare module 'express-session' { interface SessionData { userId?: string; email?: string } }
type CaseState = { file: PublicCase; result?: PublicResult; job: SafeJob };
const cases = new Map<string, CaseState>();
const app = express();
const port = Number(process.env.PORT ?? 4000);
const origin = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';
app.disable('x-powered-by');
app.use(cors({ origin, credentials: true }));
app.use(express.json({ limit: '32kb' }));
app.use(session({ name: 'mystery.sid', secret: process.env.SESSION_SECRET ?? 'development-only-secret-change-before-deploy', resave: false, saveUninitialized: false, cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 7 * 24 * 60 * 60 * 1000 } }));
const requireUser = (req: Request, res: Response, next: NextFunction) => req.session.userId ? next() : res.status(401).json({ error: { code: 'AUTH_REQUIRED', message: 'Sign in to continue.' } });
const getOwned = (req: Request, res: Response): CaseState | undefined => {
  const caseId = req.params.caseId;
  const item = typeof caseId === 'string' ? cases.get(caseId) : undefined;
  if (!item) { res.status(404).json({ error: { code: 'CASE_NOT_FOUND', message: 'This case is not available.' } }); return; }
  return item;
};
app.get('/api/health', (_req, res) => res.json({ status: 'ok', mode: 'fixture', provider: 'deterministic-fixture' }));
app.get('/api/auth/me', (req, res) => res.json({ user: req.session.userId ? { id: req.session.userId, email: req.session.email ?? 'detective@example.test', displayName: 'Detective' } : null, mode: 'fixture' }));
app.post('/api/auth/login', (req, res) => { req.session.userId = 'fixture-detective'; req.session.email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : 'detective@example.test'; res.json({ user: { id: req.session.userId, email: req.session.email, displayName: 'Detective' }, mode: 'fixture' }); });
app.post('/api/auth/register', (req, res) => { req.session.userId = 'fixture-detective'; req.session.email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : 'detective@example.test'; res.status(201).json({ user: { id: req.session.userId, email: req.session.email, displayName: 'Detective' }, mode: 'fixture' }); });
app.post('/api/auth/logout', (req, res) => req.session.destroy(() => { res.clearCookie('mystery.sid'); res.status(204).end(); }));
app.get('/api/cases', requireUser, (req, res) => res.json({ cases: [...cases.values()].map(x => ({ id: x.file.id, title: x.file.title, status: x.file.status, createdAt: x.file.createdAt, completed: x.file.completed, progress: x.job.safeProgressMessage })) }));
app.post('/api/cases', requireUser, (req, res) => {
  const parsed = createCaseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: { code: 'INVALID_CASE_INPUT', message: 'Please check the scenario and settings.', details: parsed.error.flatten().fieldErrors } });
  const id = randomUUID();
  const input = parsed.data;
  const file = makeFixtureCase(id, input.scenario);
  file.genre = input.genre; file.difficulty = input.difficulty; file.status = 'generating';
  const job: SafeJob = { caseId: id, status: 'validating_input', stage: 'validating_input', safeProgressMessage: 'Checking your scenario' };
  cases.set(id, { file, job });
  const stages: SafeJob['status'][] = ['generating_blueprint', 'validating_case', 'generating_media', 'persisting', 'ready'];
  stages.forEach((stage, i) => setTimeout(() => {
    const state = cases.get(id); if (!state || state.file.status === 'failed') return;
    const messages: Record<SafeJob['status'], string> = { queued: 'Waiting to begin', validating_input: 'Checking your scenario', generating_blueprint: 'Building the case file', validating_case: 'Checking the timeline and evidence', generating_media: 'Preparing evidence visuals', persisting: 'Finalizing the case file', ready: 'Case file ready', failed: 'Generation could not be completed' };
    state.job = { caseId: id, status: stage, stage, safeProgressMessage: messages[stage] };
    if (stage === 'ready') state.file.status = 'ready';
  }, 550 * (i + 1)));
  return res.status(202).json({ caseId: id, status: 'queued', mode: 'fixture' });
});
app.get('/api/cases/:caseId/job', requireUser, (req, res) => { const s = getOwned(req, res); if (s) res.json({ job: s.job }); });
app.get('/api/cases/:caseId', requireUser, (req, res) => { const s = getOwned(req, res); if (s) { if (s.file.status !== 'ready') return res.status(409).json({ error: { code: 'CASE_NOT_READY', message: 'This case is still being prepared.' } }); const { result: _result, ...safe } = s; res.json({ case: safe.file }); } });
app.post('/api/cases/:caseId/reviewed', requireUser, (req, res) => { const s = getOwned(req, res); if (!s) return; if (s.file.completed) return res.status(409).json({ error: { code: 'CASE_COMPLETED', message: 'This investigation is complete.' } }); const id = req.body?.evidenceId; if (typeof id !== 'string' || !s.file.evidence.some(x => x.id === id)) return res.status(400).json({ error: { code: 'INVALID_EVIDENCE', message: 'That evidence item is not part of this case.' } }); if (!s.file.reviewedEvidenceIds.includes(id)) s.file.reviewedEvidenceIds.push(id); return res.json({ reviewedEvidenceIds: s.file.reviewedEvidenceIds }); });
app.put('/api/cases/:caseId/notes', requireUser, (req, res) => { const s = getOwned(req, res); if (!s) return; if (s.file.completed) return res.status(409).json({ error: { code: 'CASE_COMPLETED', message: 'This investigation is complete.' } }); const notes = req.body?.notes; if (typeof notes !== 'string' || notes.length > 10000) return res.status(400).json({ error: { code: 'INVALID_NOTES', message: 'Notes must be 10,000 characters or fewer.' } }); s.file.notes = notes; return res.json({ saved: true }); });
app.post('/api/cases/:caseId/accusation', requireUser, (req, res) => { const s = getOwned(req, res); if (!s) return; if (s.file.status !== 'ready') return res.status(409).json({ error: { code: 'CASE_NOT_READY', message: 'This case is still being prepared.' } }); if (s.result) return res.status(409).json({ error: { code: 'ALREADY_COMPLETED', message: 'A final accusation has already been submitted.' } }); const parsed = accusationSchema.safeParse(req.body); if (!parsed.success || !s.file.suspects.some(x => x.id === parsed.data?.suspectId)) return res.status(400).json({ error: { code: 'INVALID_ACCUSATION', message: 'Choose a suspect from this case.' } }); if (parsed.data.selectedEvidenceIds.some(id => !s.file.evidence.some(e => e.id === id))) return res.status(400).json({ error: { code: 'INVALID_EVIDENCE', message: 'Choose evidence from this case.' } }); s.result = scoreAccusation(s.file, parsed.data.suspectId, parsed.data.selectedEvidenceIds, s.file.reviewedEvidenceIds); s.file.completed = true; return res.json({ result: s.result }); });
app.get('/api/cases/:caseId/results', requireUser, (req, res) => { const s = getOwned(req, res); if (!s) return; if (!s.result) return res.status(403).json({ error: { code: 'REVEAL_LOCKED', message: 'Submit a final accusation to reveal the solution.' } }); return res.json({ result: s.result }); });
app.delete('/api/cases/:caseId', requireUser, (req, res) => { const s = getOwned(req, res); if (!s) return; cases.delete(s.file.id); return res.status(204).end(); });
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => { console.error('Unhandled API error', err instanceof Error ? err.name : 'unknown'); res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' } }); });
if (process.env.NODE_ENV !== 'test') app.listen(port, () => console.info(`AI Mystery Room fixture API listening on http://localhost:${port}`));
export { app, cases };
