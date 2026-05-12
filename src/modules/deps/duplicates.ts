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
  const lockPath = path.join(cwd, 'package-lock.json');
  if (!fs.existsSync(lockPath)) return [];

  let lock: PackageLock;
  try {
    lock = JSON.parse(fs.readFileSync(lockPath, 'utf-8'));
  } catch {
    return [];
  }

  // lockfileVersion 2/3 uses the flat `packages` map
  if (lock.packages) {
    return fromPackagesMap(lock.packages);
  }

  // lockfileVersion 1 uses nested `dependencies`
  if (lock.dependencies) {
    return fromV1Dependencies(lock.dependencies);
  }

  return [];
}

function fromPackagesMap(packages: LockPackages): DepsIssue[] {
  const versionMap = new Map<string, Set<string>>();

  for (const [key, entry] of Object.entries(packages)) {
    if (!key || key === '') continue; // skip root
    // key format: "node_modules/foo" or "node_modules/foo/node_modules/bar"
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
