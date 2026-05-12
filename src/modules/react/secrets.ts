import fs   from 'fs';
import path from 'path';
import { ReactIssue } from '../../types';

interface SecretPattern {
  name:  string;
  regex: RegExp;
}

const PATTERNS: SecretPattern[] = [
  { name: 'AWS Access Key ID',        regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'OpenAI API Key',           regex: /sk-[A-Za-z0-9]{48}/ },
  { name: 'Google API Key',           regex: /AIza[0-9A-Za-z\-_]{35}/ },
  { name: 'GitHub Token',             regex: /ghp_[A-Za-z0-9]{36}/ },
  { name: 'Stripe Secret Key',        regex: /sk_(?:live|test)_[A-Za-z0-9]{24,}/ },
  { name: 'Slack Token',              regex: /xox[baprs]-[0-9A-Za-z\-]{10,}/ },
  { name: 'Hardcoded credential',     regex: /(?:password|passwd|secret|api_key|apikey|auth_token|access_token)\s*[:=]\s*["'][^"'${\s]{8,}["']/i },
];

const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'coverage', '.next', 'build']);
const SRC_EXTS  = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

function* walkSrc(dir: string): Generator<string> {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walkSrc(path.join(dir, entry.name));
    } else if (SRC_EXTS.has(path.extname(entry.name))) {
      yield path.join(dir, entry.name);
    }
  }
}

export function runReactSecrets(options: { json: boolean }, cwd = process.cwd()): ReactIssue[] {
  const issues: ReactIssue[] = [];

  if (!fs.existsSync(cwd)) return issues;

  for (const filePath of walkSrc(cwd)) {
    const rel   = path.relative(cwd, filePath).replace(/\\/g, '/');
    let content: string;
    try { content = fs.readFileSync(filePath, 'utf-8'); } catch { continue; }

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      for (const { name, regex } of PATTERNS) {
        if (regex.test(lines[i])) {
          issues.push({
            type:     'hardcoded-secret',
            severity: 'error',
            file:     rel,
            line:     i + 1,
            message:  `Possible ${name} — move to environment variable`,
          });
          break; // one issue per line
        }
      }
    }
  }

  if (options.json) {
    console.log(JSON.stringify(issues, null, 2));
  } else {
    if (issues.length === 0) {
      console.log('\n  ✔ No hardcoded secrets found');
    } else {
      console.log('\n── SECRETS SCAN ─────────────────────────────');
      for (const i of issues) {
        const loc = i.line != null ? `:${i.line}` : '';
        console.log(`  \x1b[31m✗\x1b[0m ${i.file}${loc} — ${i.message}`);
      }
    }
  }

  return issues;
}
