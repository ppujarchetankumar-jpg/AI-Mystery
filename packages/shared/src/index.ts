import { z } from 'zod';

export const genres = ['classic_detective', 'heist', 'missing_object', 'campus_mystery', 'sci_fi', 'thriller'] as const;
export const difficulties = ['easy', 'medium', 'hard'] as const;
export const evidenceTypes = ['chat_transcript', 'image', 'cctv_stills', 'cctv_log', 'witness_statement', 'document', 'timeline_event'] as const;
export type Genre = typeof genres[number];
export type Difficulty = typeof difficulties[number];
export type EvidenceType = typeof evidenceTypes[number];
export type Suspect = { id: string; displayName: string; role: string; biography: string; publicRelationship: string; publicStatement?: string };
export type TimelineEvent = { id: string; label: string; timeLabel: string; description: string; sourceEvidenceIds: string[] };
export type EvidenceBody = { kind: EvidenceType; [key: string]: unknown };
export type Evidence = { id: string; type: EvidenceType; title: string; shortDescription: string; sourceLabel: string; occurredAtLabel?: string; body: EvidenceBody };
export type PublicCase = { id: string; title: string; status: 'ready' | 'generating' | 'failed'; genre: Genre; difficulty: Difficulty; createdAt: string; publicBriefing: { summary: string; incidentType: string; locationLabel: string; incidentWindow: { startLabel: string; endLabel: string }; publicRules: string[] }; suspects: Suspect[]; timeline: TimelineEvent[]; evidence: Evidence[]; mediaStatus: 'fallback'; reviewedEvidenceIds: string[]; notes: string; completed: boolean };
export type PublicResult = { isCorrect: boolean; accusedSuspectId: string; score: number; scoreBreakdown: { culprit: number; evidence: number; reasoning: number }; culprit: { suspectId: string; name: string }; explanation: { motive: string; method: string; opportunity: string; conciseTruth: string }; canonicalTimeline: Array<{ timeLabel: string; fact: string }>; evidenceInterpretations: Array<{ evidenceId: string; classification: string; explanation: string }> };
export const createCaseSchema = z.object({ scenario: z.string().trim().min(50).max(1500), genre: z.enum(genres).default('classic_detective'), difficulty: z.enum(difficulties).default('medium'), includeImages: z.boolean().default(true), includeCctvStills: z.boolean().default(true) });
export const accusationSchema = z.object({ suspectId: z.string().min(1), selectedEvidenceIds: z.array(z.string()).max(3).default([]), reasoning: z.string().max(1000).optional() });
export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type AccusationInput = z.infer<typeof accusationSchema>;
export type SafeJob = { caseId: string; status: 'queued' | 'validating_input' | 'generating_blueprint' | 'validating_case' | 'generating_media' | 'persisting' | 'ready' | 'failed'; stage: string; safeProgressMessage: string };
