import { describe, it, expect } from 'vitest';
import { typeMismatch } from '../../src/modules/env/rules/type-mismatch';

const example = new Map<string, string>();

describe('typeMismatch', () => {
  it('flags numeric keys with non-numeric values', () => {
    const env = new Map([['PORT', 'abc'], ['TIMEOUT', 'xyz']]);
    const results = typeMismatch(env, example);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.severity === 'warning')).toBe(true);
  });

  it('does not flag numeric keys with valid number values', () => {
    const env = new Map([['PORT', '3000'], ['TIMEOUT', '5000']]);
    expect(typeMismatch(env, example)).toHaveLength(0);
  });

  it('does not flag non-numeric keys', () => {
    const env = new Map([['DATABASE_URL', 'notanumber'], ['API_KEY', 'abc']]);
    expect(typeMismatch(env, example)).toHaveLength(0);
  });
});
