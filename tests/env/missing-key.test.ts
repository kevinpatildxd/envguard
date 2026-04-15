import { describe, it, expect } from 'vitest';
import { missingKey } from '../../src/modules/env/rules/missing-key';

const example = new Map([['DATABASE_URL', ''], ['JWT_SECRET', ''], ['PORT', '']]);

describe('missingKey', () => {
  it('returns errors for keys absent from env', () => {
    const env = new Map([['PORT', '3000']]);
    const results = missingKey(env, example);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.key)).toContain('DATABASE_URL');
    expect(results.map((r) => r.key)).toContain('JWT_SECRET');
  });

  it('returns no errors when all keys are present', () => {
    const env = new Map([['DATABASE_URL', 'x'], ['JWT_SECRET', 'x'], ['PORT', '3000']]);
    expect(missingKey(env, example)).toHaveLength(0);
  });

  it('marks results as error severity', () => {
    const env = new Map<string, string>();
    expect(missingKey(env, example).every((r) => r.severity === 'error')).toBe(true);
  });
});
