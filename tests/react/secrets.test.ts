import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs   from 'fs';
import path from 'path';
import os   from 'os';
import { runReactSecrets } from '../../src/modules/react/secrets';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devguard-secrets-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeFile(name: string, content: string): void {
  const dir = path.dirname(path.join(tmpDir, name));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(tmpDir, name), content);
}

describe('runReactSecrets', () => {
  it('returns empty array for clean code', () => {
    writeFile('src/index.ts', 'const greeting = "hello world";\n');
    const issues = runReactSecrets({ json: false }, tmpDir);
    expect(issues).toHaveLength(0);
  });

  it('detects AWS access key', () => {
    writeFile('src/aws.ts', 'const key = "AKIAIOSFODNN7EXAMPLE1234";\n');
    const issues = runReactSecrets({ json: false }, tmpDir);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toContain('AWS');
  });

  it('detects hardcoded password pattern', () => {
    writeFile('src/db.ts', 'const password = "supersecretpassword";\n');
    const issues = runReactSecrets({ json: false }, tmpDir);
    expect(issues.length).toBeGreaterThan(0);
  });

  it('detects Stripe secret key', () => {
    // build the string at runtime so the literal pattern never appears in source
    const key = ['sk', 'live', 'abcdefghijklmnopqrstuvwx'].join('_');
    writeFile('src/payment.ts', `const stripe = "${key}";\n`);
    const issues = runReactSecrets({ json: false }, tmpDir);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toContain('Stripe');
  });

  it('includes file path and line number', () => {
    writeFile('src/config.ts', 'const key = "AKIAIOSFODNN7EXAMPLE1234";\n');
    const issues = runReactSecrets({ json: false }, tmpDir);
    expect(issues[0].file).toContain('config.ts');
    expect(issues[0].line).toBe(1);
  });

  it('skips node_modules', () => {
    writeFile('node_modules/pkg/index.ts', 'const key = "AKIAIOSFODNN7EXAMPLE1234";\n');
    writeFile('src/clean.ts', 'export const x = 1;\n');
    const issues = runReactSecrets({ json: false }, tmpDir);
    expect(issues).toHaveLength(0);
  });

  it('marks all issues as error severity', () => {
    writeFile('src/bad.ts', 'const key = "AKIAIOSFODNN7EXAMPLE1234";\n');
    const issues = runReactSecrets({ json: false }, tmpDir);
    expect(issues.every((i) => i.severity === 'error')).toBe(true);
  });
});
