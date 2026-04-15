import { describe, it, expect } from 'vitest';
import path from 'path';
import { parseEnvFile, parseEnvExample } from '../../src/modules/env/parser';

const fixture = (name: string) => path.resolve(__dirname, '../fixtures', name);

describe('parseEnvFile', () => {
  it('parses all key-value pairs from a complete .env', () => {
    const result = parseEnvFile(fixture('complete.env'));
    expect(result.get('DATABASE_URL')).toBe('postgres://localhost:5432/mydb');
    expect(result.get('PORT')).toBe('3000');
    expect(result.get('FEATURE_FLAG')).toBe('true');
  });

  it('returns correct number of keys', () => {
    const result = parseEnvFile(fixture('complete.env'));
    expect(result.size).toBe(5);
  });

  it('throws when file does not exist', () => {
    expect(() => parseEnvFile(fixture('nonexistent.env'))).toThrow('File not found');
  });
});

describe('parseEnvExample', () => {
  it('parses all keys from .env.example (values may be empty)', () => {
    const result = parseEnvExample(fixture('complete.env.example'));
    expect(result.has('DATABASE_URL')).toBe(true);
    expect(result.has('JWT_SECRET')).toBe(true);
    expect(result.size).toBe(5);
  });
});
