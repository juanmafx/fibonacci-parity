import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createMulberry32, sampleParity, uniformInteger } from '../../src/index.js';

const CHI_SQUARE_CRITICAL_DF5_ALPHA_001 = 20.515;

test('uniformInteger passes a chi-square uniformity test', () => {
  const buckets = new Array(6).fill(0);
  const nextUint32 = createMulberry32(20261123);
  const draws = 60_000;
  for (let drawn = 0; drawn < draws; drawn += 1) buckets[uniformInteger(nextUint32, 0, 5)] += 1;
  const expected = draws / buckets.length;
  const statistic = buckets.reduce((sum, count) => sum + (count - expected) ** 2 / expected, 0);
  assert.ok(statistic < CHI_SQUARE_CRITICAL_DF5_ALPHA_001, `chi-square statistic was ${statistic}`);
});

test('uniformInteger rejects draws above the unbiased limit', () => {
  const draws = [0xffffffff, 5];
  assert.equal(uniformInteger(() => draws.shift(), 0, 2), 2);
  assert.equal(draws.length, 0);
});

test('95 percent Wilson intervals cover the exact proportion near the nominal rate', () => {
  const seeds = 400;
  let covered = 0;
  for (let seed = 0; seed < seeds; seed += 1) {
    const { exactProportion, confidenceInterval95: interval } = sampleParity({
      samples: 300,
      maxIndex: 999_999,
      seed,
    });
    if (interval.lower <= exactProportion && exactProportion <= interval.upper) covered += 1;
  }
  const coverage = covered / seeds;
  assert.ok(coverage >= 0.92 && coverage <= 0.98, `coverage was ${coverage}`);
});

test('the estimate converges to two thirds', () => {
  const { estimate, exactProportion } = sampleParity({ samples: 20_000, maxIndex: 999_999_999, seed: 11 });
  assert.equal(exactProportion, 2 / 3);
  assert.ok(Math.abs(estimate - exactProportion) < 0.015);
});
