import fs from 'fs';
import { DepsIssue, ValidationResult, ReactIssue } from './types';

interface SarifLocation {
  physicalLocation: {
    artifactLocation: { uri: string; uriBaseId?: string };
    region?:          { startLine: number };
  };
}

interface SarifResult {
  ruleId:    string;
  level:     'error' | 'warning' | 'note';
  message:   { text: string };
  locations: SarifLocation[];
}

interface SarifRule {
  id:               string;
  shortDescription: { text: string };
}

export interface SarifInput {
  depsIssues:  DepsIssue[];
  envResults:  ValidationResult[];
  reactIssues: ReactIssue[];
}

function level(severity: string): 'error' | 'warning' | 'note' {
  if (severity === 'error') return 'error';
  if (severity === 'warning') return 'warning';
  return 'note';
}

function depRule(type: string): SarifRule {
  const labels: Record<string, string> = {
    unused:      'Unused dependency',
    outdated:    'Outdated dependency',
    vulnerable:  'Vulnerable dependency',
    alternative: 'Dependency alternative available',
    license:     'License issue',
  };
  return { id: `deps/${type}`, shortDescription: { text: labels[type] ?? type } };
}

function envRule(rule: string): SarifRule {
  return { id: `env/${rule}`, shortDescription: { text: rule } };
}

function reactRule(type: string): SarifRule {
  return { id: `react/${type}`, shortDescription: { text: type } };
}

export function buildSarif(input: SarifInput, toolVersion = '2.5.0'): object {
  const results:  SarifResult[] = [];
  const ruleMap   = new Map<string, SarifRule>();

  for (const issue of input.depsIssues) {
    const rule = depRule(issue.type);
    ruleMap.set(rule.id, rule);
    results.push({
      ruleId:    rule.id,
      level:     level(issue.severity),
      message:   { text: issue.message },
      locations: [{ physicalLocation: { artifactLocation: { uri: 'package.json' } } }],
    });
  }

  for (const r of input.envResults) {
    const rule = envRule(r.rule);
    ruleMap.set(rule.id, rule);
    results.push({
      ruleId:    rule.id,
      level:     level(r.severity),
      message:   { text: `${r.key}: ${r.message}` },
      locations: [{ physicalLocation: { artifactLocation: { uri: '.env' } } }],
    });
  }

  for (const issue of input.reactIssues) {
    const rule = reactRule(issue.type);
    ruleMap.set(rule.id, rule);
    results.push({
      ruleId:    rule.id,
      level:     level(issue.severity),
      message:   { text: issue.message },
      locations: [{
        physicalLocation: {
          artifactLocation: { uri: issue.file, uriBaseId: '%SRCROOT%' },
          ...(issue.line != null ? { region: { startLine: issue.line } } : {}),
        },
      }],
    });
  }

  return {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [{
      tool: {
        driver: {
          name:    'devguard',
          version: toolVersion,
          rules:   [...ruleMap.values()],
        },
      },
      results,
    }],
  };
}

export function writeSarif(sarif: object, outPath = 'devguard.sarif'): void {
  fs.writeFileSync(outPath, JSON.stringify(sarif, null, 2), 'utf-8');
  console.log(`\n  SARIF report written to ${outPath}`);
}
