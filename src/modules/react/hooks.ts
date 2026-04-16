import fs   from 'fs';
import path from 'path';
import { tryParseSource } from '../../utils/astHelpers';
import { walkFiles }      from '../../utils/fileWalker';
import { printHeader, printError } from '../../reporter';
import { printBuddy }    from '../../buddy';
import { ReactIssue }    from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────

function lineOf(node: Record<string, unknown>): number {
  const loc = node['loc'] as { start?: { line?: number } } | undefined;
  return loc?.start?.line ?? 0;
}

function isHookCall(node: Record<string, unknown>): boolean {
  if (node['type'] !== 'CallExpression') return false;
  const callee = node['callee'] as Record<string, unknown>;

  if (callee['type'] === 'Identifier') {
    const name = callee['name'] as string;
    return /^use[A-Z]/.test(name);
  }
  // React.useState, React.useEffect, etc.
  if (callee['type'] === 'MemberExpression') {
    const prop = (callee['property'] as Record<string, unknown>)['name'] as string ?? '';
    return /^use[A-Z]/.test(prop);
  }
  return false;
}

function hookName(node: Record<string, unknown>): string {
  const callee = node['callee'] as Record<string, unknown>;
  if (callee['type'] === 'Identifier') return callee['name'] as string;
  if (callee['type'] === 'MemberExpression') {
    const obj  = (callee['object'] as Record<string, unknown>)['name'] as string ?? '';
    const prop = (callee['property'] as Record<string, unknown>)['name'] as string ?? '';
    return `${obj}.${prop}`;
  }
  return 'hook';
}

/** A valid hook caller is a React component (starts with uppercase) or a custom hook (starts with use). */
function isValidHookCaller(name: string | null): boolean {
  if (!name) return false;
  return /^[A-Z]/.test(name) || /^use[A-Z]/.test(name);
}

function getFunctionName(node: Record<string, unknown>): string | null {
  if (node['type'] === 'FunctionDeclaration' || node['type'] === 'FunctionExpression') {
    const id = node['id'] as Record<string, unknown> | null;
    return (id?.['name'] as string) ?? null;
  }
  // Arrow functions are anonymous — return null
  return null;
}

// ── Traversal with context ────────────────────────────────────────────────

const LOOP_TYPES = new Set([
  'ForStatement', 'WhileStatement', 'DoWhileStatement',
  'ForInStatement', 'ForOfStatement',
]);

const FUNCTION_TYPES = new Set([
  'FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression',
]);

interface Context {
  inConditional: boolean;
  inLoop:        boolean;
  functionDepth: number;     // 0 = top level, 1 = first function, 2+ = nested
  functionName:  string | null;
}

function scanNode(
  node: unknown,
  ctx: Context,
  issues: ReactIssue[],
  rel: string,
): void {
  if (!node || typeof node !== 'object') return;
  const n    = node as Record<string, unknown>;
  const type = n['type'] as string | undefined;
  if (!type) return;

  // ── Hook call found — check context ──────────────────────────────────
  if (isHookCall(n)) {
    const name = hookName(n);
    const line = lineOf(n);

    if (ctx.inConditional) {
      issues.push({
        type: 'hook-in-conditional', severity: 'error', file: rel, line,
        message: `${name}() called inside a conditional — violates Rules of Hooks`,
      });
    } else if (ctx.inLoop) {
      issues.push({
        type: 'hook-in-loop', severity: 'error', file: rel, line,
        message: `${name}() called inside a loop — violates Rules of Hooks`,
      });
    } else if (ctx.functionDepth > 1) {
      issues.push({
        type: 'hook-in-nested-function', severity: 'error', file: rel, line,
        message: `${name}() called inside a nested function — violates Rules of Hooks`,
      });
    } else if (ctx.functionDepth === 1 && !isValidHookCaller(ctx.functionName)) {
      issues.push({
        type: 'hook-in-regular-function', severity: 'error', file: rel, line,
        message: `${name}() called from '${ctx.functionName ?? 'anonymous'}' — hooks must be called from components or custom hooks`,
      });
    }
    // Don't descend into hook call arguments for hook-detection purposes
    return;
  }

  // ── Conditional ───────────────────────────────────────────────────────
  if (type === 'IfStatement') {
    // Scan test without conditional flag
    scanNode(n['test'], ctx, issues, rel);
    // Scan consequent/alternate with conditional flag set
    const condCtx = { ...ctx, inConditional: true };
    scanNode(n['consequent'], condCtx, issues, rel);
    scanNode(n['alternate'],  condCtx, issues, rel);
    return;
  }

  // ── Loop ──────────────────────────────────────────────────────────────
  if (LOOP_TYPES.has(type)) {
    const loopCtx = { ...ctx, inLoop: true };
    scanChildren(n, loopCtx, issues, rel);
    return;
  }

  // ── Function boundary ─────────────────────────────────────────────────
  if (FUNCTION_TYPES.has(type)) {
    const name    = getFunctionName(n);
    const funcCtx: Context = {
      inConditional: false,                     // reset — new function scope
      inLoop:        false,                     // reset
      functionDepth: ctx.functionDepth + 1,
      functionName:  name ?? ctx.functionName,  // keep parent name for arrow funcs
    };
    scanChildren(n, funcCtx, issues, rel);
    return;
  }

  scanChildren(n, ctx, issues, rel);
}

function scanChildren(
  n: Record<string, unknown>,
  ctx: Context,
  issues: ReactIssue[],
  rel: string,
): void {
  for (const key of Object.keys(n)) {
    if (key === 'type' || key === 'loc' || key === 'start' || key === 'end' || key === 'range') continue;
    const val = n[key];
    if (Array.isArray(val))                  val.forEach((c) => scanNode(c, ctx, issues, rel));
    else if (val && typeof val === 'object')  scanNode(val as unknown, ctx, issues, rel);
  }
}

// ── Main runner ───────────────────────────────────────────────────────────

export interface ReactHooksOptions {
  json: boolean;
  cwd?: string;
}

export function runReactHooks(options: ReactHooksOptions): void {
  const cwd    = options.cwd ?? process.cwd();
  const srcDir = fs.existsSync(path.join(cwd, 'src')) ? path.join(cwd, 'src') : cwd;
  const files  = walkFiles(srcDir, ['.tsx', '.jsx', '.ts', '.js']);
  const issues: ReactIssue[] = [];

  for (const filePath of files) {
    let src: string;
    try { src = fs.readFileSync(filePath, 'utf-8'); } catch { continue; }
    const ast = tryParseSource(src);
    if (!ast) continue;

    const rel = path.relative(cwd, filePath);
    const ctx: Context = { inConditional: false, inLoop: false, functionDepth: 0, functionName: null };

    for (const node of ast.program.body) {
      scanNode(node, ctx, issues, rel);
    }
  }

  if (options.json) {
    console.log(JSON.stringify(issues, null, 2));
    return;
  }

  printHeader('REACT: HOOKS');

  if (issues.length === 0) {
    console.log('\n  ✔ No hooks rule violations found');
  } else {
    for (const i of issues) printError(`${i.file}:${i.line}`, i.message);
  }

  printBuddy(
    issues.length > 0 ? 'error' : 'clear',
    issues.length > 0 ? `${issues.length} hooks violation(s) found.` : ''
  );
}
