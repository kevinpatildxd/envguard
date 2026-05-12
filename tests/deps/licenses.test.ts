import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

vi.mock('../../src/utils/httpClient', () => ({
  httpGet: vi.fn(),
}));

import { httpGet } from '../../src/utils/httpClient';
import { findLicenseIssues } from '../../src/modules/deps/licenses';

const FIXTURE = path.resolve(__dirname, 'fixtures');

const LICENSE_MAP: Record<string, string | undefined> = {
  lodash:          'MIT',
  'gpl-pkg':       'GPL-3.0',
  'agpl-pkg':      'AGPL-3.0',
  'unlicensed-pkg': undefined,
};

beforeEach(() => {
  vi.mocked(httpGet).mockImplementation(async (url: string) => {
    const name = decodeURIComponent(url.replace('https://registry.npmjs.org/', '').replace('/latest', ''));
    const license = LICENSE_MAP[name];
    return license ? { license } : {};
  });
});

describe('findLicenseIssues', () => {
  it('returns empty array when no package.json exists', async () => {
    await expect(findLicenseIssues('/tmp/nonexistent-xyz')).resolves.toHaveLength(0);
  });

  it('skips packages with OK licenses', async () => {
    const issues = await findLicenseIssues(path.join(FIXTURE, 'with-licenses'));
    expect(issues.map((i) => i.name)).not.toContain('lodash');
  });

  it('flags GPL as warning severity', async () => {
    const issues = await findLicenseIssues(path.join(FIXTURE, 'with-licenses'));
    const gpl = issues.find((i) => i.name === 'gpl-pkg');
    expect(gpl).toBeDefined();
    expect(gpl?.severity).toBe('warning');
    expect(gpl?.type).toBe('license');
  });

  it('flags AGPL as error severity', async () => {
    const issues = await findLicenseIssues(path.join(FIXTURE, 'with-licenses'));
    const agpl = issues.find((i) => i.name === 'agpl-pkg');
    expect(agpl).toBeDefined();
    expect(agpl?.severity).toBe('error');
    expect(agpl?.message).toMatch(/copyleft/);
  });

  it('flags missing license as warning', async () => {
    const issues = await findLicenseIssues(path.join(FIXTURE, 'with-licenses'));
    const unlicensed = issues.find((i) => i.name === 'unlicensed-pkg');
    expect(unlicensed).toBeDefined();
    expect(unlicensed?.severity).toBe('warning');
    expect(unlicensed?.message).toMatch(/usage rights unclear/);
  });

  it('returns results sorted alphabetically', async () => {
    const issues = await findLicenseIssues(path.join(FIXTURE, 'with-licenses'));
    const names = issues.map((i) => i.name);
    expect(names).toEqual([...names].sort());
  });

  it('silently skips packages that fail to fetch', async () => {
    vi.mocked(httpGet).mockRejectedValueOnce(new Error('network error'));
    await expect(findLicenseIssues(path.join(FIXTURE, 'with-licenses'))).resolves.not.toThrow();
  });
});
