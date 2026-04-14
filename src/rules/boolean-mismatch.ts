import { ParsedEnv, ValidationResult } from '../types';

const BOOLEAN_PATTERN = /^(FEATURE_|ENABLE_|DISABLE_|IS_|USE_|ALLOW_|FLAG_)/i;
const VALID_BOOLEANS = new Set(['true', 'false', '1', '0']);

export function booleanMismatch(env: ParsedEnv, _example: ParsedEnv): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const [key, value] of env.entries()) {
    if (BOOLEAN_PATTERN.test(key) && value !== '' && !VALID_BOOLEANS.has(value.toLowerCase())) {
      results.push({
        rule: 'boolean-mismatch',
        severity: 'warning',
        key,
        message: `Expected a boolean (true/false/1/0) but got '${value}'`,
      });
    }
  }

  return results;
}
