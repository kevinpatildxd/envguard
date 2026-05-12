import { execSync }                 from 'child_process';
import { findUnusedPackages }      from './unused';
import { findOutdatedPackages }     from './outdated';
import { findVulnerablePackages }   from './vulns';
import { getAlternative }           from './alternatives';
import { findLicenseIssues }        from './licenses';
import { findSupplyChainRisks }     from './supplyChain';
import { findDuplicateDeps }        from './duplicates';
import { printHeader, printError, printWarning, printSummary } from '../../reporter';
import { printBuddy }               from '../../buddy';
import { DepsIssue }                from '../../types';

export interface DepsRunOptions {
  json:             boolean;
  licenses?:        boolean;
  fix?:             boolean;
  dryRun?:          boolean;
  supplyChain?:     boolean;
  duplicates?:      boolean;
  suppressSummary?: boolean;
  silent?:          boolean;
}

export interface DepsCounts {
  errors:   number;
  warnings: number;
}

export async function runDeps(options: DepsRunOptions): Promise<DepsCounts> {
  const cwd = process.cwd();

  // run all checks — unused is sync, async checks run in parallel
  const unused = findUnusedPackages(cwd);
  const dupes  = options.duplicates ? findDuplicateDeps(cwd) : [] as DepsIssue[];
  const [outdated, vulns, licenses, supplyChain] = await Promise.all([
    findOutdatedPackages(cwd),
    findVulnerablePackages(cwd),
    options.licenses    ? findLicenseIssues(cwd)       : Promise.resolve([] as DepsIssue[]),
    options.supplyChain ? findSupplyChainRisks(cwd)    : Promise.resolve([] as DepsIssue[]),
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

  const allIssues = [...unused, ...outdated, ...vulns, ...alternatives, ...licenses, ...supplyChain, ...dupes];

  const errors   = allIssues.filter((i) => i.severity === 'error');
  const warnings = allIssues.filter((i) => i.severity === 'warning');

  if (options.json) {
    console.log(JSON.stringify(allIssues, null, 2));
    return { errors: errors.length, warnings: warnings.length };
  }

  if (!options.silent) {
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

    if (licenses.length > 0) {
      console.log('\n  Licenses');
      for (const i of licenses) {
        if (i.severity === 'error') printError(i.name, i.message);
        else printWarning(i.name, i.message);
      }
    }

    if (supplyChain.length > 0) {
      console.log('\n  Supply Chain');
      for (const i of supplyChain) printWarning(i.name, i.message);
    }

    if (dupes.length > 0) {
      console.log('\n  Duplicate Versions');
      for (const i of dupes) printWarning(i.name, i.message);
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
  }

  // --dry-run / --fix for unused packages
  if ((options.dryRun || options.fix) && unused.length > 0) {
    const names = unused.map((i) => i.name);
    if (options.dryRun) {
      console.log(`\n  Dry run — would remove: ${names.join(', ')}`);
    } else {
      console.log(`\n  Removing unused packages: ${names.join(', ')}`);
      try {
        execSync(`npm uninstall ${names.join(' ')}`, { cwd, stdio: 'inherit' });
        console.log('  ✔ Done');
      } catch {
        console.error('  ✗ npm uninstall failed — run manually');
      }
    }
  }

  return { errors: errors.length, warnings: warnings.length };
}
