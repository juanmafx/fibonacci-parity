import assert from 'node:assert/strict';
import { test } from 'node:test';
import fc from 'fast-check';
import {
  countOddTerms,
  fibonacci,
  fibonacciModulo,
  indexOfOddTerm,
  isOddIndex,
  pisanoPeriod,
  searchOddTerm,
  createMulberry32,
  uniformInteger,
} from '../../src/index.js';
import { greatestCommonDivisor, iterativeFibonacci, simulateLegacySearch } from '../helpers/oracles.js';

const SETTINGS = { seed: 20261123, numRuns: 300 };
const index = fc.integer({ min: 0, max: 3_000 });
const positiveIndex = fc.integer({ min: 1, max: 3_000 });

test('fast doubling agrees with linear iteration', () => {
  fc.assert(fc.property(index, (n) => fibonacci(n) === iterativeFibonacci(n)), SETTINGS);
});

test('the recurrence holds', () => {
  fc.assert(fc.property(index, (n) => fibonacci(n + 2) === fibonacci(n + 1) + fibonacci(n)), SETTINGS);
});

test('Cassini identity holds', () => {
  fc.assert(
    fc.property(positiveIndex, (n) => {
      const expected = n % 2 === 0 ? 1n : -1n;
      return fibonacci(n - 1) * fibonacci(n + 1) - fibonacci(n) ** 2n === expected;
    }),
    SETTINGS,
  );
});

test('the gcd identity holds', () => {
  fc.assert(
    fc.property(positiveIndex, positiveIndex, (m, n) => {
      const divisor = greatestCommonDivisor(fibonacci(m), fibonacci(n));
      return divisor === fibonacci(greatestCommonDivisor(m, n));
    }),
    { ...SETTINGS, numRuns: 100 },
  );
});

test('modular evaluation agrees with exact reduction', () => {
  fc.assert(
    fc.property(index, fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }), (n, modulus) => {
      return BigInt(fibonacciModulo(n, modulus)) === fibonacci(n) % BigInt(modulus);
    }),
    SETTINGS,
  );
});

test('a term is odd exactly when its index is not divisible by three', () => {
  fc.assert(fc.property(index, (n) => (fibonacci(n) % 2n === 1n) === isOddIndex(n)), SETTINGS);
});

test('indexOfOddTerm inverts countOddTerms', () => {
  fc.assert(
    fc.property(fc.integer({ min: 1, max: 1_000_000_000 }), (rank) => {
      const position = indexOfOddTerm(rank);
      return isOddIndex(position) && countOddTerms(position) === rank && countOddTerms(position - 1) === rank - 1;
    }),
    SETTINGS,
  );
});

test('closed-form search agrees with the simulated legacy loop', () => {
  fc.assert(
    fc.property(fc.integer({ min: 1, max: 1_500 }), (target) => {
      const { sequenceLength, evenCount, oddCount, terminalValue } = searchOddTerm({ target });
      assert.deepEqual({ sequenceLength, evenCount, oddCount, terminalValue }, simulateLegacySearch(target));
    }),
    { ...SETTINGS, numRuns: 100 },
  );
});

test('the Pisano period is the minimal period and respects the 6m bound', () => {
  fc.assert(
    fc.property(fc.integer({ min: 2, max: 400 }), (modulus) => {
      const period = pisanoPeriod(modulus);
      assert.ok(period <= 6 * modulus);
      assert.equal(fibonacciModulo(period, modulus), 0);
      assert.equal(fibonacciModulo(period + 1, modulus), 1);
      for (let candidate = 1; candidate < period; candidate += 1) {
        const repeats = fibonacciModulo(candidate, modulus) === 0 && fibonacciModulo(candidate + 1, modulus) === 1;
        assert.equal(repeats, false);
      }
    }),
    { ...SETTINGS, numRuns: 100 },
  );
});

test('uniformInteger stays inside the requested range', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 0xffffffff }),
      fc.integer({ min: -1_000, max: 1_000 }),
      fc.integer({ min: 0, max: 0xffffffff }),
      (seed, min, span) => {
        const value = uniformInteger(createMulberry32(seed), min, min + span);
        return Number.isInteger(value) && value >= min && value <= min + span;
      },
    ),
    SETTINGS,
  );
});
