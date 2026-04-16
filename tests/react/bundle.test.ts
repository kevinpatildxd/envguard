import { describe, it, expect, vi } from 'vitest';
import path from 'path';
import { runReactBundle } from '../../src/modules/react/bundle';

const HEAVY_DIR = path.resolve(__dirname, 'fixtures/bundle/Heavy');
const CLEAN_DIR = path.resolve(__dirname, 'fixtures/bundle/Clean');

async function collectIssues(fixtureDir: string, threshold = 50) {
  const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
  try {
    await runReactBundle({ json: true, cwd: fixtureDir, threshold });
    const output = spy.mock.calls.map((c) => c[0]).join('');
    return JSON.parse(output) as { type: string; file: string; line: number; message: string }[];
  } finally {
    spy.mockRestore();
  }
}

describe('runReactBundle', () => {
  it('flags moment (72 kB) as a heavy package', async () => {
    const issues = await collectIssues(HEAVY_DIR);
    expect(issues.some((i) => i.type === 'heavy-package' && i.message.includes('moment'))).toBe(true);
  });

  it('flags lodash (71 kB) as a heavy package', async () => {
    const issues = await collectIssues(HEAVY_DIR);
    expect(issues.some((i) => i.type === 'heavy-package' && i.message.includes('lodash'))).toBe(true);
  });

  it('does not flag axios (13 kB) — below 50 kB threshold', async () => {
    const issues = await collectIssues(HEAVY_DIR);
    expect(issues.some((i) => i.message.includes('axios'))).toBe(false);
  });

  it('includes an alternative suggestion for moment', async () => {
    const issues = await collectIssues(HEAVY_DIR);
    const issue  = issues.find((i) => i.message.includes('moment'));
    expect(issue?.message).toMatch(/consider/);
  });

  it('labels lodash as named import (may be tree-shaken)', async () => {
    const issues = await collectIssues(HEAVY_DIR);
    const issue  = issues.find((i) => i.message.includes('lodash'));
    expect(issue?.message).toMatch(/tree-shaken/);
  });

  it('does not flag date-fns (15 kB) — below threshold', async () => {
    const issues = await collectIssues(CLEAN_DIR);
    expect(issues.some((i) => i.message.includes('date-fns'))).toBe(false);
  });

  it('reports the correct line number for heavy package', async () => {
    const issues = await collectIssues(HEAVY_DIR);
    expect(issues.every((i) => i.line > 0)).toBe(true);
  });

  it('flags moment when threshold is lowered to 10 kB', async () => {
    const issues = await collectIssues(HEAVY_DIR, 10);
    expect(issues.some((i) => i.message.includes('moment'))).toBe(true);
  });

  it('does not flag anything in the clean fixture at default threshold', async () => {
    const issues = await collectIssues(CLEAN_DIR);
    expect(issues).toHaveLength(0);
  });
});
