import fs    from 'fs';
import path  from 'path';
import chalk from 'chalk';

function vis(s: string): number {
  return s.replace(/\x1b\[[0-9;]*m/g, '').length;
}

function getPkgVersion(): string {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf-8')) as { version: string };
    return `v${pkg.version}`;
  } catch {
    return '';
  }
}

const PKG_VERSION = getPkgVersion();

export function printBuddy(state: 'idle' | 'clear' | 'error', summary = ''): void {
  const W     = 80;
  const inner = W - 2;
  const L     = 2;
  const R     = 2;
  const yellow = chalk.yellow;
  const white  = chalk.white;

  let eye: string;
  let line0: string;
  let line1: string;

  if (state === 'idle') {
    eye   = ' ';
    line0 = chalk.bold('devguard') + chalk.dim('  ›  scan your project? press enter...');
    line1 = chalk.dim(PKG_VERSION);
  } else if (state === 'clear') {
    eye   = chalk.green('^');
    line0 = chalk.green.bold('devguard') + chalk.green('  ›  all clear! your project looks great  ✔');
    line1 = chalk.dim(PKG_VERSION);
  } else {
    eye   = chalk.red('ò');
    line0 = chalk.red.bold('devguard') + chalk.red('  ›  ') + chalk.red(summary || 'found issues — fix errors before deploy.');
    line1 = chalk.dim(PKG_VERSION);
  }

  const dogRaw = [
    white('   / \\__'),
    white('  (') + eye + white('   ') + yellow('@\\___'),
    white('  /         ') + yellow('O'),
    white(' /   (_____/'),
    white('/_____/   U'),
  ];
  const DOG_WIDTH = Math.max(...dogRaw.map(vis));
  const dogLines  = dogRaw.map((line) => line + ' '.repeat(DOG_WIDTH - vis(line)));

  const leftTexts  = [line0, line1, '', '', ''];
  const leftWidths = leftTexts.map(vis);

  console.log(chalk.dim('╭' + '─'.repeat(inner) + '╮'));
  for (let i = 0; i < 5; i++) {
    const gap = inner - L - leftWidths[i] - DOG_WIDTH - R;
    console.log(
      chalk.dim('│') +
      ' '.repeat(L) +
      leftTexts[i] +
      ' '.repeat(Math.max(1, gap)) +
      dogLines[i] +
      ' '.repeat(R) +
      chalk.dim('│')
    );
  }
  console.log(chalk.dim('╰' + '─'.repeat(inner) + '╯'));
}
