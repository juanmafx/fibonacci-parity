import { requireIntegerInRange } from '../shared/validation.js';

function fastDoubling(index, reduce) {
  let current = 0n;
  let next = 1n;
  for (const bit of index.toString(2)) {
    const doubled = reduce(current * (2n * next - current));
    const advanced = reduce(current * current + next * next);
    if (bit === '1') {
      current = advanced;
      next = reduce(doubled + advanced);
    } else {
      current = doubled;
      next = advanced;
    }
  }
  return current;
}

export function fibonacci(index) {
  requireIntegerInRange(index, 'index', 0, Number.MAX_SAFE_INTEGER);
  return fastDoubling(index, (value) => value);
}

export function fibonacciModulo(index, modulus) {
  requireIntegerInRange(index, 'index', 0, Number.MAX_SAFE_INTEGER);
  requireIntegerInRange(modulus, 'modulus', 1, Number.MAX_SAFE_INTEGER);
  const divisor = BigInt(modulus);
  const reduce = (value) => ((value % divisor) + divisor) % divisor;
  return Number(reduce(fastDoubling(index, reduce)));
}

export function* fibonacciTerms() {
  let current = 1n;
  let next = 1n;
  for (;;) {
    yield current;
    [current, next] = [next, current + next];
  }
}
