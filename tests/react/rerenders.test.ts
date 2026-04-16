import { describe, it, expect, vi } from 'vitest';
import path from 'path';
import { runReactRerenders } from '../../src/modules/react/rerenders';

const FIXTURE = path.resolve(__dirname, 'fixtures/rerenders');

function collectIssues(fixtureDir: string) {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  try {
    runReactRerenders({ json: true, cwd: fixtureDir });
    const output = spy.mock.calls.map((c) => c[0]).join('');
    return JSON.parse(output) as { type: string; file: string; line: number; message: string }[];
  } finally {
    spy.mockRestore();
  }
}

describe('runReactRerenders', () => {
  it('flags inline object in JSX prop', () => {
    const issues = collectIssues(FIXTURE);
    expect(issues.some((i) => i.type === 'inline-object-prop' && i.file.includes('InlineObject'))).toBe(true);
  });

  it('flags inline arrow function in JSX prop', () => {
    const issues = collectIssues(FIXTURE);
    expect(issues.some((i) => i.type === 'inline-function-prop' && i.file.includes('InlineFunction'))).toBe(true);
  });

  it('flags exported component missing React.memo', () => {
    const issues = collectIssues(FIXTURE);
    expect(issues.some((i) => i.type === 'missing-memo' && i.file.includes('NoMemo'))).toBe(true);
  });

  it('does not flag component wrapped in memo', () => {
    const issues = collectIssues(FIXTURE);
    expect(issues.some((i) => i.type === 'missing-memo' && i.file.includes('WithMemo'))).toBe(false);
  });

  it('flags object literal in useEffect dep array', () => {
    const issues = collectIssues(FIXTURE);
    expect(issues.some((i) => i.type === 'unstable-dep' && i.file.includes('UnstableDep'))).toBe(true);
  });

  it('does not flag clean component using useCallback and useMemo', () => {
    const issues = collectIssues(FIXTURE);
    const cleanIssues = issues.filter((i) => i.file.includes('Clean'));
    expect(cleanIssues).toHaveLength(0);
  });

  it('reports the correct line number for inline object prop', () => {
    const issues = collectIssues(FIXTURE);
    const issue  = issues.find((i) => i.type === 'inline-object-prop' && i.file.includes('InlineObject'));
    expect(issue?.line).toBeGreaterThan(0);
  });
});
