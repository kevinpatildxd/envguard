import { describe, it, expect, vi, beforeEach } from 'vitest';
import { report } from '../src/reporter';
import { ValidationResult } from '../src/types';

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
});

const error: ValidationResult = {
  rule: 'missing-key',
  severity: 'error',
  key: 'DATABASE_URL',
  message: 'Missing required key',
};

const warning: ValidationResult = {
  rule: 'type-mismatch',
  severity: 'warning',
  key: 'PORT',
  message: "Expected a number but got 'abc'",
};

describe('report', () => {
  it('outputs JSON when json option is true', () => {
    report([error], { json: true });
    const call = (console.log as ReturnType<typeof vi.spyOn>).mock.calls[0][0];
    const parsed = JSON.parse(call);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].key).toBe('DATABASE_URL');
  });

  it('calls console.log with error output for error results', () => {
    report([error]);
    const output = (console.log as ReturnType<typeof vi.spyOn>).mock.calls
      .map((c) => String(c[0]))
      .join('\n');
    expect(output).toContain('DATABASE_URL');
  });

  it('calls console.log with warning output for warning results', () => {
    report([warning]);
    const output = (console.log as ReturnType<typeof vi.spyOn>).mock.calls
      .map((c) => String(c[0]))
      .join('\n');
    expect(output).toContain('PORT');
  });

  it('shows all passed message when no results', () => {
    report([]);
    const output = (console.log as ReturnType<typeof vi.spyOn>).mock.calls
      .map((c) => String(c[0]))
      .join('\n');
    expect(output).toContain('All checks passed');
  });
});
