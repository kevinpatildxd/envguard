import { describe, it, expect } from 'vitest';
import path from 'path';
import { findUnusedPackages } from '../../src/modules/deps/unused';

const FIXTURE = path.resolve(__dirname, 'fixtures');

describe('findUnusedPackages', () => {
  it('flags packages declared but never imported', () => {
    const issues = findUnusedPackages(path.join(FIXTURE, 'with-unused'));
    const names  = issues.map((i) => i.name);
    expect(names).toContain('lodash');
    expect(names).toContain('moment');
  });

  it('does not flag packages that are imported', () => {
    const issues = findUnusedPackages(path.join(FIXTURE, 'with-unused'));
    const names  = issues.map((i) => i.name);
    expect(names).not.toContain('chalk');
  });

  it('returns empty array when no package.json exists', () => {
    expect(findUnusedPackages('/tmp/nonexistent-project-xyz')).toHaveLength(0);
  });

  it('marks unused packages as error severity', () => {
    const issues = findUnusedPackages(path.join(FIXTURE, 'with-unused'));
    expect(issues.every((i) => i.severity === 'error')).toBe(true);
  });
});
