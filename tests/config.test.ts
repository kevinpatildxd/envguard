import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs   from 'fs';
import path from 'path';
import os   from 'os';
import { loadConfig } from '../src/config';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'devguard-config-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('loadConfig', () => {
  it('returns empty object when no config file exists', () => {
    expect(loadConfig(tmpDir)).toEqual({});
  });

  it('loads .devguard.json', () => {
    fs.writeFileSync(path.join(tmpDir, '.devguard.json'), JSON.stringify({ strict: true }));
    expect(loadConfig(tmpDir).strict).toBe(true);
  });

  it('loads devguard.config.json', () => {
    fs.writeFileSync(path.join(tmpDir, 'devguard.config.json'), JSON.stringify({ json: true }));
    expect(loadConfig(tmpDir).json).toBe(true);
  });

  it('prefers .devguard.json over devguard.config.json', () => {
    fs.writeFileSync(path.join(tmpDir, '.devguard.json'),        JSON.stringify({ strict: true }));
    fs.writeFileSync(path.join(tmpDir, 'devguard.config.json'),  JSON.stringify({ strict: false }));
    expect(loadConfig(tmpDir).strict).toBe(true);
  });

  it('returns empty object on malformed JSON', () => {
    fs.writeFileSync(path.join(tmpDir, '.devguard.json'), 'not json {{');
    expect(loadConfig(tmpDir)).toEqual({});
  });

  it('reads nested config sections', () => {
    const cfg = { env: { example: '.env.staging' }, deps: { licenses: true } };
    fs.writeFileSync(path.join(tmpDir, '.devguard.json'), JSON.stringify(cfg));
    const loaded = loadConfig(tmpDir);
    expect(loaded.env?.example).toBe('.env.staging');
    expect(loaded.deps?.licenses).toBe(true);
  });
});
