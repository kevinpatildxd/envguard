import { ParsedEnv, ValidationResult } from '../../../types';

const NUMERIC_PATTERN = /^(PORT|TIMEOUT|MAX_|MIN_|LIMIT|RETRY_|WORKERS|THREADS)/i;

export function typeMismatch(env: ParsedEnv, _example: ParsedEnv): ValidationResult[] {
  const results: ValidationResult[] = [];
  for (const [key, value] of env.entries()) {
    if (NUMERIC_PATTERN.test(key) && value !== '' && isNaN(Number(value))) {
      results.push({ rule: 'type-mismatch', severity: 'warning', key, message: `Expected a number but got '${value}'` });
    }
  }
  return results;
}
