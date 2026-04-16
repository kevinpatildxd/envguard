import fs from 'fs';
import path from 'path';
import { parseEnvFile, parseEnvExample } from './parser';
import { missingKey }      from './rules/missing-key';
import { emptyValue }      from './rules/empty-value';
import { undeclaredKey }   from './rules/undeclared-key';
import { insecureDefaults }from './rules/insecure-defaults';
import { weakSecret }      from './rules/weak-secret';
import { typeMismatch }    from './rules/type-mismatch';
import { malformedUrl }    from './rules/malformed-url';
import { booleanMismatch } from './rules/boolean-mismatch';
import { checkConsistency, ConsistencyIssue } from './consistency';
import { printHeader, printError, printWarning, printPassed, printSummary } from '../../reporter';
import { printBuddy } from '../../buddy';
import { ValidationResult } from '../../types';

const SKIP_FILES = new Set(['.env.example', '.env.sample', '.env.template']);

function findEnvFiles(cwd: string): string[] {
  return fs
    .readdirSync(cwd)
    .filter((f) => f.startsWith('.env') && !SKIP_FILES.has(f) && !f.endsWith('.example'))
    .sort();
}

function generateExample(envPath: string, examplePath: string): void {
  const lines  = fs.readFileSync(envPath, 'utf-8').split('\n');
  const output = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) return line;
    return line.slice(0, eqIndex + 1);
  });
  fs.writeFileSync(examplePath, output.join('\n'), 'utf-8');
}

export function validate(env: ReturnType<typeof parseEnvFile>, example: ReturnType<typeof parseEnvExample>): ValidationResult[] {
  return [
    ...missingKey(env, example),
    ...emptyValue(env, example),
    ...undeclaredKey(env, example),
    ...insecureDefaults(env, example),
    ...weakSecret(env, example),
    ...typeMismatch(env, example),
    ...malformedUrl(env, example),
    ...booleanMismatch(env, example),
  ];
}

export interface EnvRunOptions {
  file?:           string;
  example:         string;
  strict:          boolean;
  json:            boolean;
  init:            boolean;
  suppressSummary?: boolean;
}

export interface EnvCounts {
  errors:   number;
  warnings: number;
  passed:   number;
}

export function runEnv(options: EnvRunOptions): EnvCounts {
  const cwd         = process.cwd();
  const examplePath = path.resolve(cwd, options.example);

  // --init mode
  if (options.init) {
    const sourcePath = path.resolve(cwd, options.file ?? '.env');
    if (!fs.existsSync(sourcePath)) {
      console.error(`Error: '${options.file ?? '.env'}' not found. Cannot generate .env.example.`);
      process.exit(1);
    }
    if (fs.existsSync(examplePath)) {
      console.error(`Error: '${options.example}' already exists. Delete it first to regenerate.`);
      process.exit(1);
    }
    generateExample(sourcePath, examplePath);
    console.log(`✔ Generated ${options.example} from ${options.file ?? '.env'} (all values blanked)`);
    return { errors: 0, warnings: 0, passed: 0 };
  }

  if (!fs.existsSync(examplePath)) {
    console.error(`Error: '${options.example}' not found.`);
    console.error(`Tip: Run 'npx @kevinpatil/devguard env --init' to generate one from your .env`);
    process.exit(1);
  }

  const example = parseEnvExample(examplePath);

  // single file mode
  if (options.file) {
    const envPath = path.resolve(cwd, options.file);
    if (!fs.existsSync(envPath)) {
      console.error(`Error: '${options.file}' not found.`);
      process.exit(1);
    }
    const env     = parseEnvFile(envPath);
    const results = validate(env, example);

    const errors         = results.filter((r) => r.severity === 'error');
    const warnings       = results.filter((r) => r.severity === 'warning');
    const keysWithIssues = new Set(results.map((r) => r.key));
    const passed         = [...example.keys()].filter((k) => env.has(k) && !keysWithIssues.has(k)).length;

    if (options.json) {
      console.log(JSON.stringify(results, null, 2));
      return { errors: errors.length, warnings: warnings.length, passed };
    }

    printHeader('ENV AUDIT');
    console.log();
    for (const r of errors)   printError(r.key, r.message);
    for (const r of warnings) printWarning(r.key, r.message);
    printPassed(passed);

    if (!options.suppressSummary) {
      printSummary(errors.length, warnings.length, passed);
      printBuddy(errors.length > 0 ? 'error' : 'clear', errors.length > 0 ? `${errors.length} error(s) — fix before deploy.` : '');
    }

    if (options.strict && errors.length > 0) process.exit(1);
    return { errors: errors.length, warnings: warnings.length, passed };
  }

  // auto-scan mode
  const envFiles = findEnvFiles(cwd);
  if (envFiles.length === 0) {
    console.error(`No .env files found in ${cwd}`);
    console.error(`Tip: Create a .env file or use --file <file> to point to one.`);
    process.exit(1);
  }

  const allResults: { file: string; results: ValidationResult[]; env: ReturnType<typeof parseEnvFile> }[] = [];
  for (const file of envFiles) {
    const envPath = path.resolve(cwd, file);
    const env     = parseEnvFile(envPath);
    const results = validate(env, example);
    allResults.push({ file, results, env });
  }

  const consistency = checkConsistency(allResults.map(({ file, env }) => ({ file, env })));

  let totalErrors = 0, totalWarnings = 0, totalPassed = 0;

  if (options.json) {
    console.log(JSON.stringify({
      files: allResults.map(({ file, results }) => ({ file, results })),
      consistency,
    }, null, 2));
    return { errors: totalErrors, warnings: totalWarnings, passed: totalPassed };
  }

  printHeader('ENV AUDIT');

  for (const { file, results, env } of allResults) {
    const errors         = results.filter((r) => r.severity === 'error');
    const warnings       = results.filter((r) => r.severity === 'warning');
    const keysWithIssues = new Set(results.map((r) => r.key));
    const passed         = [...example.keys()].filter((k) => env.has(k) && !keysWithIssues.has(k)).length;

    console.log(`\n  ${file}`);
    if (errors.length === 0 && warnings.length === 0) {
      console.log(`  ✔ All checks passed`);
    } else {
      for (const r of errors)   printError(r.key, r.message);
      for (const r of warnings) printWarning(r.key, r.message);
    }

    totalErrors   += errors.length;
    totalWarnings += warnings.length;
    totalPassed   += passed;
  }

  if (consistency.length > 0) {
    console.log('\n  ⚡ Cross-environment');
    for (const issue of consistency) {
      console.log(`    ${issue.key} — present in [${issue.presentIn.join(', ')}] but missing in [${issue.missingIn.join(', ')}]`);
    }
  }

  if (!options.suppressSummary) {
    printSummary(totalErrors, totalWarnings, totalPassed);
    printBuddy(totalErrors > 0 ? 'error' : 'clear', totalErrors > 0 ? `${totalErrors} error(s) — fix before deploy.` : '');
  }

  if (options.strict && totalErrors > 0) process.exit(1);
  return { errors: totalErrors, warnings: totalWarnings, passed: totalPassed };
}
