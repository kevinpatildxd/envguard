import { describe, it, expect } from 'vitest';
import { booleanMismatch } from '../../src/modules/env/rules/boolean-mismatch';

const example = new Map<string, string>();

describe('booleanMismatch', () => {
  it('flags boolean keys with non-boolean values', () => {
    const env = new Map([['FEATURE_FLAG', 'yes'], ['ENABLE_CACHE', 'on']]);
    const results = booleanMismatch(env, example);
    expect(results).toHaveLength(2);
    expect(results.every((r) => r.severity === 'warning')).toBe(true);
  });

  it('accepts true, false, 1, 0 as valid', () => {
    const env = new Map([
      ['FEATURE_FLAG', 'true'], ['ENABLE_CACHE', 'false'],
      ['IS_PROD', '1'],         ['USE_SSL', '0'],
    ]);
    expect(booleanMismatch(env, example)).toHaveLength(0);
  });

  it('is case-insensitive for valid booleans', () => {
    const env = new Map([['FEATURE_FLAG', 'TRUE'], ['ENABLE_CACHE', 'False']]);
    expect(booleanMismatch(env, example)).toHaveLength(0);
  });

  it('does not flag non-boolean keys', () => {
    const env = new Map([['PORT', 'yes'], ['DATABASE_URL', 'on']]);
    expect(booleanMismatch(env, example)).toHaveLength(0);
  });
});
