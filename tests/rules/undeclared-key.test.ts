import { describe, it, expect } from 'vitest';
import { undeclaredKey } from '../../src/rules/undeclared-key';

const example = new Map([['PORT', ''], ['DATABASE_URL', '']]);

describe('undeclaredKey', () => {
  it('flags keys in env not present in example', () => {
    const env = new Map([['PORT', '3000'], ['DATABASE_URL', 'x'], ['MY_SECRET', 'abc']]);
    const results = undeclaredKey(env, example);
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('MY_SECRET');
    expect(results[0].severity).toBe('warning');
  });

  it('returns no warnings when all env keys are declared', () => {
    const env = new Map([['PORT', '3000'], ['DATABASE_URL', 'x']]);
    expect(undeclaredKey(env, example)).toHaveLength(0);
  });
});
