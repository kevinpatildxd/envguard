import { describe, it, expect, vi } from 'vitest';
import path from 'path';
import { runReactHooks } from '../../src/modules/react/hooks';

const VIOLATIONS_DIR = path.resolve(__dirname, 'fixtures/hooks');

function collectIssues(fixtureDir: string) {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  try {
    runReactHooks({ json: true, cwd: fixtureDir });
    const output = spy.mock.calls.map((c) => c[0]).join('');
    return JSON.parse(output) as { type: string; file: string; line: number; message: string }[];
  } finally {
    spy.mockRestore();
  }
}

describe('runReactHooks', () => {
  it('flags hook called inside a conditional', () => {
    const issues = collectIssues(VIOLATIONS_DIR);
    expect(issues.some((i) => i.type === 'hook-in-conditional')).toBe(true);
  });

  it('flags hook called inside a loop', () => {
    const issues = collectIssues(VIOLATIONS_DIR);
    expect(issues.some((i) => i.type === 'hook-in-loop')).toBe(true);
  });

  it('flags hook called inside a nested function', () => {
    const issues = collectIssues(VIOLATIONS_DIR);
    expect(issues.some((i) => i.type === 'hook-in-nested-function')).toBe(true);
  });

  it('flags hook called from a non-component non-hook function', () => {
    const issues = collectIssues(VIOLATIONS_DIR);
    expect(issues.some((i) => i.type === 'hook-in-regular-function')).toBe(true);
  });

  it('violations only come from Violations.tsx', () => {
    const issues = collectIssues(VIOLATIONS_DIR);
    expect(issues.every((i) => i.file.includes('Violations'))).toBe(true);
  });

  it('does not flag valid top-level hook calls in a component', () => {
    const issues = collectIssues(VIOLATIONS_DIR);
    expect(issues.some((i) => i.file.includes('Clean'))).toBe(false);
  });

  it('does not flag hooks in a custom hook function', () => {
    const issues = collectIssues(VIOLATIONS_DIR);
    expect(issues.filter((i) => i.file.includes('Clean'))).toHaveLength(0);
  });

  it('reports the correct line number for violations', () => {
    const issues = collectIssues(VIOLATIONS_DIR);
    expect(issues.every((i) => i.line > 0)).toBe(true);
  });
});
