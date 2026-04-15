import { ParsedEnv, ValidationResult } from '../../../types';

const SECRET_PATTERN = /(_SECRET|_KEY|_TOKEN|_PASSWORD|_PASS|_PWD|^JWT_|^API_)/i;
const MIN_LENGTH  = 16;
const MIN_ENTROPY = 3.5;

function shannonEntropy(str: string): number {
  const freq: Record<string, number> = {};
  for (const char of str) freq[char] = (freq[char] || 0) + 1;
  return -Object.values(freq).reduce((sum, count) => {
    const p = count / str.length;
    return sum + p * Math.log2(p);
  }, 0);
}

export function weakSecret(env: ParsedEnv, _example: ParsedEnv): ValidationResult[] {
  const results: ValidationResult[] = [];
  for (const [key, value] of env.entries()) {
    if (!SECRET_PATTERN.test(key) || value.length === 0) continue;
    if (value.length < MIN_LENGTH) {
      results.push({ rule: 'weak-secret', severity: 'warning', key, message: `Secret is too short (${value.length} chars, minimum is ${MIN_LENGTH})` });
      continue;
    }
    const entropy = shannonEntropy(value);
    if (entropy < MIN_ENTROPY) {
      results.push({ rule: 'weak-secret', severity: 'warning', key, message: `Secret has low entropy (${entropy.toFixed(2)} bits/char) — looks like a word, not a random secret` });
    }
  }
  return results;
}
