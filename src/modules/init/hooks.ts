import fs   from 'fs';
import path from 'path';

const HOOK_CONTENT = `#!/bin/sh
npx @kevinpatil/devguard --strict
`;

function detectHusky(cwd: string): boolean {
  if (fs.existsSync(path.join(cwd, '.husky'))) return true;
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf-8'));
    return Boolean(pkg.devDependencies?.husky ?? pkg.dependencies?.husky);
  } catch {
    return false;
  }
}

export function setupHooks(cwd: string): void {
  const hasHusky = detectHusky(cwd);

  if (hasHusky) {
    const huskyDir  = path.join(cwd, '.husky');
    const hookPath  = path.join(huskyDir, 'pre-commit');
    fs.mkdirSync(huskyDir, { recursive: true });
    fs.writeFileSync(hookPath, HOOK_CONTENT, { mode: 0o755 });
    console.log(`  ✔ Created .husky/pre-commit`);
    console.log(`  Run 'npx husky install' if you haven't already.`);
  } else {
    const hooksDir = path.join(cwd, '.git', 'hooks');
    if (!fs.existsSync(hooksDir)) {
      console.error(`  ✗ .git/hooks not found — is this a git repository?`);
      return;
    }
    const hookPath = path.join(hooksDir, 'pre-commit');
    fs.writeFileSync(hookPath, HOOK_CONTENT, { mode: 0o755 });
    console.log(`  ✔ Created .git/hooks/pre-commit`);
  }
}
