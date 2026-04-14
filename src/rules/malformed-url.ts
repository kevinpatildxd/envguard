import { ParsedEnv, ValidationResult } from '../types';

const URL_PATTERN = /(_URL|_URI|_HOST|^DATABASE_|^REDIS_|^MONGO_)/i;

const VALID_PROTOCOLS = new Set([
  'http:', 'https:', 'postgres:', 'postgresql:',
  'mysql:', 'mongodb:', 'mongodb+srv:', 'redis:',
  'rediss:', 'amqp:', 'amqps:', 'ftp:', 'ftps:',
]);

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return VALID_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

export function malformedUrl(env: ParsedEnv, _example: ParsedEnv): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const [key, value] of env.entries()) {
    if (URL_PATTERN.test(key) && value !== '' && !isValidUrl(value)) {
      results.push({
        rule: 'malformed-url',
        severity: 'warning',
        key,
        message: `Value does not appear to be a valid URL: '${value}'`,
      });
    }
  }

  return results;
}
