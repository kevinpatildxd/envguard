import { describe, it, expect, vi } from 'vitest';
import path from 'path';
import { runReactA11y } from '../../src/modules/react/a11y';

const VIOLATIONS_DIR = path.resolve(__dirname, 'fixtures/a11y');
const CLEAN_DIR      = path.resolve(__dirname, 'fixtures/a11y');

function collectIssues(fixtureDir: string) {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  try {
    runReactA11y({ json: true, cwd: fixtureDir });
    const output = spy.mock.calls.map((c) => c[0]).join('');
    return JSON.parse(output) as { type: string; file: string; line: number; message: string }[];
  } finally {
    spy.mockRestore();
  }
}

describe('runReactA11y', () => {
  it('flags <img> missing alt', () => {
    const issues = collectIssues(VIOLATIONS_DIR);
    expect(issues.some((i) => i.type === 'missing-alt')).toBe(true);
  });

  it('flags <button> with no accessible label', () => {
    const issues = collectIssues(VIOLATIONS_DIR);
    expect(issues.some((i) => i.type === 'button-no-label')).toBe(true);
  });

  it('flags <div onClick> without role and tabIndex', () => {
    const issues = collectIssues(VIOLATIONS_DIR);
    expect(issues.some((i) => i.type === 'click-no-role')).toBe(true);
  });

  it('flags <input> with no label association', () => {
    const issues = collectIssues(VIOLATIONS_DIR);
    expect(issues.some((i) => i.type === 'input-no-label')).toBe(true);
  });

  it('flags <a> with no href or role', () => {
    const issues = collectIssues(VIOLATIONS_DIR);
    expect(issues.some((i) => i.type === 'anchor-no-href')).toBe(true);
  });

  it('flags <a> with empty text', () => {
    const issues = collectIssues(VIOLATIONS_DIR);
    expect(issues.some((i) => i.type === 'anchor-empty-text')).toBe(true);
  });

  it('violations only come from Violations.tsx', () => {
    const issues = collectIssues(VIOLATIONS_DIR);
    expect(issues.every((i) => i.file.includes('Violations'))).toBe(true);
  });

  it('does not flag valid accessible elements in Clean.tsx', () => {
    const issues = collectIssues(CLEAN_DIR);
    expect(issues.filter((i) => i.file.includes('Clean'))).toHaveLength(0);
  });

  it('reports correct line numbers', () => {
    const issues = collectIssues(VIOLATIONS_DIR);
    expect(issues.every((i) => i.line > 0)).toBe(true);
  });
});
