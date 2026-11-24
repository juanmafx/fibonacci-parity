import { fibonacci } from './domain/fibonacci.js';
import { isOddIndex } from './domain/parity.js';
import { pisanoPeriod } from './domain/pisano.js';
import { LIMITS } from './shared/limits.js';
import { requireIntegerInRange } from './shared/validation.js';

export function describeTerm(index) {
  requireIntegerInRange(index, 'index', 0, LIMITS.maxIndex);
  return {
    index,
    value: fibonacci(index).toString(),
    parity: isOddIndex(index) ? 'odd' : 'even',
  };
}

export function describePisano(modulus) {
  return { modulus, period: pisanoPeriod(modulus) };
}
