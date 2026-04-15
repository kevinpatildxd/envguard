import { describe, it, expect } from 'vitest';
import { checkConsistency } from '../../src/modules/env/consistency';

describe('checkConsistency', () => {
  it('returns no issues when all files have the same keys', () => {
    const files = [
      { file: '.env',         env: new Map([['PORT', '3000'], ['DATABASE_URL', 'x']]) },
      { file: '.env.staging', env: new Map([['PORT', '4000'], ['DATABASE_URL', 'y']]) },
    ];
    expect(checkConsistency(files)).toHaveLength(0);
  });

  it('flags keys present in some files but missing in others', () => {
    const files = [
      { file: '.env',         env: new Map([['PORT', '3000'], ['REDIS_URL', 'redis://localhost']]) },
      { file: '.env.staging', env: new Map([['PORT', '4000']]) },
    ];
    const issues = checkConsistency(files);
    expect(issues).toHaveLength(1);
    expect(issues[0].key).toBe('REDIS_URL');
    expect(issues[0].presentIn).toContain('.env');
    expect(issues[0].missingIn).toContain('.env.staging');
  });

  it('returns no issues with fewer than 2 files', () => {
    const files = [{ file: '.env', env: new Map([['PORT', '3000']]) }];
    expect(checkConsistency(files)).toHaveLength(0);
  });

  it('handles multiple missing keys across multiple files', () => {
    const files = [
      { file: '.env',            env: new Map([['A', '1'], ['B', '2'], ['C', '3']]) },
      { file: '.env.staging',    env: new Map([['A', '1']]) },
      { file: '.env.production', env: new Map([['A', '1'], ['B', '2']]) },
    ];
    const issues = checkConsistency(files);
    expect(issues.length).toBe(2);
    expect(issues.map((i) => i.key)).toContain('B');
    expect(issues.map((i) => i.key)).toContain('C');
  });
});
