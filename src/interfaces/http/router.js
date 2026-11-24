import { describePisano, describeTerm } from '../../application.js';
import { sampleParity } from '../../experiments/paritySampling.js';
import { searchOddTerm } from '../../experiments/oddTermSearch.js';
import { LIMITS } from '../../shared/limits.js';
import { parseBoolean, parseIntegerInRange, ValidationError } from '../../shared/validation.js';

const ENDPOINTS = [
  'GET /healthz',
  'GET /v1/terms/{index}',
  'GET /v1/odd-search?target={n}&includeSeeds={true|false}',
  'GET /v1/parity-sample?samples={n}&maxIndex={n}&seed={n}',
  'GET /v1/pisano/{modulus}',
];

function readQuery(searchParams, allowedNames) {
  const query = {};
  for (const name of new Set(searchParams.keys())) {
    if (!allowedNames.includes(name)) throw new ValidationError(`unknown parameter: ${name.slice(0, 32)}`);
    if (searchParams.getAll(name).length > 1) throw new ValidationError(`duplicate parameter: ${name}`);
    query[name] = searchParams.get(name);
  }
  return query;
}

function requireNoQuery(searchParams) {
  readQuery(searchParams, []);
}

const STATIC_ROUTES = new Map([
  ['/', (searchParams) => {
    requireNoQuery(searchParams);
    return { service: 'sigularesEnFivona', endpoints: ENDPOINTS };
  }],
  ['/healthz', (searchParams) => {
    requireNoQuery(searchParams);
    return { status: 'ok' };
  }],
  ['/v1/odd-search', (searchParams) => {
    const query = readQuery(searchParams, ['target', 'includeSeeds']);
    return searchOddTerm({
      target: parseIntegerInRange(query.target ?? '50', 'target', 1, LIMITS.maxOddTarget),
      includeSeeds: parseBoolean(query.includeSeeds ?? 'false', 'includeSeeds'),
    });
  }],
  ['/v1/parity-sample', (searchParams) => {
    const query = readQuery(searchParams, ['samples', 'maxIndex', 'seed']);
    return sampleParity({
      samples: parseIntegerInRange(query.samples ?? '1000', 'samples', 1, LIMITS.maxSamples),
      maxIndex: parseIntegerInRange(query.maxIndex ?? '1000000', 'maxIndex', 1, LIMITS.maxSampleIndex),
      seed: parseIntegerInRange(query.seed ?? '42', 'seed', 0, LIMITS.maxSeed),
    });
  }],
]);

const PARAMETER_ROUTES = [
  {
    pattern: /^\/v1\/terms\/([^/]+)$/,
    handle: (text) => describeTerm(parseIntegerInRange(text, 'index', 0, LIMITS.maxIndex)),
  },
  {
    pattern: /^\/v1\/pisano\/([^/]+)$/,
    handle: (text) => describePisano(parseIntegerInRange(text, 'modulus', 1, LIMITS.maxModulus)),
  },
];

export function resolveRoute(pathname, searchParams) {
  const staticRoute = STATIC_ROUTES.get(pathname);
  if (staticRoute) return () => staticRoute(searchParams);
  for (const { pattern, handle } of PARAMETER_ROUTES) {
    const match = pattern.exec(pathname);
    if (match) {
      return () => {
        requireNoQuery(searchParams);
        return handle(match[1]);
      };
    }
  }
  return null;
}
