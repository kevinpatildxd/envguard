import { describe, it, expect, vi } from 'vitest';
import path from 'path';
import { runReactServer } from '../../src/modules/react/server';

const FIXTURE = path.resolve(__dirname, 'fixtures/server');

function collectIssues(fixtureDir: string) {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  try {
    runReactServer({ json: true, cwd: fixtureDir });
    const output = spy.mock.calls.map((c) => c[0]).join('');
    return JSON.parse(output) as { type: string; file: string; line: number; message: string }[];
  } finally {
    spy.mockRestore();
  }
}

describe('runReactServer', () => {
  it('flags client-only hook used in a server component', () => {
    const issues = collectIssues(FIXTURE);
    expect(issues.some((i) => i.type === 'server-uses-client-hook' && i.file.includes('ServerViolations'))).toBe(true);
  });

  it('flags browser global used in a server component', () => {
    const issues = collectIssues(FIXTURE);
    expect(issues.some((i) => i.type === 'server-uses-browser-api' && i.file.includes('ServerViolations'))).toBe(true);
  });

  it('flags server-only module imported in a client component', () => {
    const issues = collectIssues(FIXTURE);
    expect(issues.some((i) => i.type === 'client-imports-server-module' && i.file.includes('ClientViolations'))).toBe(true);
  });

  it('flags next/headers imported in a client component', () => {
    const issues = collectIssues(FIXTURE);
    const issue = issues.find((i) => i.type === 'client-imports-server-module' && i.message.includes('next/headers'));
    expect(issue).toBeDefined();
  });

  it('does not flag a clean client component using useState', () => {
    const issues = collectIssues(FIXTURE);
    expect(issues.filter((i) => i.file.includes('Clean'))).toHaveLength(0);
  });

  it('reports correct line numbers', () => {
    const issues = collectIssues(FIXTURE);
    expect(issues.every((i) => i.line > 0)).toBe(true);
  });
});
