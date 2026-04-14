import { ParsedEnv, ValidationResult } from '../types';

const SECRET_PATTERN = /(_SECRET|_KEY|_TOKEN|_PASSWORD|_PASS|_PWD|^JWT_|^API_)/i;
const MIN_LENGTH = 16;

export function weakSecret(env: ParsedEnv, _example: ParsedEnv): ValidationResult[] {
  const results: ValidationResult[] = [];

  for (const [key, value] of env.entries()) {
    if (SECRET_PATTERN.test(key) && value.length > 0 && value.length < MIN_LENGTH) {
      results.push({
        rule: 'weak-secret',
        severity: 'warning',
        key,
        message: `Secret is too short (${value.length} chars, minimum is ${MIN_LENGTH})`,
      });
    }
  }

  return results;
}
