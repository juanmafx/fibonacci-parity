export function simulateLegacySearch(target) {
  const sequence = [1n, 1n];
  let evenCount = 0;
  let oddCount = 0;
  while (oddCount < target) {
    const term = sequence.at(-1) + sequence.at(-2);
    sequence.push(term);
    if (term % 2n === 0n) evenCount += 1;
    else oddCount += 1;
  }
  return { sequenceLength: sequence.length, evenCount, oddCount, terminalValue: sequence.at(-1).toString() };
}

export function iterativeFibonacci(index) {
  let current = 0n;
  let next = 1n;
  for (let step = 0; step < index; step += 1) [current, next] = [next, current + next];
  return current;
}

export function greatestCommonDivisor(left, right) {
  return !right ? left : greatestCommonDivisor(right, left % right);
}
