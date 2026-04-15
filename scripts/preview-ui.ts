import chalk from 'chalk';
import readline from 'readline';

// ── helpers ───────────────────────────────────────────────────────────────────

function vis(s: string): number {
  return s.replace(/\x1b\[[0-9;]*m/g, '').length;
}

function sectionHeader(label: string, width = 52): void {
  const dashes = '─'.repeat(Math.max(0, width - label.length - 4));
  console.log(chalk.bold.cyan(`\n── ${label} ${dashes}`));
}

function errorLine(key: string, msg: string): void {
  console.log(chalk.red(`  ✗ ${key.padEnd(22)} ${msg}`));
}

function warnLine(key: string, msg: string): void {
  console.log(chalk.yellow(`  ⚠ ${key.padEnd(22)} ${msg}`));
}

function passedLine(count: number): void {
  console.log(chalk.green(`  PASSED (${count}) ✔`));
}

// ── bottom panel ──────────────────────────────────────────────────────────────

function bottomPanel(state: 'idle' | 'clear' | 'error', summary = ''): void {
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
    line0 = chalk.bold('devguard') + chalk.dim('  ›  ') + chalk.dim('scan your project? press enter...');
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

// ── step 1: input screen ──────────────────────────────────────────────────────

process.stdout.write('\x1Bc'); // clear screen
console.log();
bottomPanel('idle');
console.log();

// wait for Enter
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('', () => {
  rl.close();

  // ── step 2: show audit results ──────────────────────────────────────────────

  process.stdout.write('\x1Bc');
  console.log();

  // ENV AUDIT
  sectionHeader('ENV AUDIT');
  console.log(chalk.dim('\n  .env'));
  errorLine('DATABASE_URL', 'Missing required key (defined in .env.example)');
  errorLine('JWT_SECRET',   "Insecure placeholder value: 'secret'");
  warnLine ('PORT',         "Expected a number but got 'abc'");
  warnLine ('STRIPE_KEY',   'Key is not declared in .env.example');
  passedLine(9);
  console.log(chalk.dim('\n  .env.staging'));
  console.log(chalk.green('  ✔ All checks passed'));
  console.log(chalk.cyan('\n  ⚡ Cross-environment'));
  console.log(chalk.cyan('    REDIS_URL — present in [.env] but missing in [.env.staging]'));

  // DEPS AUDIT
  sectionHeader('DEPS AUDIT');
  console.log(chalk.bold('\n  Unused'));
  errorLine('moment', 'imported nowhere in your source');
  errorLine('lodash', 'imported nowhere in your source');
  console.log(chalk.bold('\n  Outdated'));
  warnLine('axios', '0.27.0  →  1.7.2');
  console.log(chalk.bold('\n  Vulnerabilities'));
  errorLine('express@4.18.0', 'CVE-2024-29041  High');
  console.log(chalk.bold('\n  Alternatives'));
  warnLine('moment', '67KB  →  date-fns (13KB) or dayjs (2KB)');

  // REACT AUDIT
  sectionHeader('REACT AUDIT');
  console.log(chalk.bold('\n  Imports'));
  errorLine('OldModal.tsx',  'src/components/OldModal.tsx — imported nowhere');
  warnLine ('helpers.ts',    'formatDate imported but never used');
  console.log(chalk.bold('\n  Re-renders'));
  warnLine('Home.tsx:42',    'inline object in JSX prop causes re-renders');
  warnLine('Home.tsx:58',    'inline arrow function in onClick — use useCallback');
  console.log(chalk.bold('\n  Hooks'));
  errorLine('Form.tsx:31',   'hook called inside if block — violates Rules of Hooks');
  console.log(chalk.bold('\n  Bundle'));
  warnLine('moment', '67KB  →  consider date-fns (13KB) or dayjs (2KB)');
  warnLine('lodash', '71KB  →  consider lodash-es or individual imports');
  console.log(chalk.bold('\n  Accessibility'));
  errorLine('Avatar.tsx:12', '<img> missing alt attribute');
  errorLine('Sidebar.tsx:8', '<div onClick> should be <button>');
  warnLine ('Input.tsx:5',   '<input> missing associated <label>');
  console.log(chalk.bold('\n  Server Components'));
  errorLine('Dashboard.tsx', 'server component uses useState (client-only hook)');
  errorLine('Header.tsx',    'client component imports next/headers (server-only)');

  // summary
  console.log(
    '\n  ' +
    chalk.red.bold('7 errors') + '   ' +
    chalk.yellow('6 warnings') + '   ' +
    chalk.green('9 passed')
  );

  // bottom panel — error state
  console.log();
  bottomPanel('error', '7 errors — fix before deploy.');
  console.log();
});
