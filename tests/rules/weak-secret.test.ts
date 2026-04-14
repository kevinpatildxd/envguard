import { describe, it, expect } from 'vitest';
import { weakSecret } from '../../src/rules/weak-secret';

const example = new Map<string, string>();

describe('weakSecret', () => {
  it('flags secret keys with values under 16 characters', () => {
    const env = new Map([['JWT_SECRET', 'short'], ['API_KEY', 'tooshort']]);
    const results = weakSecret(env, example);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.severity === 'warning')).toBe(true);
  });

  it('does not flag secrets with 16 or more characters', () => {
    const env = new Map([['JWT_SECRET', 'averylongsecretkey123']]);
    expect(weakSecret(env, example)).toHaveLength(0);
  });

  it('does not flag non-secret keys', () => {
    const env = new Map([['PORT', '3000'], ['DATABASE_URL', 'short']]);
    expect(weakSecret(env, example)).toHaveLength(0);
  });

  it('does not flag empty values', () => {
    const env = new Map([['JWT_SECRET', '']]);
    expect(weakSecret(env, example)).toHaveLength(0);
  });
});
