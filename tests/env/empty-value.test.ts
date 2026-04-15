import { describe, it, expect } from 'vitest';
import { emptyValue } from '../../src/modules/env/rules/empty-value';

const example = new Map([['API_KEY', ''], ['PORT', '']]);

describe('emptyValue', () => {
  it('flags keys present in env but with empty value', () => {
    const env = new Map([['API_KEY', ''], ['PORT', '3000']]);
    const results = emptyValue(env, example);
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('API_KEY');
    expect(results[0].severity).toBe('error');
  });

  it('returns no errors when all values are non-empty', () => {
    const env = new Map([['API_KEY', 'abc'], ['PORT', '3000']]);
    expect(emptyValue(env, example)).toHaveLength(0);
  });

  it('does not flag keys missing from env', () => {
    expect(emptyValue(new Map(), example)).toHaveLength(0);
  });
});
