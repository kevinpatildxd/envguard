import chalk from 'chalk';

function printBuddy(state: 'idle' | 'clear' | 'error'): void {
  const yellow = chalk.yellow;
  const white = chalk.white;
  const bold = chalk.bold;

  let eye: string;
  let msg1: string;
  let msg2: string;

  if (state === 'idle') {
    eye = ' ';
    msg1 = bold('devguard v1.1.0');
    msg2 = chalk.dim('scanning your project...');
  } else if (state === 'clear') {
    eye = chalk.green('^');
    msg1 = chalk.green.bold('all clear! your project');
    msg2 = chalk.green('looks great  ✔');
  } else {
    eye = chalk.red('ò');
    msg1 = chalk.red.bold('found some issues.');
    msg2 = chalk.red('fix errors before deploy.');
  }

  console.log(white(`   / \\__`));
  console.log(white(`  (${eye}   `) + yellow(`@\\___`) + `    ${msg1}`);
  console.log(white(`  /         `) + yellow(`O`) + `   ${msg2}`);
  console.log(white(` /   (_____/`));
  console.log(white(`/_____/   U`));
}

console.log('\n── idle state ─────────────────────────────\n');
printBuddy('idle');

console.log('\n── all clear state ────────────────────────\n');
printBuddy('clear');

console.log('\n── errors found state ─────────────────────\n');
printBuddy('error');

console.log();
