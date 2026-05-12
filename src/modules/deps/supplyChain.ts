import fs   from 'fs';
import path from 'path';
import { httpGet }   from '../../utils/httpClient';
import { DepsIssue } from '../../types';

interface NpmMeta {
  time?:        Record<string, string>;
  maintainers?: unknown[];
  scripts?:     Record<string, string>;
}

const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;
const INSTALL_SCRIPTS = ['install', 'preinstall', 'postinstall'];

export async function findSupplyChainRisks(cwd: string): Promise<DepsIssue[]> {
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) return [];

  const pkg  = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const names = Object.keys(deps);
  if (names.length === 0) return [];

  const settled = await Promise.allSettled(
    names.map(async (name) => {
      const [latest, meta] = await Promise.all([
        httpGet<{ scripts?: Record<string, string> }>(
          `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`,
        ),
        httpGet<NpmMeta>(`https://registry.npmjs.org/${encodeURIComponent(name)}`),
      ]);
      return { name, latest, meta };
    }),
  );

  const issues: DepsIssue[] = [];

  for (const result of settled) {
    if (result.status === 'rejected') continue;
    const { name, latest, meta } = result.value;

    // install scripts
    const hasInstallScript = INSTALL_SCRIPTS.some((s) => latest.scripts?.[s]);
    if (hasInstallScript) {
      const found = INSTALL_SCRIPTS.filter((s) => latest.scripts?.[s]).join(', ');
      issues.push({
        type: 'supply-chain' as any,
        severity: 'warning',
        name,
        message: `has install script (${found}) — runs arbitrary code on npm install`,
      });
    }

    // abandoned (last publish > 2 years ago)
    const modified = meta.time?.modified;
    if (modified) {
      const age = Date.now() - new Date(modified).getTime();
      if (age > TWO_YEARS_MS) {
        const years = (age / (365 * 24 * 60 * 60 * 1000)).toFixed(1);
        issues.push({
          type: 'supply-chain' as any,
          severity: 'warning',
          name,
          message: `last published ${years}y ago — may be abandoned`,
        });
      }
    }

    // single maintainer
    const maintainerCount = Array.isArray(meta.maintainers) ? meta.maintainers.length : 0;
    if (maintainerCount === 1) {
      issues.push({
        type: 'supply-chain' as any,
        severity: 'warning',
        name,
        message: 'single maintainer — high bus-factor risk',
      });
    }
  }

  return issues.sort((a, b) => a.name.localeCompare(b.name));
}
