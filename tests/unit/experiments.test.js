import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  countEvenTerms,
  countOddTerms,
  describeTerm,
  indexOfOddTerm,
  LIMITS,
  pisanoPeriod,
  sampleParity,
  searchOddTerm,
  ValidationError,
  wilsonInterval,
} from '../../src/index.js';

const PUBLISHED_PISANO_PERIODS = [1, 3, 8, 6, 20, 24, 16, 12, 24, 60, 10, 24, 28, 48, 40, 24, 36, 24, 18, 60];

test('search reproduces the result of the original 2020 script', () => {
  assert.deepEqual(searchOddTerm({ target: 50 }), {
    target: 50,
    includeSeeds: false,
    sequenceLength: 77,
    oddCount: 50,
    evenCount: 25,
    terminalValue: '5527939700884757',
  });
});

test('search can count the two seed terms', () => {
  const result = searchOddTerm({ target: 2, includeSeeds: true });
  assert.equal(result.sequenceLength, 2);
  assert.equal(result.evenCount, 0);
  assert.equal(result.terminalValue, '1');
});

test('search enforces its bounds', () => {
  assert.throws(() => searchOddTerm({ target: 0 }), ValidationError);
  assert.throws(() => searchOddTerm({ target: LIMITS.maxOddTarget + 1 }), ValidationError);
  assert.ok(searchOddTerm({ target: LIMITS.maxOddTarget }).sequenceLength <= LIMITS.maxIndex);
});

test('parity counters handle the boundaries', () => {
  assert.equal(countEvenTerms(0), 0);
  assert.equal(countOddTerms(0), 0);
  assert.equal(countEvenTerms(3), 1);
  assert.equal(countOddTerms(3), 2);
  assert.equal(indexOfOddTerm(1), 1);
  assert.equal(indexOfOddTerm(3), 4);
});

test('pisano matches the published periods', () => {
  PUBLISHED_PISANO_PERIODS.forEach((period, offset) => assert.equal(pisanoPeriod(offset + 1), period));
});

test('pisano rejects out of range moduli', () => {
  assert.throws(() => pisanoPeriod(0), ValidationError);
  assert.throws(() => pisanoPeriod(LIMITS.maxModulus + 1), ValidationError);
});

test('term description reports value and parity', () => {
  assert.deepEqual(describeTerm(3), { index: 3, value: '2', parity: 'even' });
  assert.deepEqual(describeTerm(7), { index: 7, value: '13', parity: 'odd' });
  assert.throws(() => describeTerm(LIMITS.maxIndex + 1), ValidationError);
});

test('wilson interval matches reference values', () => {
  const half = wilsonInterval(5, 10);
  assert.ok(Math.abs(half.lower - 0.2366) < 1e-4);
  assert.ok(Math.abs(half.upper - 0.7634) < 1e-4);
  const none = wilsonInterval(0, 10);
  assert.equal(none.lower, 0);
  assert.ok(Math.abs(none.upper - 0.2775) < 1e-4);
  assert.equal(wilsonInterval(10, 10).upper, 1);
});

test('wilson interval rejects impossible counts', () => {
  assert.throws(() => wilsonInterval(1, 0), RangeError);
  assert.throws(() => wilsonInterval(11, 10), RangeError);
  assert.throws(() => wilsonInterval(-1, 10), RangeError);
});

test('sampling is reproducible for a fixed seed', () => {
  const options = { samples: 2_000, maxIndex: 1_000_000, seed: 7 };
  assert.deepEqual(sampleParity(options), sampleParity(options));
  assert.notDeepEqual(sampleParity(options), sampleParity({ ...options, seed: 8 }));
});

test('sampling keeps its golden output for seed 7', () => {
  assert.equal(sampleParity({ samples: 20_000, maxIndex: 1_000_000_000, seed: 7 }).oddCount, 13_212);
});

test('sampling validates every parameter', () => {
  const valid = { samples: 10, maxIndex: 10, seed: 1 };
  assert.throws(() => sampleParity({ ...valid, samples: 0 }), ValidationError);
  assert.throws(() => sampleParity({ ...valid, samples: LIMITS.maxSamples + 1 }), ValidationError);
  assert.throws(() => sampleParity({ ...valid, maxIndex: 0 }), ValidationError);
  assert.throws(() => sampleParity({ ...valid, seed: -1 }), ValidationError);
  assert.throws(() => sampleParity({ ...valid, seed: LIMITS.maxSeed + 1 }), ValidationError);
});
