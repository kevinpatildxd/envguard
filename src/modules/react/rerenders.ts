import fs   from 'fs';
import path from 'path';
import { tryParseSource } from '../../utils/astHelpers';
import { walkFiles }      from '../../utils/fileWalker';
import { printHeader, printWarning } from '../../reporter';
import { printBuddy }    from '../../buddy';
import { ReactIssue }    from '../../types';

// ── Hooks that take a dependency array as their second argument ───────────

const HOOKS_WITH_DEPS = new Set(['useEffect', 'useMemo', 'useCallback', 'useLayoutEffect']);

// ── AST walk helper ───────────────────────────────────────────────────────

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

function lineOf(node: Record<string, unknown>): number {
  const loc = node['loc'] as { start?: { line?: number } } | undefined;
  return loc?.start?.line ?? 0;
}

// ── Check 1: inline object literal in JSX prop ────────────────────────────

function checkInlineObjectProps(ast: ReturnType<typeof tryParseSource>, rel: string): ReactIssue[] {
  if (!ast) return [];
  const issues: ReactIssue[] = [];

  walk(ast, (n) => {
    if (n['type'] !== 'JSXAttribute') return;
    const value = n['value'] as Record<string, unknown> | null;
    if (!value || value['type'] !== 'JSXExpressionContainer') return;
    const expr = value['expression'] as Record<string, unknown>;
    if (expr['type'] !== 'ObjectExpression') return;

    const attrName = (n['name'] as Record<string, unknown>)['name'] as string ?? '';
    issues.push({
      type:     'inline-object-prop',
      severity: 'warning',
      file:     rel,
      line:     lineOf(n),
      message:  `inline object in '${attrName}' prop — causes re-render on every render; extract to useMemo or a constant`,
    });
  });

  return issues;
}

// ── Check 2: inline function in JSX prop ──────────────────────────────────

function checkInlineFunctionProps(ast: ReturnType<typeof tryParseSource>, rel: string): ReactIssue[] {
  if (!ast) return [];
  const issues: ReactIssue[] = [];

  walk(ast, (n) => {
    if (n['type'] !== 'JSXAttribute') return;
    const value = n['value'] as Record<string, unknown> | null;
    if (!value || value['type'] !== 'JSXExpressionContainer') return;
    const expr = value['expression'] as Record<string, unknown>;
    if (expr['type'] !== 'ArrowFunctionExpression' && expr['type'] !== 'FunctionExpression') return;

    const attrName = (n['name'] as Record<string, unknown>)['name'] as string ?? '';
    issues.push({
      type:     'inline-function-prop',
      severity: 'warning',
      file:     rel,
      line:     lineOf(n),
      message:  `inline function in '${attrName}' prop — causes re-render on every render; extract to useCallback`,
    });
  });

  return issues;
}

// ── Check 3: exported component missing React.memo ────────────────────────

function checkMissingMemo(ast: ReturnType<typeof tryParseSource>, rel: string): ReactIssue[] {
  if (!ast) return [];
  const issues: ReactIssue[] = [];

  for (const node of ast.program.body) {
    const n = node as unknown as Record<string, unknown>;

    // export function ComponentName(...) { ... }
    if (n['type'] === 'ExportNamedDeclaration') {
      const decl = n['declaration'] as Record<string, unknown> | null;
      if (!decl) continue;

      if (decl['type'] === 'FunctionDeclaration') {
        const id   = decl['id'] as Record<string, unknown> | null;
        const name = id?.['name'] as string | undefined;
        if (name && /^[A-Z]/.test(name) && containsJsx(decl)) {
          issues.push({
            type:     'missing-memo',
            severity: 'warning',
            file:     rel,
            line:     lineOf(decl),
            message:  `'${name}' is not wrapped in React.memo — wrap to prevent unnecessary re-renders`,
          });
        }
      }

      // export const ComponentName = (...) => { ... }  (not wrapped in memo)
      if (decl['type'] === 'VariableDeclaration') {
        const declarators = decl['declarations'] as Record<string, unknown>[];
        for (const d of declarators) {
          const id   = d['id'] as Record<string, unknown>;
          const init = d['init'] as Record<string, unknown> | null;
          const name = id?.['name'] as string | undefined;
          if (!name || !/^[A-Z]/.test(name) || !init) continue;

          const isMemoWrapped =
            (init['type'] === 'CallExpression' &&
              isMemoCall(init['callee'] as Record<string, unknown>));

          if (!isMemoWrapped && containsJsx(init)) {
            issues.push({
              type:     'missing-memo',
              severity: 'warning',
              file:     rel,
              line:     lineOf(d),
              message:  `'${name}' is not wrapped in React.memo — wrap to prevent unnecessary re-renders`,
            });
          }
        }
      }
    }

    // export default function ComponentName(...) { ... }
    if (n['type'] === 'ExportDefaultDeclaration') {
      const decl = n['declaration'] as Record<string, unknown>;
      if (decl['type'] === 'FunctionDeclaration') {
        const id   = decl['id'] as Record<string, unknown> | null;
        const name = id?.['name'] as string | undefined;
        if (name && /^[A-Z]/.test(name) && containsJsx(decl)) {
          issues.push({
            type:     'missing-memo',
            severity: 'warning',
            file:     rel,
            line:     lineOf(decl),
            message:  `'${name}' is not wrapped in React.memo — wrap to prevent unnecessary re-renders`,
          });
        }
      }
    }
  }

  return issues;
}

function isMemoCall(callee: Record<string, unknown>): boolean {
  if (callee['type'] === 'Identifier') return callee['name'] === 'memo';
  if (callee['type'] === 'MemberExpression') {
    const prop = (callee['property'] as Record<string, unknown>)['name'];
    return prop === 'memo';
  }
  return false;
}

function containsJsx(node: unknown): boolean {
  let found = false;
  walk(node, (n) => {
    if (n['type'] === 'JSXElement' || n['type'] === 'JSXFragment') found = true;
  });
  return found;
}

// ── Check 4: unstable value in dep array ──────────────────────────────────

function checkUnstableDepArrays(ast: ReturnType<typeof tryParseSource>, rel: string): ReactIssue[] {
  if (!ast) return [];
  const issues: ReactIssue[] = [];

  walk(ast, (n) => {
    if (n['type'] !== 'CallExpression') return;

    const callee = n['callee'] as Record<string, unknown>;
    const hookName = hookCallName(callee);
    if (!hookName || !HOOKS_WITH_DEPS.has(hookName)) return;

    const args = n['arguments'] as Record<string, unknown>[];
    if (args.length < 2) return;

    const depsArg = args[1];
    if (depsArg['type'] !== 'ArrayExpression') return;

    const elements = depsArg['elements'] as Record<string, unknown>[];
    for (const el of elements) {
      if (!el) continue;
      if (el['type'] === 'ObjectExpression') {
        issues.push({
          type:     'unstable-dep',
          severity: 'warning',
          file:     rel,
          line:     lineOf(el),
          message:  `object literal in ${hookName} dep array — new reference every render; extract to useMemo`,
        });
      }
      if (el['type'] === 'ArrayExpression') {
        issues.push({
          type:     'unstable-dep',
          severity: 'warning',
          file:     rel,
          line:     lineOf(el),
          message:  `array literal in ${hookName} dep array — new reference every render; extract to useMemo`,
        });
      }
    }
  });

  return issues;
}

function hookCallName(callee: Record<string, unknown>): string | null {
  if (callee['type'] === 'Identifier') return callee['name'] as string;
  if (callee['type'] === 'MemberExpression') {
    return (callee['property'] as Record<string, unknown>)['name'] as string ?? null;
  }
  return null;
}

// ── Main runner ───────────────────────────────────────────────────────────

export interface ReactRerendersOptions {
  json: boolean;
  cwd?: string;
}

export function runReactRerenders(options: ReactRerendersOptions): void {
  const cwd      = options.cwd ?? process.cwd();
  const srcDir   = fs.existsSync(path.join(cwd, 'src')) ? path.join(cwd, 'src') : cwd;
  const files    = walkFiles(srcDir, ['.tsx', '.jsx']);
  const issues: ReactIssue[] = [];

  for (const filePath of files) {
    let src: string;
    try { src = fs.readFileSync(filePath, 'utf-8'); } catch { continue; }
    const ast = tryParseSource(src);
    const rel = path.relative(cwd, filePath);

    issues.push(
      ...checkInlineObjectProps(ast, rel),
      ...checkInlineFunctionProps(ast, rel),
      ...checkMissingMemo(ast, rel),
      ...checkUnstableDepArrays(ast, rel),
    );
  }

  if (options.json) {
    console.log(JSON.stringify(issues, null, 2));
    return;
  }

  printHeader('REACT: RE-RENDERS');

  const byType = {
    'inline-object-prop':  issues.filter((i) => i.type === 'inline-object-prop'),
    'inline-function-prop': issues.filter((i) => i.type === 'inline-function-prop'),
    'missing-memo':        issues.filter((i) => i.type === 'missing-memo'),
    'unstable-dep':        issues.filter((i) => i.type === 'unstable-dep'),
  };

  if (byType['inline-object-prop'].length > 0) {
    console.log('\n  Inline object props');
    for (const i of byType['inline-object-prop']) printWarning(`${i.file}:${i.line}`, i.message);
  }
  if (byType['inline-function-prop'].length > 0) {
    console.log('\n  Inline function props');
    for (const i of byType['inline-function-prop']) printWarning(`${i.file}:${i.line}`, i.message);
  }
  if (byType['missing-memo'].length > 0) {
    console.log('\n  Missing React.memo');
    for (const i of byType['missing-memo']) printWarning(`${i.file}:${i.line}`, i.message);
  }
  if (byType['unstable-dep'].length > 0) {
    console.log('\n  Unstable dep arrays');
    for (const i of byType['unstable-dep']) printWarning(`${i.file}:${i.line}`, i.message);
  }

  if (issues.length === 0) {
    console.log('\n  ✔ No re-render risks found');
  }

  printBuddy(
    issues.length > 0 ? 'error' : 'clear',
    issues.length > 0 ? `${issues.length} re-render risk(s) found.` : ''
  );
}
