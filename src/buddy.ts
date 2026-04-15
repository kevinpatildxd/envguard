import chalk from 'chalk';

function vis(s: string): number {
  return s.replace(/\x1b\[[0-9;]*m/g, '').length;
}

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
    line1 = chalk.dim('v2.0.0');
  } else if (state === 'clear') {
    eye   = chalk.green('^');
    line0 = chalk.green.bold('devguard') + chalk.green('  ›  all clear! your project looks great  ✔');
    line1 = chalk.dim('v2.0.0');
  } else {
    eye   = chalk.red('ò');
    line0 = chalk.red.bold('devguard') + chalk.red('  ›  ') + chalk.red(summary || 'found issues — fix errors before deploy.');
    line1 = chalk.dim('v2.0.0');
  }

  const dogLines = [
    white('   / \\__'),
    white('  (') + eye + white('   ') + yellow('@\\___'),
    white('  /         ') + yellow('O'),
    white(' /   (_____/'),
    white('/_____/   U'),
  ];
  const dogW = [8, 12, 13, 12, 11];

  const leftTexts  = [line0, line1, '', '', ''];
  const leftWidths = leftTexts.map(vis);

  console.log(chalk.dim('╭' + '─'.repeat(inner) + '╮'));
  for (let i = 0; i < 5; i++) {
    const gap = inner - L - leftWidths[i] - dogW[i] - R;
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
