import { ParsedEnv, ValidationResult } from '../types';

export function undeclaredKey(env: ParsedEnv, example: ParsedEnv): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const key of env.keys()) {
    if (!example.has(key)) {
      results.push({
        rule: 'undeclared-key',
        severity: 'warning',
        key,
        message: `Key is not declared in .env.example`,
      });
    }
  }

  return results;
}
