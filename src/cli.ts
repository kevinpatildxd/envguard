import fs          from 'fs';
import path        from 'path';
import { Command } from 'commander';
import { runEnv }          from './modules/env';
import { runDeps }         from './modules/deps';
import { runReactImports }   from './modules/react/imports';
import { runReactRerenders } from './modules/react/rerenders';
import { runReactHooks }     from './modules/react/hooks';
import { runReactBundle }    from './modules/react/bundle';
import { runReactA11y }      from './modules/react/a11y';
import { runReactServer }    from './modules/react/server';
import { printBuddy }   from './buddy';
import { printSummary } from './reporter';

export const program = new Command();

program
  .name('devguard')
  .description('Guard your project — env, deps, and React code quality in one command')
  .version('1.1.0')
  .option('--json',   'output results as JSON')
  .option('--strict', 'exit with code 1 if any errors are found')
  .action(async (opts) => {
    const cwd     = process.cwd();
    const pkgPath = path.join(cwd, 'package.json');
    const hasReact = (() => {
      if (!fs.existsSync(pkgPath)) return false;
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      return Boolean(pkg.dependencies?.react ?? pkg.devDependencies?.react);
    })();

    // start deps async immediately so network calls run while env validates
    const depsPromise = runDeps({ json: !!opts.json, suppressSummary: true });
    const envCounts   = runEnv({
      example:         '.env.example',
      strict:          false,
      json:            !!opts.json,
      init:            false,
      suppressSummary: true,
    });
    const depsCounts = await depsPromise;

    if (opts.json) return;

    if (hasReact) {
      console.log('\n  React project detected — run `devguard react` for React-specific checks');
    }

    const totalErrors   = envCounts.errors   + depsCounts.errors;
    const totalWarnings = envCounts.warnings  + depsCounts.warnings;
    const totalPassed   = envCounts.passed;

    printSummary(totalErrors, totalWarnings, totalPassed);
    printBuddy(
      totalErrors > 0 ? 'error' : 'clear',
      totalErrors > 0 ? `${totalErrors} error(s) — fix before deploying.` : ''
    );

    if (opts.strict && totalErrors > 0) process.exit(1);
  });

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
  .action(async (opts) => {
    await runDeps({ json: !!opts.json });
  });

program
  .command('react:imports')
  .description('Find unused imports and dead files across your React codebase')
  .option('--entry <file>', 'entry point file (e.g. src/main.tsx)')
  .option('--json', 'output results as JSON')
  .action((opts) => {
    runReactImports({ entry: opts.entry, json: !!opts.json });
  });

program
  .command('react:rerenders')
  .description('Detect inline objects/functions in JSX props and missing React.memo')
  .option('--json', 'output results as JSON')
  .action((opts) => {
    runReactRerenders({ json: !!opts.json });
  });

program
  .command('react:hooks')
  .description('Lint React hooks rule violations — conditional, loop, nested function, invalid caller')
  .option('--json', 'output results as JSON')
  .action((opts) => {
    runReactHooks({ json: !!opts.json });
  });

program
  .command('react:bundle')
  .description('Warn about heavy npm packages that inflate your bundle')
  .option('--json', 'output results as JSON')
  .option('--threshold <kb>', 'warn threshold in kB gzipped (default: 50)', '50')
  .action(async (opts) => {
    await runReactBundle({ json: !!opts.json, threshold: Number(opts.threshold) });
  });

program
  .command('react:a11y')
  .description('Scan JSX for accessibility violations — img, button, input, anchor checks')
  .option('--json', 'output results as JSON')
  .action((opts) => {
    runReactA11y({ json: !!opts.json });
  });

program
  .command('react:server')
  .description('Check React Server Component boundaries — client hooks in server, server modules in client')
  .option('--json', 'output results as JSON')
  .action((opts) => {
    runReactServer({ json: !!opts.json });
  });

program
  .command('react')
  .description('Run all React checks — imports, rerenders, hooks, bundle, a11y, server')
  .option('--entry <file>', 'entry point file (e.g. src/main.tsx)')
  .option('--json', 'output results as JSON')
  .action(async (opts) => {
    runReactImports({ entry: opts.entry, json: !!opts.json });
    runReactRerenders({ json: !!opts.json });
    runReactHooks({ json: !!opts.json });
    await runReactBundle({ json: !!opts.json });
    runReactA11y({ json: !!opts.json });
    runReactServer({ json: !!opts.json });
  });
