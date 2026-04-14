import { ParsedEnv, ValidationResult } from '../types';

const INSECURE_VALUES = new Set([
  'changeme', 'change_me', 'todo', 'secret', 'password',
  '1234', '12345', '123456', 'test', 'example',
  'placeholder', 'dummy', 'fake', 'temp',
]);

export function insecureDefaults(env: ParsedEnv, _example: ParsedEnv): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const [key, value] of env.entries()) {
    if (INSECURE_VALUES.has(value.toLowerCase())) {
      results.push({
        rule: 'insecure-defaults',
        severity: 'error',
        key,
        message: `Insecure placeholder value: '${value}'`,
      });
    }
  }

  return results;
}
