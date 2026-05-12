import { execSync } from 'child_process';

export interface GitScanIssue {
  type:     'git-secret';
  severity: 'error';
  file:     string;
  commit:   string;
  message:  string;
}

const ENV_FILE   = /^\.env($|\.)/;
const SAFE_FILE  = /(example|sample|template)/i;

export function scanGitHistory(cwd: string, depth = 50): GitScanIssue[] {
  try {
    const out = execSync(
      `git log --diff-filter=A --name-only --format=COMMIT:%H -n ${depth}`,
      { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] },
    ).trim();

    if (!out) return [];

    const issues: GitScanIssue[] = [];
    let commit = '';

    for (const raw of out.split('\n')) {
      const line = raw.trim();
      if (line.startsWith('COMMIT:')) {
        commit = line.slice(7);
      } else if (line && ENV_FILE.test(line) && !SAFE_FILE.test(line)) {
        issues.push({
          type:    'git-secret',
          severity: 'error',
          file:    line,
          commit:  commit.slice(0, 7),
          message: `${line} committed in ${commit.slice(0, 7)} — secrets may be in git history`,
        });
      }
    }

    return issues;
  } catch {
    return [];
  }
}
