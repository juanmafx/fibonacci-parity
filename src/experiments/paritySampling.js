import { fibonacciModulo } from '../domain/fibonacci.js';
import { countOddTerms } from '../domain/parity.js';
import { createMulberry32, uniformInteger } from '../random/mulberry32.js';
import { wilsonInterval } from '../statistics/wilsonInterval.js';
import { LIMITS } from '../shared/limits.js';
import { requireIntegerInRange } from '../shared/validation.js';

export function sampleParity({ samples, maxIndex, seed }) {
  requireIntegerInRange(samples, 'samples', 1, LIMITS.maxSamples);
  requireIntegerInRange(maxIndex, 'maxIndex', 1, LIMITS.maxSampleIndex);
  const nextUint32 = createMulberry32(seed);
  let oddCount = 0;
  for (let drawn = 0; drawn < samples; drawn += 1) {
    const index = uniformInteger(nextUint32, 1, maxIndex);
    oddCount += fibonacciModulo(index, 2);
  }
  return {
    samples,
    maxIndex,
    seed,
    oddCount,
    estimate: oddCount / samples,
    exactProportion: countOddTerms(maxIndex) / maxIndex,
    confidenceInterval95: wilsonInterval(oddCount, samples),
  };
}
