import { parseIntegerInRange, ValidationError } from '../../shared/validation.js';

const HOST_PATTERN = /^[A-Za-z0-9.:-]{1,253}$/;

export function loadServerConfig(environment) {
  const host = environment.HOST ?? '127.0.0.1';
  if (!HOST_PATTERN.test(host)) throw new ValidationError('HOST is not a valid host name');
  const port = parseIntegerInRange(environment.PORT ?? '8000', 'PORT', 0, 65_535);
  return { host, port };
}
