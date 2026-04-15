import { Command } from 'commander';
import { runEnv }  from './modules/env';
import { runDeps } from './modules/deps';

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
  .action((opts) => {
    runEnv({
      file:    opts.file,
      example: opts.example,
      strict:  !!opts.strict,
      json:    !!opts.json,
      init:    !!opts.init,
    });
  });

program
  .command('deps')
  .description('Audit dependencies for unused packages, outdated versions, and vulnerabilities')
  .option('--json', 'output results as JSON')
  .action((opts) => {
    runDeps({ json: !!opts.json });
  });

program
  .command('react')
  .description('Audit React code quality — imports, rerenders, hooks, bundle, a11y, server components')
  .option('--entry <file>', 'entry point file (e.g. src/main.tsx)')
  .option('--json', 'output results as JSON')
  .action(() => {
    console.log('react module — coming in Phase 5');
  });
