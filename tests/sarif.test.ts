import { describe, it, expect } from 'vitest';
import { buildSarif } from '../src/sarif';
import type { DepsIssue, ValidationResult, ReactIssue } from '../src/types';

const depIssue: DepsIssue = {
  type:     'vulnerable',
  severity: 'error',
  name:     'express',
  message:  'CVE-2024-1234  High',
};

const envResult: ValidationResult = {
  rule:     'missing-key',
  severity: 'error',
  key:      'DATABASE_URL',
  message:  'Missing required key',
};

const reactIssue: ReactIssue = {
  type:     'a11y',
  severity: 'error',
  file:     'src/Avatar.tsx',
  line:     12,
  message:  '<img> missing alt attribute',
};

describe('buildSarif', () => {
  it('produces valid SARIF 2.1.0 structure', () => {
    const sarif = buildSarif({ depsIssues: [], envResults: [], reactIssues: [] }) as any;
    expect(sarif.version).toBe('2.1.0');
    expect(sarif.runs).toHaveLength(1);
    expect(sarif.runs[0].tool.driver.name).toBe('devguard');
  });

  it('converts a deps issue to a SARIF result', () => {
    const sarif = buildSarif({ depsIssues: [depIssue], envResults: [], reactIssues: [] }) as any;
    const result = sarif.runs[0].results[0];
    expect(result.ruleId).toBe('deps/vulnerable');
    expect(result.level).toBe('error');
    expect(result.locations[0].physicalLocation.artifactLocation.uri).toBe('package.json');
  });

  it('converts an env result to a SARIF result', () => {
    const sarif = buildSarif({ depsIssues: [], envResults: [envResult], reactIssues: [] }) as any;
    const result = sarif.runs[0].results[0];
    expect(result.ruleId).toBe('env/missing-key');
    expect(result.message.text).toContain('DATABASE_URL');
    expect(result.locations[0].physicalLocation.artifactLocation.uri).toBe('.env');
  });

  it('converts a react issue with line number', () => {
    const sarif = buildSarif({ depsIssues: [], envResults: [], reactIssues: [reactIssue] }) as any;
    const result = sarif.runs[0].results[0];
    expect(result.ruleId).toBe('react/a11y');
    expect(result.locations[0].physicalLocation.region.startLine).toBe(12);
    expect(result.locations[0].physicalLocation.artifactLocation.uri).toBe('src/Avatar.tsx');
  });

  it('deduplicates rules', () => {
    const sarif = buildSarif({
      depsIssues:  [depIssue, { ...depIssue, name: 'lodash' }],
      envResults:  [],
      reactIssues: [],
    }) as any;
    const ruleIds = sarif.runs[0].tool.driver.rules.map((r: any) => r.id);
    const unique = new Set(ruleIds);
    expect(ruleIds.length).toBe(unique.size);
  });

  it('maps warning severity correctly', () => {
    const warnIssue: DepsIssue = { ...depIssue, severity: 'warning' };
    const sarif = buildSarif({ depsIssues: [warnIssue], envResults: [], reactIssues: [] }) as any;
    expect(sarif.runs[0].results[0].level).toBe('warning');
  });
});
