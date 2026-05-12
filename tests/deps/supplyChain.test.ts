import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';

vi.mock('../../src/utils/httpClient', () => ({ httpGet: vi.fn() }));

import { httpGet } from '../../src/utils/httpClient';
import { findSupplyChainRisks } from '../../src/modules/deps/supplyChain';

const FIXTURE = path.resolve(__dirname, 'fixtures/with-unused');

const mockHttpGet = vi.mocked(httpGet);

// default npm metadata — safe package, active, multi-maintainer, no install scripts
const SAFE_META = {
  scripts:     {},
  time:        { modified: new Date().toISOString() },
  maintainers: [{ name: 'alice' }, { name: 'bob' }],
};

const OLD_DATE = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString();

beforeEach(() => {
  vi.mocked(httpGet).mockReset();
  vi.mocked(httpGet).mockResolvedValue(SAFE_META as any);
});

describe('findSupplyChainRisks', () => {
  it('returns empty array when no package.json', async () => {
    await expect(findSupplyChainRisks('/tmp/nonexistent-xyz')).resolves.toHaveLength(0);
  });

  it('returns no issues for safe packages', async () => {
    const issues = await findSupplyChainRisks(FIXTURE);
    expect(issues).toHaveLength(0);
  });

  it('flags packages with install scripts', async () => {
    vi.mocked(httpGet).mockResolvedValue({
      ...SAFE_META,
      scripts: { postinstall: 'node setup.js' },
    } as any);
    const issues = await findSupplyChainRisks(FIXTURE);
    expect(issues.some((i) => i.message.includes('install script'))).toBe(true);
  });

  it('flags abandoned packages (last publish > 2 years ago)', async () => {
    vi.mocked(httpGet).mockResolvedValue({
      ...SAFE_META,
      time: { modified: OLD_DATE },
    } as any);
    const issues = await findSupplyChainRisks(FIXTURE);
    expect(issues.some((i) => i.message.includes('abandoned'))).toBe(true);
  });

  it('flags single-maintainer packages', async () => {
    vi.mocked(httpGet).mockResolvedValue({
      ...SAFE_META,
      maintainers: [{ name: 'solo' }],
    } as any);
    const issues = await findSupplyChainRisks(FIXTURE);
    expect(issues.some((i) => i.message.includes('single maintainer'))).toBe(true);
  });

  it('silently skips packages that fail to fetch', async () => {
    vi.mocked(httpGet).mockRejectedValue(new Error('network error'));
    const issues = await findSupplyChainRisks(FIXTURE);
    expect(Array.isArray(issues)).toBe(true);
  });

  it('marks all issues as warning severity', async () => {
    vi.mocked(httpGet).mockResolvedValue({
      ...SAFE_META,
      scripts:     { install: 'node install.js' },
      maintainers: [{ name: 'solo' }],
    } as any);
    const issues = await findSupplyChainRisks(FIXTURE);
    expect(issues.every((i) => i.severity === 'warning')).toBe(true);
  });
});
