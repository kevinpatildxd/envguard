import { ParsedEnv, ValidationResult } from '../types';

export function missingKey(env: ParsedEnv, example: ParsedEnv): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const key of example.keys()) {
    if (!env.has(key)) {
      results.push({
        rule: 'missing-key',
        severity: 'error',
        key,
        message: `Missing required key (defined in .env.example)`,
      });
    }
  }

  return results;
}
