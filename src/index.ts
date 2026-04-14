import { Command } from 'commander';
import path from 'path';
import { parseEnvFile, parseEnvExample } from './parser';
import { validate } from './validator';
import { report } from './reporter';

const program = new Command();

program
  .name('envguard')
  .description('Validate .env files against .env.example before your app ships')
  .version('0.0.1')
  .option('--env <file>', 'path to .env file', '.env')
  .option('--example <file>', 'path to .env.example file', '.env.example')
  .option('--strict', 'exit with code 1 if any errors are found')
  .option('--json', 'output results as JSON')
  .action((options) => {
    const envPath = path.resolve(process.cwd(), options.env);
    const examplePath = path.resolve(process.cwd(), options.example);

    const env = parseEnvFile(envPath);
    const example = parseEnvExample(examplePath);

    const results = validate(env, example);
    report(results, { json: options.json });

    const hasErrors = results.some((r) => r.severity === 'error');
    if (options.strict && hasErrors) {
      process.exit(1);
    }
  });

program.parse();
