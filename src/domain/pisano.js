import { requireIntegerInRange } from '../shared/validation.js';
import { LIMITS } from '../shared/limits.js';

export function pisanoPeriod(modulus) {
  requireIntegerInRange(modulus, 'modulus', 1, LIMITS.maxModulus);
  if (modulus === 1) return 1;
  let previous = 0;
  let current = 1;
  for (let period = 1; period <= 6 * modulus; period += 1) {
    [previous, current] = [current, (previous + current) % modulus];
    if (previous === 0 && current === 1) return period;
  }
  throw new RangeError('period exceeded the 6m upper bound');
}
