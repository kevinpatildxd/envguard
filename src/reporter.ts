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
