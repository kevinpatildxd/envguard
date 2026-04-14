import { describe, it, expect } from 'vitest';
import { insecureDefaults } from '../../src/rules/insecure-defaults';

const example = new Map<string, string>();

describe('insecureDefaults', () => {
  it('flags known insecure placeholder values', () => {
    const env = new Map([['DB_PASS', 'changeme'], ['JWT_SECRET', 'secret'], ['PORT', '3000']]);
    const results = insecureDefaults(env, example);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.key)).toContain('DB_PASS');
    expect(results.map((r) => r.key)).toContain('JWT_SECRET');
    expect(results.every((r) => r.severity === 'error')).toBe(true);
  });

  it('is case-insensitive for values', () => {
    const env = new Map([['KEY', 'CHANGEME']]);
    expect(insecureDefaults(env, example)).toHaveLength(1);
  });

  it('returns no errors for safe values', () => {
    const env = new Map([['DB_PASS', 'v3rY$tr0ngP@ss!'], ['PORT', '3000']]);
    expect(insecureDefaults(env, example)).toHaveLength(0);
  });
});
