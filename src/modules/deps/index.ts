import { findUnusedPackages }      from './unused';
import { findOutdatedPackages }     from './outdated';
import { findVulnerablePackages }   from './vulns';
import { getAlternative }           from './alternatives';
import { printHeader, printError, printWarning, printSummary } from '../../reporter';
import { printBuddy }               from '../../buddy';
import { DepsIssue }                from '../../types';

export interface DepsRunOptions {
  json:            boolean;
  suppressSummary?: boolean;
}

export interface DepsCounts {
  errors:   number;
  warnings: number;
}

export async function runDeps(options: DepsRunOptions): Promise<DepsCounts> {
  const cwd = process.cwd();

  // run all checks — unused is sync, outdated + vulns are async (parallel)
  const unused = findUnusedPackages(cwd);
  const [outdated, vulns] = await Promise.all([
    findOutdatedPackages(cwd),
    findVulnerablePackages(cwd),
  ]);

  // alternatives — cross-reference unused + all declared packages
  const allNames = new Set([
    ...unused.map((i) => i.name),
    ...outdated.map((i) => i.name),
  ]);
  const alternatives: DepsIssue[] = [];
  for (const name of allNames) {
    const alt = getAlternative(name);
    if (alt) {
      alternatives.push({
        type:       'alternative',
        severity:   'warning',
        name,
        message:    `${alt.size}  →  consider ${alt.suggestion}`,
      });
    }
  }

  const allIssues = [...unused, ...outdated, ...vulns, ...alternatives];

  const errors   = allIssues.filter((i) => i.severity === 'error');
  const warnings = allIssues.filter((i) => i.severity === 'warning');

  if (options.json) {
    console.log(JSON.stringify(allIssues, null, 2));
    return { errors: errors.length, warnings: warnings.length };
  }

  printHeader('DEPS AUDIT');

  if (unused.length > 0) {
    console.log('\n  Unused');
    for (const i of unused) printError(i.name, i.message);
  }

  if (outdated.length > 0) {
    console.log('\n  Outdated');
    for (const i of outdated) printWarning(i.name, i.message);
  }

  if (vulns.length > 0) {
    console.log('\n  Vulnerabilities');
    for (const i of vulns) printError(i.name, i.message);
  }

  if (alternatives.length > 0) {
    console.log('\n  Alternatives');
    for (const i of alternatives) printWarning(i.name, i.message);
  }

  if (allIssues.length === 0) {
    console.log('\n  ✔ All dependency checks passed');
  }

  if (!options.suppressSummary) {
    printSummary(errors.length, warnings.length, 0);
    const hasErrors = errors.length > 0;
    printBuddy(
      hasErrors ? 'error' : 'clear',
      hasErrors ? `${errors.length} dep error(s) — fix before deploy.` : ''
    );
  }

  return { errors: errors.length, warnings: warnings.length };
}
