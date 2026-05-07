import chalk from 'chalk';

const HEADER_WIDTH = 52;

export function printHeader(label: string): void {
  const dashes = '─'.repeat(Math.max(0, HEADER_WIDTH - label.length - 4));
  console.log(chalk.bold.cyan(`\n── ${label} ${dashes}`));
}

export function printError(key: string, msg: string): void {
  console.log(chalk.red(`  ✗ ${key.padEnd(22)} ${msg}`));
}

export function printWarning(key: string, msg: string): void {
  console.log(chalk.yellow(`  ⚠ ${key.padEnd(22)} ${msg}`));
}

export function printPassed(count: number): void {
  console.log(chalk.green(`  PASSED (${count}) ✔`));
}

export function printSummary(errors: number, warnings: number, passed: number): void {
  const e = errors   > 0 ? chalk.red.bold(`${errors} errors`)     : chalk.dim('0 errors');
  const w = warnings > 0 ? chalk.yellow(`${warnings} warnings`)   : chalk.dim('0 warnings');
  const p = chalk.green(`${passed} passed`);
  console.log(`\n  ${e}   ${w}   ${p}`);
}

export function calcHealthScore(errors: number, warnings: number): number {
  return Math.max(0, 100 - errors * 10 - warnings * 3);
}

export function printHealthScore(errors: number, warnings: number): void {
  const score = calcHealthScore(errors, warnings);
  const BAR_WIDTH = 20;
  const filled  = Math.round((score / 100) * BAR_WIDTH);
  const bar     = '█'.repeat(filled) + '░'.repeat(BAR_WIDTH - filled);
  const colored = score >= 80
    ? chalk.green(`${score} / 100`)
    : score >= 50
      ? chalk.yellow(`${score} / 100`)
      : chalk.red(`${score} / 100`);
  const barColored = score >= 80
    ? chalk.green(bar)
    : score >= 50
      ? chalk.yellow(bar)
      : chalk.red(bar);

  console.log(chalk.bold('\n  Project Health Score'));
  console.log(chalk.dim('  ─────────────────────'));
  console.log(`  ${barColored}  ${colored}`);
  console.log(chalk.dim(`  ${errors} error(s) · ${warnings} warning(s)\n`));
}
