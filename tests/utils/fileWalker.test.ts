import { describe, it, expect } from 'vitest';
import { walkFiles } from '../../src/utils/fileWalker';
import path from 'path';

const FIXTURE = path.resolve(__dirname, '../fixtures');

describe('walkFiles', () => {
  it('finds files with matching extensions', () => {
    const files = walkFiles(FIXTURE, ['.env', '.ts']);
    expect(files.length).toBeGreaterThan(0);
  });

  it('returns only files with the requested extensions', () => {
    const files = walkFiles(FIXTURE, ['.ts']);
    for (const f of files) {
      expect(f.endsWith('.ts')).toBe(true);
    }
  });

  it('returns empty array when no files match', () => {
    const files = walkFiles(FIXTURE, ['.xyz_no_match']);
    expect(files).toHaveLength(0);
  });

  it('does not hang on repeated calls (inode guard works)', () => {
    const a = walkFiles(FIXTURE, ['.ts']);
    const b = walkFiles(FIXTURE, ['.ts']);
    expect(a).toEqual(b);
  });
});
