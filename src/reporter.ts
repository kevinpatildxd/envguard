import chalk from 'chalk';
import { ValidationResult } from './types';

export function report(results: ValidationResult[], options: { json?: boolean } = {}): void {
  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  const errors = results.filter((r) => r.severity === 'error');
  const warnings = results.filter((r) => r.severity === 'warning');
  const passedCount = results.length === 0 ? 'all checks' : 'remaining keys';

  console.log(chalk.bold('\nenvguard — checking .env against .env.example\n'));

  if (errors.length > 0) {
    console.log(chalk.red.bold(`ERRORS (${errors.length})`));
    for (const r of errors) {
      console.log(chalk.red(`  ✗ ${r.key} — ${r.message}`));
    }
    console.log();
  }

  if (warnings.length > 0) {
    console.log(chalk.yellow.bold(`WARNINGS (${warnings.length})`));
    for (const r of warnings) {
      console.log(chalk.yellow(`  ⚠ ${r.key} — ${r.message}`));
    }
    console.log();
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log(chalk.green.bold('  ✔ All checks passed'));
  } else {
    console.log(chalk.green(`PASSED — ${passedCount} ok`));
  }

  console.log();

  if (errors.length > 0) {
    console.log(chalk.red.bold(`${errors.length} error(s) found. Fix them before deploying.`));
  } else if (warnings.length > 0) {
    console.log(chalk.yellow(`${warnings.length} warning(s). Review before deploying.`));
  }
}

