import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs   from 'fs';
import path from 'path';
import os   from 'os';
import { generateZodSchema } from '../../src/modules/env/zodSchema';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devguard-zod-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeExample(content: string): string {
  const p = path.join(tmpDir, '.env.example');
  fs.writeFileSync(p, content);
  return p;
}

describe('generateZodSchema', () => {
  it('generates a valid Zod schema file', () => {
    const exPath  = writeExample('DATABASE_URL=\nJWT_SECRET=\n');
    const outPath = path.join(tmpDir, 'env.schema.ts');
    generateZodSchema(exPath, outPath);
    expect(fs.existsSync(outPath)).toBe(true);
    const content = fs.readFileSync(outPath, 'utf-8');
    expect(content).toContain("import { z } from 'zod'");
    expect(content).toContain('DATABASE_URL');
    expect(content).toContain('JWT_SECRET');
  });

  it('uses z.string().url() for URL keys', () => {
    const exPath  = writeExample('DATABASE_URL=\n');
    const outPath = path.join(tmpDir, 'env.schema.ts');
    generateZodSchema(exPath, outPath);
    expect(fs.readFileSync(outPath, 'utf-8')).toContain('z.string().url()');
  });

  it('uses z.coerce.number() for PORT keys', () => {
    const exPath  = writeExample('PORT=\n');
    const outPath = path.join(tmpDir, 'env.schema.ts');
    generateZodSchema(exPath, outPath);
    expect(fs.readFileSync(outPath, 'utf-8')).toContain('z.coerce.number()');
  });

  it('uses z.enum for boolean-style keys', () => {
    const exPath  = writeExample('FEATURE_FLAG=\n');
    const outPath = path.join(tmpDir, 'env.schema.ts');
    generateZodSchema(exPath, outPath);
    expect(fs.readFileSync(outPath, 'utf-8')).toContain("z.enum(['true', 'false'])");
  });

  it('skips comment lines and blank lines', () => {
    const exPath  = writeExample('# comment\n\nJWT_SECRET=\n');
    const outPath = path.join(tmpDir, 'env.schema.ts');
    generateZodSchema(exPath, outPath);
    const content = fs.readFileSync(outPath, 'utf-8');
    expect(content).not.toContain('comment');
    expect(content).toContain('JWT_SECRET');
  });

  it('exports Env type', () => {
    const exPath  = writeExample('API_KEY=\n');
    const outPath = path.join(tmpDir, 'env.schema.ts');
    generateZodSchema(exPath, outPath);
    expect(fs.readFileSync(outPath, 'utf-8')).toContain('export type Env');
  });
});
