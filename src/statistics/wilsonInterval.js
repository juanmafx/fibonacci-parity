export const Z_95 = 1.959963984540054;

export function wilsonInterval(successes, trials, z = Z_95) {
  if (!Number.isSafeInteger(trials) || trials < 1) {
    throw new RangeError('trials must be a positive integer');
  }
  if (!Number.isSafeInteger(successes) || successes < 0 || successes > trials) {
    throw new RangeError('successes must be an integer between 0 and trials');
  }
  const proportion = successes / trials;
  const zSquared = z * z;
  const denominator = 1 + zSquared / trials;
  const center = (proportion + zSquared / (2 * trials)) / denominator;
  const margin =
    (z / denominator) *
    Math.sqrt((proportion * (1 - proportion)) / trials + zSquared / (4 * trials * trials));
  return {
    lower: successes === 0 ? 0 : Math.max(0, center - margin),
    upper: successes === trials ? 1 : Math.min(1, center + margin),
  };
}
