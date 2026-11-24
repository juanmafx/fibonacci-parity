import { requireIntegerInRange } from '../shared/validation.js';

const MAX = Number.MAX_SAFE_INTEGER;

export function isOddIndex(index) {
  requireIntegerInRange(index, 'index', 0, MAX);
  return index % 3 !== 0;
}

export function countEvenTerms(lastIndex) {
  requireIntegerInRange(lastIndex, 'lastIndex', 0, MAX);
  return Math.floor(lastIndex / 3);
}

export function countOddTerms(lastIndex) {
  return lastIndex - countEvenTerms(lastIndex);
}

export function indexOfOddTerm(rank) {
  requireIntegerInRange(rank, 'rank', 1, Math.floor((MAX / 3) * 2));
  return rank + Math.floor((rank - 1) / 2);
}
