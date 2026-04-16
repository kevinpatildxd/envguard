import fs   from 'fs';
import path from 'path';
import { tryParseSource }    from '../../utils/astHelpers';
import { walkFiles }         from '../../utils/fileWalker';
import { httpGet }           from '../../utils/httpClient';
import { printHeader, printWarning } from '../../reporter';
import { printBuddy }        from '../../buddy';
import { ReactIssue }        from '../../types';
import { BUNDLE_DATA, BUNDLE_THRESHOLD_KB } from './bundleData';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ImportRecord {
  pkg:      string;
  /** true when the import is a named import: import { x } from 'pkg' */
  named:    boolean;
  file:     string;
  line:     number;
}

interface BundlephobiaResponse {
  gzip: number;
  name: string;
}

// ── AST: extract third-party imports ─────────────────────────────────────────

function lineOf(node: Record<string, unknown>): number {
  const loc = node['loc'] as { start?: { line?: number } } | undefined;
  return loc?.start?.line ?? 0;
}

function isThirdParty(source: string): boolean {
  // skip relative paths and node built-ins (no slash prefix, not scoped package path)
  if (source.startsWith('.') || source.startsWith('/')) return false;
  // node: protocol
  if (source.startsWith('node:')) return false;
  return true;
}

function pkgName(source: string): string {
  // '@scope/pkg/sub' → '@scope/pkg'
  if (source.startsWith('@')) {
    const parts = source.split('/');
    return parts.slice(0, 2).join('/');
  }
  // 'pkg/sub' → 'pkg'
  return source.split('/')[0];
}

function extractImports(filePath: string): ImportRecord[] {
  let src: string;
  try { src = fs.readFileSync(filePath, 'utf-8'); } catch { return []; }

  const ast = tryParseSource(src);
  if (!ast) return [];

  const records: ImportRecord[] = [];

  for (const node of ast.program.body) {
    const n = node as unknown as Record<string, unknown>;

    if (n['type'] !== 'ImportDeclaration') continue;

    // skip type-only imports: import type { Foo } from 'pkg'
    if (n['importKind'] === 'type') continue;

    const source = (n['source'] as Record<string, unknown>)['value'] as string;
    if (!isThirdParty(source)) continue;

    const pkg  = pkgName(source);
    const line = lineOf(n);
    const specifiers = n['specifiers'] as Record<string, unknown>[];

    if (specifiers.length === 0) {
      // side-effect import: import 'pkg'
      records.push({ pkg, named: false, file: filePath, line });
      continue;
    }

    for (const spec of specifiers) {
      const type  = spec['type'] as string;
      // ImportSpecifier = named ({ x }), ImportDefaultSpecifier = default, ImportNamespaceSpecifier = * as ns
      const named = type === 'ImportSpecifier';
      // skip type-only specifiers: import { type Foo } from 'pkg'
      if ((spec['importKind'] as string | undefined) === 'type') continue;
      records.push({ pkg, named, file: filePath, line });
      break; // one record per import declaration is enough for per-package reporting
    }
  }

  return records;
}

// ── Bundlephobia fallback ─────────────────────────────────────────────────────

async function fetchBundlephobia(pkg: string): Promise<number | null> {
  try {
    const data = await httpGet<BundlephobiaResponse>(
      `https://bundlephobia.com/api/size?package=${encodeURIComponent(pkg)}`
    );
    return typeof data.gzip === 'number' ? data.gzip / 1024 : null; // bytes → kB
  } catch {
    return null;
  }
}

// ── Main runner ───────────────────────────────────────────────────────────────

export interface ReactBundleOptions {
  json:      boolean;
  threshold?: number;
  cwd?:      string;
}

export async function runReactBundle(options: ReactBundleOptions): Promise<void> {
  const cwd       = options.cwd ?? process.cwd();
  const threshold = options.threshold ?? BUNDLE_THRESHOLD_KB;
  const srcDir    = fs.existsSync(path.join(cwd, 'src')) ? path.join(cwd, 'src') : cwd;
  const files     = walkFiles(srcDir, ['.tsx', '.jsx', '.ts', '.js']);

  // Collect all third-party packages and how they are imported
  const byPkg = new Map<string, ImportRecord>();

  for (const filePath of files) {
    const records = extractImports(filePath);
    for (const r of records) {
      if (!byPkg.has(r.pkg)) {
        byPkg.set(r.pkg, r);
      } else {
        // prefer default/namespace import record over named (more conservative sizing)
        const existing = byPkg.get(r.pkg)!;
        if (!r.named && existing.named) byPkg.set(r.pkg, r);
      }
    }
  }

  const issues: ReactIssue[] = [];

  // Check each package
  const checks = Array.from(byPkg.entries()).map(async ([pkg, record]) => {
    const rel = path.relative(cwd, record.file);

    // 1. Try static list first
    const staticEntry = BUNDLE_DATA[pkg];
    if (staticEntry) {
      const gzip = staticEntry.gzip;
      if (gzip >= threshold) {
        const treeshake = record.named ? ' (named import — may be tree-shaken)' : '';
        const altNote   = staticEntry.alternative ? ` — consider ${staticEntry.alternative}` : '';
        issues.push({
          type:     'heavy-package',
          severity: 'warning',
          file:     rel,
          line:     record.line,
          message:  `'${pkg}' is ~${gzip} kB gzipped${treeshake}${altNote}`,
        });
      }
      return;
    }

    // 2. Bundlephobia fallback for unknown packages
    const gzip = await fetchBundlephobia(pkg);
    if (gzip !== null && gzip >= threshold) {
      const treeshake = record.named ? ' (named import — may be tree-shaken)' : '';
      issues.push({
        type:     'heavy-package',
        severity: 'warning',
        file:     rel,
        line:     record.line,
        message:  `'${pkg}' is ~${Math.round(gzip)} kB gzipped${treeshake}`,
      });
    }
  });

  await Promise.all(checks);

  // Sort by file then line for deterministic output
  issues.sort((a, b) =>
    a.file !== b.file ? a.file.localeCompare(b.file) : (a.line ?? 0) - (b.line ?? 0)
  );

  if (options.json) {
    console.log(JSON.stringify(issues, null, 2));
    return;
  }

  printHeader('REACT: BUNDLE SIZE');

  if (issues.length === 0) {
    console.log(`\n  ✔ No packages over ${threshold} kB threshold`);
  } else {
    for (const i of issues) printWarning(`${i.file}:${i.line}`, i.message);
  }

  printBuddy(
    issues.length > 0 ? 'error' : 'clear',
    issues.length > 0 ? `${issues.length} heavy package(s) found.` : ''
  );
}
