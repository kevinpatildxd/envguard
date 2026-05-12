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
import { runReactSecrets }   from './modules/react/secrets';
import { setupHooks }        from './modules/init/hooks';
import { generateZodSchema } from './modules/env/zodSchema';
import { printBuddy }                        from './buddy';
import { printSummary, printHealthScore }    from './reporter';
import { buildSarif, writeSarif }            from './sarif';
import { loadConfig }                        from './config';

export const program = new Command();

program
  .name('devguard')
  .description('Guard your project — env, deps, and React code quality in one command')
  .version('2.0.0')
  .option('--json',   'output results as JSON')
  .option('--strict', 'exit with code 1 if any errors are found')
  .option('--score',  'print health score only, no detail output')
  .option('--sarif',  'write SARIF report to devguard.sarif (for GitHub Code Scanning)')
  .action(async (opts) => {
    const cwd    = process.cwd();
    const config = loadConfig(cwd);

    // merge config defaults — CLI flags take precedence
    if (opts.strict  === undefined && config.strict)  opts.strict  = config.strict;
    if (opts.json    === undefined && config.json)     opts.json    = config.json;

    const pkgPath = path.join(cwd, 'package.json');
    const hasReact = (() => {
      if (!fs.existsSync(pkgPath)) return false;
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      return Boolean(pkg.dependencies?.react ?? pkg.devDependencies?.react);
    })();

    // start deps async immediately so network calls run while env validates
    const depsPromise = runDeps({ json: !!opts.json, suppressSummary: true, silent: !!opts.score });
    const envCounts   = runEnv({
      example:         '.env.example',
      strict:          false,
      json:            !!opts.json,
      init:            false,
      suppressSummary: true,
      silent:          !!opts.score,
    });
    const depsCounts = await depsPromise;

    if (opts.sarif) {
      writeSarif(buildSarif({ depsIssues: [], envResults: [], reactIssues: [] }));
    }

    if (opts.json) return;

    const totalErrors   = envCounts.errors   + depsCounts.errors;
    const totalWarnings = envCounts.warnings  + depsCounts.warnings;
    const totalPassed   = envCounts.passed;

    if (opts.score) {
      printHealthScore(totalErrors, totalWarnings);
      if (opts.strict && totalErrors > 0) process.exit(1);
      return;
    }

    if (hasReact) {
      console.log('\n  React project detected — run `devguard react` for React-specific checks');
    }

    printSummary(totalErrors, totalWarnings, totalPassed);
    printHealthScore(totalErrors, totalWarnings);
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
  .option('--init',     'generate .env.example from your .env file')
  .option('--scan-git', 'scan git history for committed .env files')
  .option('--depth <n>', 'number of commits to scan with --scan-git (default: 50)', '50')
  .option('--schema',   'generate a Zod schema (env.schema.ts) from your .env.example')
  .action((opts) => {
    if (opts.schema) {
      generateZodSchema(opts.example ?? '.env.example', 'env.schema.ts');
      return;
    }
    runEnv({
      file:    opts.file,
      example: opts.example,
      strict:  !!opts.strict,
      json:    !!opts.json,
      init:    !!opts.init,
      scanGit: !!opts.scanGit,
      depth:   Number(opts.depth),
    });
  });

program
  .command('deps')
  .description('Audit dependencies for unused packages, outdated versions, and vulnerabilities')
  .option('--json',          'output results as JSON')
  .option('--licenses',      'audit package licenses for copyleft and missing declarations')
  .option('--supply-chain',  'check for install scripts, abandoned packages, and single-maintainer risk')
  .option('--duplicates',    'detect packages installed at multiple versions')
  .option('--fix',           'remove unused packages via npm uninstall')
  .option('--dry-run',       'show what --fix would remove without removing')
  .action(async (opts) => {
    await runDeps({
      json:        !!opts.json,
      licenses:    !!opts.licenses,
      supplyChain: !!opts.supplyChain,
      duplicates:  !!opts.duplicates,
      fix:         !!opts.fix,
      dryRun:      !!opts.dryRun,
    });
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

program
  .command('react:secrets')
  .description('Scan source files for hardcoded secrets, API keys, and credentials')
  .option('--json', 'output results as JSON')
  .action((opts) => {
    runReactSecrets({ json: !!opts.json });
  });

program
  .command('init')
  .description('Set up devguard in your project')
  .option('--hooks', 'install a pre-commit hook that runs devguard --strict')
  .action((opts) => {
    const cwd = process.cwd();
    if (opts.hooks) {
      setupHooks(cwd);
    } else {
      console.log('  Use --hooks to install a pre-commit hook.');
    }
  });
