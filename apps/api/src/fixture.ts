import type { PublicCase, PublicResult, Evidence } from '@mystery/shared';

export const fixtureSolution = {
  culpritSuspectId: 's-iris',
  motive: 'Iris Vale had secretly sold the observatory lens to cover a debt and needed the theft to look like a spontaneous break-in.',
  method: 'She used her curator access to unlock the east service corridor, moved the lens in a padded instrument case, and staged a brief power interruption.',
  opportunity: 'The corridor access log and the 21:14 camera gap place Iris alone beside the vault after she claimed to be in the lecture hall.',
  conciseTruth: 'Curator Iris Vale stole the Halcyon lens during the staged outage. Three independent clues connect her access, false alibi, and the distinctive case used to carry it.',
  acceptedReasoningEvidenceIds: ['ev-access', 'ev-chat', 'ev-fiber'],
  canonicalTimeline: [
    { timeLabel: '20:42', fact: 'The night guard begins rounds; the lens is still secured in the east vault.' },
    { timeLabel: '21:06', fact: 'Iris signs out a padded instrument case, claiming it is for catalog photography.' },
    { timeLabel: '21:14', fact: 'A short power interruption leaves the east corridor camera without a frame.' },
    { timeLabel: '21:19', fact: 'The east service door opens with Iris’s curator credential.' },
    { timeLabel: '21:31', fact: 'The vault is found empty; no forced entry is present.' },
  ],
  evidenceInterpretations: [
    { evidenceId: 'ev-access', classification: 'critical', explanation: 'The east door credential belongs to Iris and places her at the route to the vault.' },
    { evidenceId: 'ev-chat', classification: 'supporting', explanation: 'Iris claims she was in the lecture hall during the access event, but the sign-in sheet puts her elsewhere.' },
    { evidenceId: 'ev-fiber', classification: 'critical', explanation: 'A blue velvet fiber from the transport case matches the lining listed on Iris’s case checkout.' },
    { evidenceId: 'ev-cctv', classification: 'supporting', explanation: 'The camera gap aligns with the corridor entry window; the guard’s reset was automatic, not deliberate.' },
    { evidenceId: 'ev-witness', classification: 'red_herring', explanation: 'Noah’s hurried departure looks suspicious, but the witness confirms he left before the lens disappeared.' },
    { evidenceId: 'ev-receipt', classification: 'neutral', explanation: 'The late-night coffee receipt explains a timestamp but does not identify the thief.' },
    { evidenceId: 'ev-report', classification: 'critical', explanation: 'The vault was opened with a valid key, ruling out the forced-entry theory.' },
    { evidenceId: 'ev-schedule', classification: 'supporting', explanation: 'The public schedule contradicts Iris’s stated lecture-hall alibi.' },
  ],
};

export function makeFixtureCase(id: string, scenario = 'A priceless observatory lens vanishes during a stormy public lecture at the old hilltop museum.', createdAt = new Date().toISOString()): PublicCase {
  const evidence: Evidence[] = [
    { id: 'ev-access', type: 'document', title: 'East Door Access Log', shortDescription: 'An export of badge events for the service corridor.', sourceLabel: 'Museum security desk', occurredAtLabel: '21:00–21:30', body: { kind: 'document', documentType: 'Access log', documentDateLabel: '14 October, 21:34', issuerLabel: 'Facilities system', contentBlocks: [{ label: '21:19', text: 'Credential IV-04 opened east service door.' }, { label: '21:22', text: 'Door closed; no forced-entry alert.' }] } },
    { id: 'ev-chat', type: 'chat_transcript', title: 'Curator’s Message Thread', shortDescription: 'A short exchange from the evening of the disappearance.', sourceLabel: 'Fictional message transcript', occurredAtLabel: '20:58–21:16', body: { kind: 'chat_transcript', participants: ['Iris', 'Mara'], messages: [{ timestampLabel: '20:58', senderId: 'Iris', text: 'I’m staying for the lecture until the end.' }, { timestampLabel: '21:16', senderId: 'Iris', text: 'The east wing is dark. I’m checking the breaker.' }] } },
    { id: 'ev-fiber', type: 'image', title: 'Fiber on the Vault Latch', shortDescription: 'A close-up record of a blue fiber recovered from the latch.', sourceLabel: 'Fictional evidence photograph', occurredAtLabel: '21:38', body: { kind: 'image', caption: 'Blue velvet fiber recovered from the inside edge of the latch.', altText: 'A single blue thread on a brass latch, photographed under neutral desk light.', visibleDetails: ['One blue fiber', 'No visible damage to the latch'], imageLabel: 'AI-generated evidence illustration' } },
    { id: 'ev-cctv', type: 'cctv_stills', title: 'East Corridor Camera', shortDescription: 'Two still frames around the brief recording gap.', sourceLabel: 'Camera E-2, fictional still sequence', occurredAtLabel: '21:12–21:20', body: { kind: 'cctv_stills', cameraLabel: 'E-2 · East corridor', frames: [{ timestampLabel: '21:12:08', publicFrameDescription: 'Empty corridor; lights on.' }, { timestampLabel: '21:20:41', publicFrameDescription: 'Door settling closed; image is grainy.' }] } },
    { id: 'ev-witness', type: 'witness_statement', title: 'Noah’s Closing Statement', shortDescription: 'The volunteer recalls leaving before the alarm.', sourceLabel: 'Interview with Noah Bell', occurredAtLabel: '22:05', body: { kind: 'witness_statement', witnessName: 'Noah Bell', statementAtLabel: '22:05', statementText: 'I left through the front doors just after nine. The lecture was still going. I did not go near the east wing.' } },
    { id: 'ev-receipt', type: 'document', title: 'Café Receipt', shortDescription: 'A time-stamped purchase near the museum entrance.', sourceLabel: 'Fictional café receipt', occurredAtLabel: '21:24', body: { kind: 'document', documentType: 'Receipt', documentDateLabel: '14 October, 21:24', issuerLabel: 'North Steps Café', contentBlocks: [{ label: 'Order', text: 'Two coffees, takeaway.' }, { label: 'Payment', text: 'Cash · counter camera unavailable' }] } },
    { id: 'ev-report', type: 'cctv_log', title: 'Vault Sensor Summary', shortDescription: 'A system report for the vault door and room sensor.', sourceLabel: 'Museum security system', occurredAtLabel: '20:30–22:00', body: { kind: 'cctv_log', cameraLabel: 'Vault V-1 sensors', recordingWindow: '20:30–22:00', events: [{ timestampLabel: '20:42', text: 'Door sealed; room motion normal.' }, { timestampLabel: '21:14', text: 'Power interruption; sensor buffer retained.' }, { timestampLabel: '21:31', text: 'Door opened with valid mechanical key.' }], publicGaps: ['Camera E-2 missed one short interval during the power reset.'] } },
    { id: 'ev-schedule', type: 'timeline_event', title: 'Lecture Attendance Sheet', shortDescription: 'A sign-in sheet from the public astronomy lecture.', sourceLabel: 'Museum lecture desk', occurredAtLabel: '20:30–21:30', body: { kind: 'timeline_event', eventLabel: 'Lecture attendance', timeLabel: '20:30–21:30', description: 'Iris Vale signed in at 20:31 but was not recorded in the room after the intermission at 21:05.' } },
  ];
  return {
    id, title: 'The Halcyon Lens', status: 'ready', genre: 'classic_detective', difficulty: 'medium', createdAt,
    publicBriefing: { summary: `During a stormy evening at the North Steps Observatory, a rare brass telescope lens vanished from a locked vault. The storm interrupted power for less than a minute, and four people had reason to be near the east wing. ${scenario.slice(0, 180)}`, incidentType: 'A museum object has gone missing', locationLabel: 'North Steps Observatory · East Wing', incidentWindow: { startLabel: '14 October · 20:30', endLabel: '14 October · 21:40' }, publicRules: ['The lens was last confirmed in the vault at 20:42.', 'The east wing remained staff-only during the lecture.', 'No forced entry was found.'] },
    suspects: [
      { id: 's-iris', displayName: 'Iris Vale', role: 'Collections curator', biography: 'A precise cataloguer who has worked at the observatory for six years.', publicRelationship: 'Responsible for the lens collection and its inventory.', publicStatement: '“I was in the lecture hall when the lights flickered.”' },
      { id: 's-noah', displayName: 'Noah Bell', role: 'Volunteer guide', biography: 'A friendly astronomy student who knows the public galleries well.', publicRelationship: 'Helped prepare the lecture room and left during the event.', publicStatement: '“I never went into the east wing.”' },
      { id: 's-mara', displayName: 'Mara Chen', role: 'Facilities engineer', biography: 'Maintains the building systems and knows the service corridors.', publicRelationship: 'Was on call when the storm affected the building power.', publicStatement: '“The breaker reset itself. I did not touch the vault.”' },
      { id: 's-owen', displayName: 'Owen Pike', role: 'Visiting donor', biography: 'A collector who funded the new lecture room and requested a private viewing.', publicRelationship: 'Had seen the lens during a preview earlier that week.', publicStatement: '“I left before the lecture began.”' },
    ],
    timeline: [
      { id: 'tl-1', label: 'Last verified in vault', timeLabel: '20:42', description: 'Vault sensors report the lens secured.', sourceEvidenceIds: ['ev-report'] },
      { id: 'tl-2', label: 'Power interruption', timeLabel: '21:14', description: 'A brief reset affects the east corridor camera.', sourceEvidenceIds: ['ev-cctv', 'ev-report'] },
      { id: 'tl-3', label: 'East door access', timeLabel: '21:19', description: 'A curator credential opens the service door.', sourceEvidenceIds: ['ev-access'] },
      { id: 'tl-4', label: 'Lens reported missing', timeLabel: '21:31', description: 'The vault is found open with no forced entry.', sourceEvidenceIds: ['ev-report'] },
    ], evidence, mediaStatus: 'fallback', reviewedEvidenceIds: [], notes: '', completed: false,
  };
}

export function scoreAccusation(caseFile: PublicCase, suspectId: string, selectedEvidenceIds: string[], reviewedEvidenceIds: string[] = []): PublicResult {
  const isCorrect = suspectId === fixtureSolution.culpritSuspectId;
  const accepted = new Set(fixtureSolution.acceptedReasoningEvidenceIds);
  const selected = new Set(selectedEvidenceIds);
  const matched = [...selected].filter(id => accepted.has(id)).length;
  const target = Math.min(3, accepted.size);
  const critical = new Set(fixtureSolution.evidenceInterpretations.filter(x => ['critical', 'supporting'].includes(x.classification)).map(x => x.evidenceId));
  const reviewed = new Set(reviewedEvidenceIds);
  const culprit = isCorrect ? 60 : 0;
  const evidence = target === 0 ? 0 : Math.round((25 * Math.min(matched, target)) / target);
  const reasoningPoints = critical.size === 0 ? 0 : Math.round((15 * [...critical].filter(id => reviewed.has(id)).length) / critical.size);
  const name = caseFile.suspects.find(x => x.id === fixtureSolution.culpritSuspectId)?.displayName ?? 'Unknown';
  return { isCorrect, accusedSuspectId: suspectId, score: culprit + evidence + reasoningPoints, scoreBreakdown: { culprit, evidence, reasoning: reasoningPoints }, culprit: { suspectId: fixtureSolution.culpritSuspectId, name }, explanation: { motive: fixtureSolution.motive, method: fixtureSolution.method, opportunity: fixtureSolution.opportunity, conciseTruth: fixtureSolution.conciseTruth }, canonicalTimeline: fixtureSolution.canonicalTimeline, evidenceInterpretations: fixtureSolution.evidenceInterpretations.map(x => ({ evidenceId: x.evidenceId, classification: x.classification, explanation: x.explanation })) };
}
