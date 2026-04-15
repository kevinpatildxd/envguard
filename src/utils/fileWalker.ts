import fs from 'fs';
import path from 'path';
import ignore, { Ignore } from 'ignore';

function loadGitignore(dir: string): Ignore {
  const ig = ignore();
  const gitignorePath = path.join(dir, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    ig.add(fs.readFileSync(gitignorePath, 'utf-8'));
  }
  return ig;
}

export function walkFiles(
  dir: string,
  extensions: string[],
  options: { root?: string } = {}
): string[] {
  const root = options.root ?? dir;
  const ig = loadGitignore(root);
  const visited = new Set<number>(); // inode-based cycle guard
  const results: string[] = [];

  function walk(current: string): void {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      const relPath  = path.relative(root, fullPath);

      if (ig.ignores(relPath)) continue;
      if (['node_modules', 'dist', '.git'].includes(entry.name)) continue;

      const stat = fs.statSync(fullPath);

      if (entry.isSymbolicLink() || entry.isDirectory()) {
        if (visited.has(stat.ino)) continue;
        visited.add(stat.ino);
        if (entry.isDirectory() || (entry.isSymbolicLink() && fs.statSync(fullPath).isDirectory())) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  }

  walk(dir);
  return results;
}
