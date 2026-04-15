import fs from 'fs';
import path from 'path';
import { httpPost } from '../../utils/httpClient';
import { DepsIssue } from '../../types';

function stripRange(version: string): string {
  return version.replace(/^[\^~>=<]+/, '').trim();
}

interface OsvVuln {
  id:      string;
  aliases?: string[];
  severity?: { type: string; score: string }[];
  database_specific?: { severity?: string };
}

interface OsvResult {
  vulns?: OsvVuln[];
}

interface OsvBatchResponse {
  results: OsvResult[];
}

function severity(vuln: OsvVuln): string {
  return vuln.database_specific?.severity
    ?? vuln.severity?.[0]?.score
    ?? 'Unknown';
}

function cveId(vuln: OsvVuln): string {
  return vuln.aliases?.find((a) => a.startsWith('CVE-')) ?? vuln.id;
}

export async function findVulnerablePackages(cwd: string): Promise<DepsIssue[]> {
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) return [];

  const pkg  = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const deps = {
    ...pkg.dependencies ?? {},
    ...pkg.devDependencies ?? {},
  } as Record<string, string>;

  const entries = Object.entries(deps).filter(([, v]) => !v.startsWith('file:'));
  if (entries.length === 0) return [];

  const queries = entries.map(([name, range]) => ({
    package: { name, ecosystem: 'npm' },
    version: stripRange(range),
  }));

  let response: OsvBatchResponse;
  try {
    response = await httpPost<OsvBatchResponse>(
      'https://api.osv.dev/v1/querybatch',
      { queries }
    );
  } catch {
    return [];
  }

  const issues: DepsIssue[] = [];
  for (let i = 0; i < entries.length; i++) {
    const [name, range] = entries[i];
    const result        = response.results[i];
    if (!result?.vulns?.length) continue;

    for (const vuln of result.vulns) {
      issues.push({
        type:     'vulnerable',
        severity: 'error',
        name:     `${name}@${stripRange(range)}`,
        message:  `${cveId(vuln)}  ${severity(vuln)}`,
      });
    }
  }

  return issues.sort((a, b) => a.name.localeCompare(b.name));
}
