import fs   from 'fs';
import path from 'path';
import { tryParseSource } from '../../utils/astHelpers';
import { walkFiles }      from '../../utils/fileWalker';
import { printHeader, printWarning } from '../../reporter';
import { printBuddy }    from '../../buddy';
import { ReactIssue }    from '../../types';

// ── Constants ─────────────────────────────────────────────────────────────

const REACT_EXTS = ['.tsx', '.ts', '.jsx', '.js'];

// ── Entry point detection ─────────────────────────────────────────────────

export function detectEntries(cwd: string): string[] {
  const candidates = [
    'src/index.tsx', 'src/main.tsx',
    'src/index.jsx', 'src/main.jsx',
    'src/index.ts',  'src/main.ts',
  ];
  for (const c of candidates) {
    const full = path.join(cwd, c);
    if (fs.existsSync(full)) return [full];
  }

  // Next.js App Router — page/layout files are the entries
  const appDir = path.join(cwd, 'app');
  if (fs.existsSync(appDir) && fs.statSync(appDir).isDirectory()) {
    const pages = walkFiles(appDir, ['.tsx', '.jsx']).filter((f) =>
      /^(page|layout|loading|error)\.(tsx|jsx)$/.test(path.basename(f))
    );
    if (pages.length > 0) return pages;
  }

  // Next.js Pages Router
  const pagesDir = path.join(cwd, 'pages');
  if (fs.existsSync(pagesDir) && fs.statSync(pagesDir).isDirectory()) {
    return walkFiles(pagesDir, ['.tsx', '.jsx']);
  }

  return [];
}

// ── Import resolution ─────────────────────────────────────────────────────

export function resolveImport(importPath: string, fromFile: string): string | null {
  // Skip node_modules
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) return null;

  const base = path.resolve(path.dirname(fromFile), importPath);

  if (fs.existsSync(base) && !fs.statSync(base).isDirectory()) return base;

  for (const ext of REACT_EXTS) {
    if (fs.existsSync(base + ext)) return base + ext;
  }

  for (const ext of REACT_EXTS) {
    const idx = path.join(base, `index${ext}`);
    if (fs.existsSync(idx)) return idx;
  }

  return null;
}

// ── AST helpers ───────────────────────────────────────────────────────────

interface ImportBinding {
  local:      string;
  source:     string;
  line:       number;
  isTypeOnly: boolean;
}

export function extractImports(filePath: string): { bindings: ImportBinding[]; resolvedDeps: string[] } {
  let src: string;
  try { src = fs.readFileSync(filePath, 'utf-8'); } catch { return { bindings: [], resolvedDeps: [] }; }

  const ast = tryParseSource(src);
  if (!ast) return { bindings: [], resolvedDeps: [] };

  const bindings:     ImportBinding[] = [];
  const resolvedDeps: string[]        = [];

  for (const node of ast.program.body) {
    if (node.type !== 'ImportDeclaration') continue;

    const source     = node.source.value;
    const isTypeDecl = (node as any).importKind === 'type';
    const resolved   = resolveImport(source, filePath);
    if (resolved) resolvedDeps.push(resolved);

    for (const spec of node.specifiers) {
      bindings.push({
        local:      spec.local.name,
        source,
        line:       spec.loc?.start.line ?? 0,
        isTypeOnly: isTypeDecl || (spec as any).importKind === 'type',
      });
    }
  }

  return { bindings, resolvedDeps };
}

export function collectUsedNames(filePath: string): Set<string> {
  let src: string;
  try { src = fs.readFileSync(filePath, 'utf-8'); } catch { return new Set(); }

  const ast = tryParseSource(src);
  if (!ast) return new Set();

  const used = new Set<string>();

  function walk(node: unknown): void {
    if (!node || typeof node !== 'object') return;
    const n    = node as Record<string, unknown>;
    const type = n['type'] as string | undefined;
    if (!type) return;

    // Skip import declarations — definitions, not usages
    if (type === 'ImportDeclaration') return;

    if (type === 'Identifier' || type === 'JSXIdentifier') {
      used.add(n['name'] as string);
    }

    for (const key of Object.keys(n)) {
      if (key === 'type' || key === 'loc' || key === 'start' || key === 'end' || key === 'range') continue;
      const val = n[key];
      if (Array.isArray(val)) {
        for (const child of val) walk(child);
      } else if (val && typeof val === 'object') {
        walk(val as unknown);
      }
    }
  }

  for (const node of ast.program.body) walk(node);

  return used;
}

// ── Import graph traversal ────────────────────────────────────────────────

export function traverse(filePath: string, reachable: Set<string>): void {
  if (reachable.has(filePath)) return;
  reachable.add(filePath);

  const { resolvedDeps } = extractImports(filePath);
  for (const dep of resolvedDeps) {
    traverse(dep, reachable);
  }
}

// ── Main runner ───────────────────────────────────────────────────────────

export interface ReactImportsOptions {
  entry?: string;
  json:   boolean;
}

export function runReactImports(options: ReactImportsOptions): void {
  const cwd = process.cwd();

  let entries: string[];
  if (options.entry) {
    const ep = path.resolve(cwd, options.entry);
    if (!fs.existsSync(ep)) {
      console.error(`Error: entry '${options.entry}' not found.`);
      process.exit(1);
    }
    entries = [ep];
  } else {
    entries = detectEntries(cwd);
    if (entries.length === 0) {
      console.error('Could not auto-detect a React entry point.');
      console.error('Specify one with: devguard react:imports --entry <file>');
      process.exit(1);
    }
  }

  // Build reachable set from all entries
  const reachable = new Set<string>();
  for (const entry of entries) traverse(entry, reachable);

  const issues: ReactIssue[] = [];

  // 1. Dead files — source files not reachable from any entry
  const srcDir     = fs.existsSync(path.join(cwd, 'src')) ? path.join(cwd, 'src') : cwd;
  const allSrcFiles = walkFiles(srcDir, REACT_EXTS);

  for (const file of allSrcFiles) {
    if (!reachable.has(file)) {
      issues.push({
        type:     'dead-file',
        severity: 'warning',
        file:     path.relative(cwd, file),
        message:  'not reachable from any entry point',
      });
    }
  }

  // 2. Unused imports within each reachable file
  for (const filePath of reachable) {
    if (!filePath.startsWith(cwd)) continue; // skip files outside project

    const { bindings } = extractImports(filePath);
    if (bindings.length === 0) continue;

    const used = collectUsedNames(filePath);
    const rel  = path.relative(cwd, filePath);

    for (const b of bindings) {
      if (b.isTypeOnly)      continue; // type-only imports are fine
      if (used.has(b.local)) continue; // used — skip

      issues.push({
        type:     'unused-import',
        severity: 'warning',
        file:     rel,
        line:     b.line,
        message:  `'${b.local}' from '${b.source}' is never used`,
      });
    }
  }

  if (options.json) {
    console.log(JSON.stringify(issues, null, 2));
    return;
  }

  printHeader('REACT: IMPORTS');

  const deadFiles     = issues.filter((i) => i.type === 'dead-file');
  const unusedImports = issues.filter((i) => i.type === 'unused-import');

  if (deadFiles.length > 0) {
    console.log('\n  Dead files');
    for (const i of deadFiles) printWarning(i.file, i.message);
  }

  if (unusedImports.length > 0) {
    console.log('\n  Unused imports');
    for (const i of unusedImports) printWarning(`${i.file}:${i.line}`, i.message);
  }

  if (issues.length === 0) {
    console.log('\n  ✔ No dead imports found');
  }

  printBuddy(
    issues.length > 0 ? 'error' : 'clear',
    issues.length > 0 ? `${issues.length} import issue(s) found.` : ''
  );
}
