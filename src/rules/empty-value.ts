import { ParsedEnv, ValidationResult } from '../types';

export function emptyValue(env: ParsedEnv, example: ParsedEnv): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const key of example.keys()) {
    if (env.has(key) && env.get(key) === '') {
      results.push({
        rule: 'empty-value',
        severity: 'error',
        key,
        message: `Value is empty`,
      });
    }
  }

  return results;
}
