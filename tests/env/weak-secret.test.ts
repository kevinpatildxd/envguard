import { describe, it, expect } from 'vitest';
import { weakSecret } from '../../src/modules/env/rules/weak-secret';

const example = new Map<string, string>();

describe('weakSecret', () => {
  it('flags secret keys with values under 16 characters', () => {
    const env = new Map([['JWT_SECRET', 'short'], ['API_KEY', 'tooshort']]);
    const results = weakSecret(env, example);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.severity === 'warning')).toBe(true);
  });

  it('flags secrets with low entropy even if long enough', () => {
    const env = new Map([['JWT_SECRET', 'aaaaaaaaaaaaaaaaaaa']]);
    const results = weakSecret(env, example);
    expect(results).toHaveLength(1);
    expect(results[0].message).toContain('entropy');
  });

  it('does not flag secrets with sufficient length and high entropy', () => {
    const env = new Map([['JWT_SECRET', 'aB3$kP9!mZ2@qL7#xR']]);
    expect(weakSecret(env, example)).toHaveLength(0);
  });

  it('does not flag non-secret keys', () => {
    const env = new Map([['PORT', '3000'], ['DATABASE_URL', 'short']]);
    expect(weakSecret(env, example)).toHaveLength(0);
  });

  it('does not flag empty values', () => {
    expect(weakSecret(new Map([['JWT_SECRET', '']]), example)).toHaveLength(0);
  });
});
