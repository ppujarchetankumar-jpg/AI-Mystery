import assert from 'node:assert/strict';
import { test } from 'node:test';
import { makeFixtureCase, scoreAccusation } from './fixture.js';

test('fixture keeps solution fields out of the public case', () => {
  const file = makeFixtureCase('test-case');
  const serialized = JSON.stringify(file);
  assert.equal(serialized.includes('culpritSuspectId'), false);
  assert.equal(serialized.includes('evidenceInterpretations'), false);
  assert.equal(serialized.includes('motive'), false);
  assert.equal(file.suspects.length, 4);
  assert.equal(file.evidence.length, 8);
});

test('score is computed from private fixture truth', () => {
  const file = makeFixtureCase('test-case');
  assert.equal(scoreAccusation(file, 's-iris', ['ev-access', 'ev-chat', 'ev-fiber'], ['ev-access', 'ev-chat', 'ev-fiber', 'ev-cctv', 'ev-report', 'ev-schedule']).score, 100);
  assert.equal(scoreAccusation(file, 's-noah', [], []).score, 0);
});
