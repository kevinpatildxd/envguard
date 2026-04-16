import fs   from 'fs';
import path from 'path';
import { tryParseSource } from '../../utils/astHelpers';
import { walkFiles }      from '../../utils/fileWalker';
import { printHeader, printWarning } from '../../reporter';
import { printBuddy }    from '../../buddy';
import { ReactIssue }    from '../../types';

// ── Constants ─────────────────────────────────────────────────────────────────

const CLIENT_ONLY_HOOKS = new Set([
  'useState', 'useEffect', 'useLayoutEffect', 'useReducer',
  'useRef', 'useContext', 'useImperativeHandle', 'useSyncExternalStore',
  'useInsertionEffect',
]);

const BROWSER_GLOBALS = new Set([
  'window', 'document', 'localStorage', 'sessionStorage',
  'navigator', 'location', 'history', 'alert', 'confirm', 'prompt',
]);

const SERVER_ONLY_MODULES = new Set([
  'next/headers', 'next/server', 'server-only',
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function lineOf(node: Record<string, unknown>): number {
  const loc = node['loc'] as { start?: { line?: number } } | undefined;
  return loc?.start?.line ?? 0;
}

type Visitor = (node: Record<string, unknown>) => void;

function walk(node: unknown, visitor: Visitor): void {
  if (!node || typeof node !== 'object') return;
  const n = node as Record<string, unknown>;
  if (!n['type']) return;
  visitor(n);
  for (const key of Object.keys(n)) {
    if (key === 'loc' || key === 'start' || key === 'end' || key === 'range') continue;
    const val = n[key];
    if (Array.isArray(val))                val.forEach((c) => walk(c, visitor));
    else if (val && typeof val === 'object') walk(val as unknown, visitor);
  }
}

/** Returns 'client' | 'server' | null based on the first directive in the file. */
function getDirective(src: string): 'client' | 'server' | null {
  const first = src.trimStart();
  if (first.startsWith('"use client"') || first.startsWith("'use client'")) return 'client';
  if (first.startsWith('"use server"') || first.startsWith("'use server'")) return 'server';
  // Also check as AST directive in program body
  return null;
}

function getDirectiveFromAst(ast: ReturnType<typeof tryParseSource>): 'client' | 'server' | null {
  if (!ast) return null;
  for (const node of ast.program.body) {
    const n = node as unknown as Record<string, unknown>;
    if (n['type'] === 'ExpressionStatement') {
      const expr = n['expression'] as Record<string, unknown>;
      if (expr['type'] === 'StringLiteral') {
        const val = expr['value'] as string;
        if (val === 'use client') return 'client';
        if (val === 'use server') return 'server';
      }
    }
    // Only check the first statement
    break;
  }
  return null;
}

function pkgName(source: string): string {
  if (source.startsWith('@')) return source.split('/').slice(0, 2).join('/');
  return source.split('/')[0];
}

// ── Checks ────────────────────────────────────────────────────────────────────

function checkServerFile(
  ast:       ReturnType<typeof tryParseSource>,
  rel:       string,
): ReactIssue[] {
  if (!ast) return [];
  const issues: ReactIssue[] = [];

  walk(ast, (n) => {
    // Server component using client-only hook
    if (n['type'] === 'CallExpression') {
      const callee = n['callee'] as Record<string, unknown>;
      const name   = callee['type'] === 'Identifier' ? callee['name'] as string : null;
      if (name && CLIENT_ONLY_HOOKS.has(name)) {
        issues.push({
          type: 'server-uses-client-hook', severity: 'error', file: rel, line: lineOf(n),
          message: `'${name}()' is a client-only hook — server components cannot use hooks; add "use client" or move to a client component`,
        });
      }
    }

    // Server component using browser global
    if (n['type'] === 'Identifier') {
      const name = n['name'] as string;
      if (BROWSER_GLOBALS.has(name)) {
        issues.push({
          type: 'server-uses-browser-api', severity: 'error', file: rel, line: lineOf(n),
          message: `'${name}' is a browser-only API — server components run on the server; add "use client" or move to a client component`,
        });
      }
    }
  });

  return issues;
}

function checkClientFile(
  ast: ReturnType<typeof tryParseSource>,
  rel: string,
): ReactIssue[] {
  if (!ast) return [];
  const issues: ReactIssue[] = [];

  for (const node of ast.program.body) {
    const n = node as unknown as Record<string, unknown>;
    if (n['type'] !== 'ImportDeclaration') continue;
    if (n['importKind'] === 'type') continue;

    const source = (n['source'] as Record<string, unknown>)['value'] as string;
    const pkg    = pkgName(source);

    if (SERVER_ONLY_MODULES.has(source) || SERVER_ONLY_MODULES.has(pkg)) {
      issues.push({
        type:     'client-imports-server-module',
        severity: 'error',
        file:     rel,
        line:     lineOf(n),
        message:  `'${source}' is a server-only module — client components cannot import server-only code`,
      });
    }
  }

  return issues;
}

// ── Main runner ───────────────────────────────────────────────────────────────

export interface ReactServerOptions {
  json: boolean;
  cwd?: string;
}

export function runReactServer(options: ReactServerOptions): void {
  const cwd    = options.cwd ?? process.cwd();
  const srcDir = fs.existsSync(path.join(cwd, 'src')) ? path.join(cwd, 'src') : cwd;
  const files  = walkFiles(srcDir, ['.tsx', '.jsx', '.ts', '.js']);
  const issues: ReactIssue[] = [];

  for (const filePath of files) {
    let src: string;
    try { src = fs.readFileSync(filePath, 'utf-8'); } catch { continue; }

    const ast       = tryParseSource(src);
    const rel       = path.relative(cwd, filePath);
    const directive = getDirective(src) ?? getDirectiveFromAst(ast);

    if (directive === 'server') {
      issues.push(...checkServerFile(ast, rel));
    } else if (directive === 'client') {
      issues.push(...checkClientFile(ast, rel));
    }
    // Files with no directive are treated as server components in Next.js App Router,
    // but we only flag explicit violations to avoid false positives in non-Next projects.
  }

  if (options.json) {
    console.log(JSON.stringify(issues, null, 2));
    return;
  }

  printHeader('REACT: SERVER COMPONENTS');

  if (issues.length === 0) {
    console.log('\n  ✔ No RSC boundary violations found');
  } else {
    for (const i of issues) printWarning(`${i.file}:${i.line}`, i.message);
  }

  printBuddy(
    issues.length > 0 ? 'error' : 'clear',
    issues.length > 0 ? `${issues.length} RSC violation(s) found.` : ''
  );
}
