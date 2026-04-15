import fs from 'fs';
import path from 'path';
import { httpGet } from '../../utils/httpClient';
import { DepsIssue } from '../../types';

function stripRange(version: string): string {
  return version.replace(/^[\^~>=<]+/, '').trim();
}

function isOutdated(current: string, latest: string): boolean {
  const c = current.split('.').map(Number);
  const l = latest.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((l[i] ?? 0) > (c[i] ?? 0)) return true;
    if ((l[i] ?? 0) < (c[i] ?? 0)) return false;
  }
  return false;
}

interface NpmLatest {
  version: string;
}

export async function findOutdatedPackages(cwd: string): Promise<DepsIssue[]> {
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) return [];

  const pkg  = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const deps = {
    ...pkg.dependencies ?? {},
    ...pkg.devDependencies ?? {},
  } as Record<string, string>;

  const entries = Object.entries(deps).filter(([, v]) => !v.startsWith('file:') && !v.startsWith('git'));

  const results = await Promise.allSettled(
    entries.map(async ([name, range]) => {
      const current = stripRange(range);
      const data    = await httpGet<NpmLatest>(`https://registry.npmjs.org/${name}/latest`);
      return { name, current, latest: data.version };
    })
  );

  const issues: DepsIssue[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      const { name, current, latest } = result.value;
      if (isOutdated(current, latest)) {
        issues.push({
          type:     'outdated',
          severity: 'warning',
          name,
          message:  `${current}  →  ${latest}`,
        });
      }
    }
  }

  return issues.sort((a, b) => a.name.localeCompare(b.name));
}
