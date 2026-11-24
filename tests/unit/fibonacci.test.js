import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fibonacci, fibonacciModulo, fibonacciTerms, ValidationError } from '../../src/index.js';

const KNOWN_TERMS = [0n, 1n, 1n, 2n, 3n, 5n, 8n, 13n, 21n, 34n, 55n, 89n, 144n];

test('fibonacci matches the published initial terms', () => {
  KNOWN_TERMS.forEach((term, index) => assert.equal(fibonacci(index), term));
});

test('fibonacci stays exact beyond the safe integer range', () => {
  assert.equal(fibonacci(78), 8944394323791464n);
  assert.equal(fibonacci(79), 14472334024676221n);
  assert.equal(fibonacci(100), 354224848179261915075n);
});

test('fibonacciTerms yields the sequence from index one', () => {
  const terms = fibonacciTerms();
  KNOWN_TERMS.slice(1).forEach((term) => assert.equal(terms.next().value, term));
});

test('fibonacciModulo handles modulus one and large indices', () => {
  assert.equal(fibonacciModulo(12345, 1), 0);
  assert.equal(fibonacciModulo(0, 7), 0);
  assert.equal(fibonacciModulo(1_000_000_000_000, 2), fibonacciModulo(1_000_000_000_000 % 3, 2));
});

for (const invalid of [-1, 1.5, Number.NaN, Infinity, '7', 7n, null]) {
  test(`fibonacci rejects ${String(invalid)}`, () => {
    assert.throws(() => fibonacci(invalid), ValidationError);
  });
}

test('fibonacciModulo rejects a zero modulus', () => {
  assert.throws(() => fibonacciModulo(5, 0), ValidationError);
});
