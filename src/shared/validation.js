export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function requireIntegerInRange(value, name, min, max) {
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new ValidationError(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
}

export function requireBoolean(value, name) {
  if (typeof value !== 'boolean') throw new ValidationError(`${name} must be true or false`);
  return value;
}

export function parseIntegerInRange(text, name, min, max) {
  if (typeof text !== 'string' || !/^(0|[1-9]\d{0,15})$/.test(text)) {
    throw new ValidationError(`${name} must be an integer between ${min} and ${max}`);
  }
  return requireIntegerInRange(Number(text), name, min, max);
}

export function parseBoolean(text, name) {
  if (text === 'true') return true;
  if (text === 'false') return false;
  throw new ValidationError(`${name} must be true or false`);
}
