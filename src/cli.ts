import { Command } from 'commander';

export const program = new Command();

program
  .name('devguard')
  .description('Guard your project — env, deps, and React code quality in one command')
  .version('1.1.0');

program
  .command('env')
  .description('Validate .env files against .env.example')
  .option('--file <file>', 'target a specific .env file')
  .option('--example <file>', 'path to example file', '.env.example')
  .option('--strict', 'exit with code 1 if any errors are found')
  .option('--json', 'output results as JSON')
  .option('--init', 'generate .env.example from your .env file')
  .action(() => {
    console.log('env module — coming in Phase 2');
  });

program
  .command('deps')
  .description('Audit dependencies for unused packages, outdated versions, and vulnerabilities')
  .option('--json', 'output results as JSON')
  .action(() => {
    console.log('deps module — coming in Phase 3');
  });

program
  .command('react')
  .description('Audit React code quality — imports, rerenders, hooks, bundle, a11y, server components')
  .option('--entry <file>', 'entry point file (e.g. src/main.tsx)')
  .option('--json', 'output results as JSON')
  .action(() => {
    console.log('react module — coming in Phase 5');
  });
