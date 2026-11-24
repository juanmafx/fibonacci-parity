import { parseArgs } from 'node:util';
import { describePisano, describeTerm } from '../../application.js';
import { sampleParity } from '../../experiments/paritySampling.js';
import { searchOddTerm } from '../../experiments/oddTermSearch.js';
import { LIMITS } from '../../shared/limits.js';
import { parseIntegerInRange, ValidationError } from '../../shared/validation.js';

export const USAGE = `Usage: fibonacci-odds <command> [options]

Commands:
  search  --target <n> [--include-seeds]   Locate the n-th odd term (default target: 50)
  term    --index <n>                      Print an exact Fibonacci term
  sample  --samples <n> --max-index <n> --seed <n>
                                           Estimate the odd proportion reproducibly
  pisano  --modulus <n>                    Compute the Pisano period
  serve                                    Start the HTTP API (HOST, PORT)
`;

const COMMANDS = {
  search: {
    options: { target: { type: 'string', default: '50' }, 'include-seeds': { type: 'boolean', default: false } },
    execute: (values) =>
      searchOddTerm({
        target: parseIntegerInRange(values.target, 'target', 1, LIMITS.maxOddTarget),
        includeSeeds: values['include-seeds'],
      }),
  },
  term: {
    options: { index: { type: 'string' } },
    execute: (values) => describeTerm(parseIntegerInRange(values.index, 'index', 0, LIMITS.maxIndex)),
  },
  sample: {
    options: {
      samples: { type: 'string', default: '1000' },
      'max-index': { type: 'string', default: '1000000' },
      seed: { type: 'string', default: '42' },
    },
    execute: (values) =>
      sampleParity({
        samples: parseIntegerInRange(values.samples, 'samples', 1, LIMITS.maxSamples),
        maxIndex: parseIntegerInRange(values['max-index'], 'max-index', 1, LIMITS.maxSampleIndex),
        seed: parseIntegerInRange(values.seed, 'seed', 0, LIMITS.maxSeed),
      }),
  },
  pisano: {
    options: { modulus: { type: 'string' } },
    execute: (values) => describePisano(parseIntegerInRange(values.modulus, 'modulus', 1, LIMITS.maxModulus)),
  },
};

export function runCli(argv, { stdout, stderr }) {
  const [commandName, ...rest] = argv;
  if (commandName === undefined || commandName === '--help' || commandName === 'help') {
    stdout.write(USAGE);
    return commandName === undefined ? 2 : 0;
  }
  const command = Object.hasOwn(COMMANDS, commandName) ? COMMANDS[commandName] : null;
  if (!command) {
    stderr.write(`Unknown command.\n${USAGE}`);
    return 2;
  }
  try {
    const { values } = parseArgs({ args: rest, options: command.options, strict: true, allowPositionals: false });
    stdout.write(`${JSON.stringify(command.execute(values), null, 2)}\n`);
    return 0;
  } catch (error) {
    if (error instanceof ValidationError || error?.code?.startsWith('ERR_PARSE_ARGS')) {
      stderr.write(`${error.message}\n`);
      return 2;
    }
    throw error;
  }
}
