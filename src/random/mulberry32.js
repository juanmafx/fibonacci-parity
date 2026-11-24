import { requireIntegerInRange } from '../shared/validation.js';
import { LIMITS } from '../shared/limits.js';

export function createMulberry32(seed) {
  requireIntegerInRange(seed, 'seed', 0, LIMITS.maxSeed);
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed);
    return (mixed ^ (mixed >>> 14)) >>> 0;
  };
}

export function uniformInteger(nextUint32, min, max) {
  const range = max - min + 1;
  const space = 0x1_0000_0000;
  if (!Number.isSafeInteger(range) || range < 1 || range > space) {
    throw new RangeError('range must span between 1 and 2^32 values');
  }
  const limit = space - (space % range);
  let draw = nextUint32();
  while (draw >= limit) draw = nextUint32();
  return min + (draw % range);
}
