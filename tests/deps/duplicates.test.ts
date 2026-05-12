import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import fs from 'fs';
import { findDuplicateDeps } from '../../src/modules/deps/duplicates';

vi.mock('fs', async (importOriginal) => {
  const real = await importOriginal<typeof import('fs')>();
  return { default: { ...real, existsSync: vi.fn(), readFileSync: vi.fn() } };
});

const mockFs = vi.mocked(fs);

beforeEach(() => vi.resetAllMocks());

const LOCK_V3_WITH_DUPES = JSON.stringify({
  lockfileVersion: 3,
  packages: {
    'node_modules/chalk':                      { version: '4.1.2' },
    'node_modules/foo/node_modules/chalk':     { version: '3.0.0' },
    'node_modules/semver':                     { version: '7.6.0' },
  },
});

const LOCK_V3_NO_DUPES = JSON.stringify({
  lockfileVersion: 3,
  packages: {
    'node_modules/chalk':  { version: '4.1.2' },
    'node_modules/lodash': { version: '4.17.21' },
  },
});

describe('findDuplicateDeps', () => {
  it('returns empty array when no package-lock.json exists', () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(findDuplicateDeps('/tmp/proj')).toHaveLength(0);
  });

  it('detects packages at multiple versions', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(LOCK_V3_WITH_DUPES as any);
    const issues = findDuplicateDeps('/tmp/proj');
    expect(issues.map((i) => i.name)).toContain('chalk');
  });

  it('ignores packages with only one version', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(LOCK_V3_WITH_DUPES as any);
    const issues = findDuplicateDeps('/tmp/proj');
    expect(issues.map((i) => i.name)).not.toContain('semver');
  });

  it('returns empty when no duplicates found', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(LOCK_V3_NO_DUPES as any);
    expect(findDuplicateDeps('/tmp/proj')).toHaveLength(0);
  });

  it('includes both versions in the message', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(LOCK_V3_WITH_DUPES as any);
    const issue = findDuplicateDeps('/tmp/proj').find((i) => i.name === 'chalk');
    expect(issue?.message).toContain('3.0.0');
    expect(issue?.message).toContain('4.1.2');
  });

  it('marks duplicates as warning severity', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(LOCK_V3_WITH_DUPES as any);
    const issues = findDuplicateDeps('/tmp/proj');
    expect(issues.every((i) => i.severity === 'warning')).toBe(true);
  });

  it('returns results sorted alphabetically', () => {
    mockFs.existsSync.mockReturnValue(true);
    const lock = JSON.stringify({
      lockfileVersion: 3,
      packages: {
        'node_modules/zod':                    { version: '3.0.0' },
        'node_modules/foo/node_modules/zod':   { version: '2.0.0' },
        'node_modules/axios':                  { version: '1.0.0' },
        'node_modules/foo/node_modules/axios': { version: '0.27.0' },
      },
    });
    mockFs.readFileSync.mockReturnValue(lock as any);
    const names = findDuplicateDeps('/tmp/proj').map((i) => i.name);
    expect(names).toEqual([...names].sort());
  });
});
