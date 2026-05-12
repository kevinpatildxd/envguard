import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs   from 'fs';
import path from 'path';
import os   from 'os';
import { setupHooks } from '../../src/modules/init/hooks';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devguard-hooks-'));
  fs.mkdirSync(path.join(tmpDir, '.git', 'hooks'), { recursive: true });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('setupHooks', () => {
  it('creates .git/hooks/pre-commit when no Husky detected', () => {
    setupHooks(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, '.git', 'hooks', 'pre-commit'))).toBe(true);
  });

  it('hook content runs devguard --strict', () => {
    setupHooks(tmpDir);
    const content = fs.readFileSync(path.join(tmpDir, '.git', 'hooks', 'pre-commit'), 'utf-8');
    expect(content).toContain('devguard');
    expect(content).toContain('--strict');
  });

  it('creates .husky/pre-commit when .husky dir exists', () => {
    fs.mkdirSync(path.join(tmpDir, '.husky'), { recursive: true });
    setupHooks(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, '.husky', 'pre-commit'))).toBe(true);
  });

  it('creates .husky/pre-commit when husky is in devDependencies', () => {
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ devDependencies: { husky: '^9.0.0' } }),
    );
    setupHooks(tmpDir);
    expect(fs.existsSync(path.join(tmpDir, '.husky', 'pre-commit'))).toBe(true);
  });
});
