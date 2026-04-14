import { describe, it, expect } from 'vitest';
import { malformedUrl } from '../../src/rules/malformed-url';

const example = new Map<string, string>();

describe('malformedUrl', () => {
  it('flags URL keys with values missing a protocol', () => {
    const env = new Map([['DATABASE_URL', 'localhost:5432/mydb']]);
    const results = malformedUrl(env, example);
    expect(results).toHaveLength(1);
    expect(results[0].severity).toBe('warning');
  });

  it('does not flag valid URLs', () => {
    const env = new Map([['DATABASE_URL', 'postgres://localhost:5432/mydb']]);
    expect(malformedUrl(env, example)).toHaveLength(0);
  });

  it('does not flag empty values', () => {
    const env = new Map([['DATABASE_URL', '']]);
    expect(malformedUrl(env, example)).toHaveLength(0);
  });

  it('does not flag non-URL keys', () => {
    const env = new Map([['JWT_SECRET', 'notaurl']]);
    expect(malformedUrl(env, example)).toHaveLength(0);
  });
});
