import fs from 'fs';
import path from 'path';
import { walkFiles } from '../../utils/fileWalker';
import { tryParseSource } from '../../utils/astHelpers';
import type { ImportDeclaration, ExportAllDeclaration, ExportNamedDeclaration } from '@babel/types';
import { DepsIssue } from '../../types';

const NODE_BUILTINS = new Set([
  'assert', 'buffer', 'child_process', 'cluster', 'console', 'constants',
  'crypto', 'dgram', 'dns', 'domain', 'events', 'fs', 'http', 'http2',
  'https', 'module', 'net', 'os', 'path', 'perf_hooks', 'process',
  'punycode', 'querystring', 'readline', 'repl', 'stream', 'string_decoder',
  'sys', 'timers', 'tls', 'trace_events', 'tty', 'url', 'util', 'v8',
  'vm', 'wasi', 'worker_threads', 'zlib',
]);

function isThirdParty(importPath: string): boolean {
  if (importPath.startsWith('.') || importPath.startsWith('/')) return false;
  if (importPath.startsWith('node:')) return false;
  const pkg = importPath.split('/')[0].replace(/^@/, '');
  if (NODE_BUILTINS.has(pkg)) return false;
  return true;
}

function packageName(importPath: string): string {
  // scoped: @org/pkg/sub → @org/pkg
  if (importPath.startsWith('@')) {
    return importPath.split('/').slice(0, 2).join('/');
  }
  return importPath.split('/')[0];
}

function extractImportsFromSource(code: string): string[] {
  const ast = tryParseSource(code);
  if (!ast) return [];

  const imports: string[] = [];

  for (const node of ast.program.body) {
    if (
      node.type === 'ImportDeclaration' ||
      node.type === 'ExportAllDeclaration' ||
      (node.type === 'ExportNamedDeclaration' && (node as ExportNamedDeclaration).source)
    ) {
      const src = (node as ImportDeclaration | ExportAllDeclaration).source?.value
                ?? ((node as ExportNamedDeclaration).source?.value);
      if (src) imports.push(src);
    }
  }

  return imports;
}

export function findUnusedPackages(cwd: string): DepsIssue[] {
  const pkgPath = path.join(cwd, 'package.json');
  if (!fs.existsSync(pkgPath)) return [];

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const declared = new Set<string>([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
  ]);

  if (declared.size === 0) return [];

  const files  = walkFiles(cwd, ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'], { root: cwd });
  const used   = new Set<string>();

  for (const file of files) {
    try {
      const code    = fs.readFileSync(file, 'utf-8');
      const imports = extractImportsFromSource(code);
      for (const imp of imports) {
        if (isThirdParty(imp)) {
          used.add(packageName(imp));
        }
      }
    } catch {
      // skip unreadable files
    }
  }

  const issues: DepsIssue[] = [];
  for (const pkg of declared) {
    if (!used.has(pkg)) {
      issues.push({
        type:     'unused',
        severity: 'error',
        name:     pkg,
        message:  'imported nowhere in your source files',
      });
    }
  }

  return issues.sort((a, b) => a.name.localeCompare(b.name));
}
