import fs   from 'fs';
import path from 'path';
import { httpGet }   from '../../utils/httpClient';
import { DepsIssue } from '../../types';

const OK = new Set([
  'MIT', 'ISC', 'BSD-2-Clause', 'BSD-3-Clause', 'BSD-4-Clause',
  'Apache-2.0', '0BSD', 'Unlicense', 'CC0-1.0', 'WTFPL',
]);

const WARN = new Set([
  'GPL-2.0', 'GPL-2.0-only', 'GPL-2.0-or-later',
  'GPL-3.0', 'GPL-3.0-only', 'GPL-3.0-or-later',
  'LGPL-2.0', 'LGPL-2.0-only', 'LGPL-2.0-or-later',
  'LGPL-2.1', 'LGPL-2.1-only', 'LGPL-2.1-or-later',
  'LGPL-3.0', 'LGPL-3.0-only', 'LGPL-3.0-or-later',
  'CC-BY-SA-4.0', 'MPL-2.0',
]);

const ERROR = new Set([
  'AGPL-3.0', 'AGPL-3.0-only', 'AGPL-3.0-or-later',
]);

interface NpmLatest {
  license?: string;
}

function classify(license: string | undefined): 'ok' | 'warning' | 'error' {
  if (!license || license.toUpperCase() === 'UNLICENSED') return 'warning';
  if (ERROR.has(license)) return 'error';
  if (WARN.has(license))  return 'warning';
  if (OK.has(license))    return 'ok';
  if (/^BSD/i.test(license)) return 'ok';
  return 'warning';
}

export async function findLicenseIssues(cwd: string): Promise<DepsIssue[]> {
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) return [];

  const pkg  = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const names = Object.keys(deps);
  if (names.length === 0) return [];

  const settled = await Promise.allSettled(
    names.map(async (name) => {
      const data = await httpGet<NpmLatest>(
        `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`,
      );
      return { name, license: data.license };
    }),
  );

  const issues: DepsIssue[] = [];

  for (const result of settled) {
    if (result.status === 'rejected') continue;
    const { name, license } = result.value;
    const level = classify(license);
    if (level === 'ok') continue;

    issues.push({
      type:     'license',
      severity: level,
      name,
      message:  license
        ? `${license} — ${level === 'error' ? 'copyleft license may restrict commercial use' : 'review license terms before use'}`
        : 'no license declared — usage rights unclear',
    });
  }

  return issues.sort((a, b) => a.name.localeCompare(b.name));
}
