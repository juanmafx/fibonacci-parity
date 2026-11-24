import { fibonacci } from '../domain/fibonacci.js';
import { countEvenTerms, indexOfOddTerm } from '../domain/parity.js';
import { LIMITS } from '../shared/limits.js';
import { requireBoolean, requireIntegerInRange } from '../shared/validation.js';

const SEED_TERMS = 2;

export function searchOddTerm({ target, includeSeeds = false }) {
  requireIntegerInRange(target, 'target', 1, LIMITS.maxOddTarget);
  requireBoolean(includeSeeds, 'includeSeeds');
  const skippedOddTerms = includeSeeds ? 0 : SEED_TERMS;
  const sequenceLength = indexOfOddTerm(target + skippedOddTerms);
  return {
    target,
    includeSeeds,
    sequenceLength,
    oddCount: target,
    evenCount: countEvenTerms(sequenceLength),
    terminalValue: fibonacci(sequenceLength).toString(),
  };
}
