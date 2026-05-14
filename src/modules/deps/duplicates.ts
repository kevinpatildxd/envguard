import fs   from 'fs';
import path from 'path';
import { DepsIssue } from '../../types';

interface LockPackages {
  [key: string]: { version: string };
}

interface PackageLock {
  lockfileVersion?: number;
  packages?:        LockPackages;
  dependencies?:    Record<string, { version: string; dependencies?: Record<string, unknown> }>;
}

export function findDuplicateDeps(cwd: string): DepsIssue[] {
  // Try package-lock.json first (npm)
  const npmLock = path.join(cwd, 'package-lock.json');
  if (fs.existsSync(npmLock)) {
    try {
      const lock: PackageLock = JSON.parse(fs.readFileSync(npmLock, 'utf-8'));
      if (lock.packages) return fromPackagesMap(lock.packages);
      if (lock.dependencies) return fromV1Dependencies(lock.dependencies);
    } catch {
      return [];
    }
  }

  // Try pnpm-lock.yaml
  const pnpmLock = path.join(cwd, 'pnpm-lock.yaml');
  if (fs.existsSync(pnpmLock)) {
    try {
      return fromPnpmLock(fs.readFileSync(pnpmLock, 'utf-8'));
    } catch {
      return [];
    }
  }

  // Try yarn.lock
  const yarnLock = path.join(cwd, 'yarn.lock');
  if (fs.existsSync(yarnLock)) {
    try {
      return fromYarnLock(fs.readFileSync(yarnLock, 'utf-8'));
    } catch {
      return [];
    }
  }

  return [];
}

function fromPackagesMap(packages: LockPackages): DepsIssue[] {
  const versionMap = new Map<string, Set<string>>();

  for (const [key, entry] of Object.entries(packages)) {
    if (!key || key === '') continue;
    const match = key.match(/node_modules\/([^/]+)$/);
    if (!match) continue;
    const name = match[1];
    if (!versionMap.has(name)) versionMap.set(name, new Set());
    versionMap.get(name)!.add(entry.version);
  }

  return buildIssues(versionMap);
}

function fromV1Dependencies(
  deps: Record<string, { version: string; dependencies?: Record<string, unknown> }>,
  versionMap = new Map<string, Set<string>>(),
): DepsIssue[] {
  for (const [name, entry] of Object.entries(deps)) {
    if (!versionMap.has(name)) versionMap.set(name, new Set());
    versionMap.get(name)!.add(entry.version);
    if (entry.dependencies) {
      fromV1Dependencies(entry.dependencies as any, versionMap);
    }
  }
  return buildIssues(versionMap);
}

function fromPnpmLock(content: string): DepsIssue[] {
  const versionMap = new Map<string, Set<string>>();
  for (const line of content.split('\n')) {
    // matches: "  /react@18.2.0:" or "  react@18.2.0:" (snapshots/packages sections)
    const m = line.match(/^\s+\/?([^@/][^@]*)@([\d][^:\s]+):/);
    if (!m) continue;
    const [, name, version] = m;
    if (!versionMap.has(name)) versionMap.set(name, new Set());
    versionMap.get(name)!.add(version);
  }
  return buildIssues(versionMap);
}

function fromYarnLock(content: string): DepsIssue[] {
  const versionMap = new Map<string, Set<string>>();
  let currentPkg: string | null = null;

  for (const line of content.split('\n')) {
    // Package descriptor line: "react@^18.0.0, react@^18.1.0:" or '"react@^18.0.0":'
    const descMatch = line.match(/^"?([^@"]+)@[^"]*"?[,:]?\s*$/);
    if (descMatch && !line.startsWith(' ') && !line.startsWith('#')) {
      currentPkg = descMatch[1].trim();
      continue;
    }
    // Version line: '  version "18.2.0"'
    const versionMatch = line.match(/^\s+version\s+"([^"]+)"/);
    if (versionMatch && currentPkg) {
      if (!versionMap.has(currentPkg)) versionMap.set(currentPkg, new Set());
      versionMap.get(currentPkg)!.add(versionMatch[1]);
    }
  }
  return buildIssues(versionMap);
}

function buildIssues(versionMap: Map<string, Set<string>>): DepsIssue[] {
  const issues: DepsIssue[] = [];
  for (const [name, versions] of versionMap) {
    if (versions.size > 1) {
      issues.push({
        type:     'duplicate' as any,
        severity: 'warning',
        name,
        message:  `${versions.size} versions installed: ${[...versions].sort().join(', ')}`,
      });
    }
  }
  return issues.sort((a, b) => a.name.localeCompare(b.name));
}
