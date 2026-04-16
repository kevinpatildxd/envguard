import fs   from 'fs';
import path from 'path';
import { tryParseSource } from '../../utils/astHelpers';
import { walkFiles }      from '../../utils/fileWalker';
import { printHeader, printWarning } from '../../reporter';
import { printBuddy }    from '../../buddy';
import { ReactIssue }    from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function lineOf(node: Record<string, unknown>): number {
  const loc = node['loc'] as { start?: { line?: number } } | undefined;
  return loc?.start?.line ?? 0;
}

function attrName(attr: Record<string, unknown>): string {
  const name = attr['name'] as Record<string, unknown> | undefined;
  if (!name) return '';
  if (name['type'] === 'JSXIdentifier') return name['name'] as string;
  if (name['type'] === 'JSXNamespacedName') {
    const ns  = (name['namespace'] as Record<string, unknown>)['name'] as string;
    const loc = (name['name'] as Record<string, unknown>)['name'] as string;
    return `${ns}:${loc}`;
  }
  return '';
}

function attrValue(attr: Record<string, unknown>): unknown {
  return attr['value'];
}

function hasAttr(attrs: Record<string, unknown>[], name: string): boolean {
  return attrs.some((a) => attrName(a) === name);
}

function attrStringValue(attr: Record<string, unknown>): string | null {
  const val = attrValue(attr) as Record<string, unknown> | null;
  if (!val) return null;
  // <img alt="text">
  if (val['type'] === 'StringLiteral' || val['type'] === 'Literal') {
    return (val['value'] as string) ?? null;
  }
  // <img alt={"text"}>
  if (val['type'] === 'JSXExpressionContainer') {
    const expr = val['expression'] as Record<string, unknown>;
    if (expr['type'] === 'StringLiteral' || expr['type'] === 'Literal') {
      return (expr['value'] as string) ?? null;
    }
    // <img alt={''}>  — JSXEmptyExpression means no content
    if (expr['type'] === 'JSXEmptyExpression') return '';
  }
  return null;
}

function getAttr(attrs: Record<string, unknown>[], name: string): Record<string, unknown> | null {
  return attrs.find((a) => attrName(a) === name) ?? null;
}

function jsxElementName(node: Record<string, unknown>): string {
  const opening = node['openingElement'] as Record<string, unknown>;
  const nameNode = opening['name'] as Record<string, unknown>;
  if (nameNode['type'] === 'JSXIdentifier') return nameNode['name'] as string;
  if (nameNode['type'] === 'JSXMemberExpression') {
    const obj  = (nameNode['object'] as Record<string, unknown>)['name'] as string;
    const prop = (nameNode['property'] as Record<string, unknown>)['name'] as string;
    return `${obj}.${prop}`;
  }
  return '';
}

function jsxAttrs(node: Record<string, unknown>): Record<string, unknown>[] {
  const opening = node['openingElement'] as Record<string, unknown>;
  return (opening['attributes'] as Record<string, unknown>[]) ?? [];
}

function jsxChildren(node: Record<string, unknown>): unknown[] {
  return (node['children'] as unknown[]) ?? [];
}

function hasTextContent(children: unknown[]): boolean {
  for (const child of children) {
    const c = child as Record<string, unknown>;
    if (!c || !c['type']) continue;
    if (c['type'] === 'JSXText') {
      const text = (c['value'] as string ?? '').trim();
      if (text.length > 0) return true;
    }
    if (c['type'] === 'JSXExpressionContainer') {
      const expr = c['expression'] as Record<string, unknown>;
      if (expr['type'] !== 'JSXEmptyExpression') return true;
    }
    if (c['type'] === 'JSXElement') return true;
  }
  return false;
}

// ── AST walker ────────────────────────────────────────────────────────────────

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

// ── Checks ────────────────────────────────────────────────────────────────────

function checkFile(ast: ReturnType<typeof tryParseSource>, rel: string): ReactIssue[] {
  if (!ast) return [];
  const issues: ReactIssue[] = [];

  walk(ast, (n) => {
    if (n['type'] !== 'JSXElement') return;
    const tag   = jsxElementName(n);
    const attrs = jsxAttrs(n);
    const line  = lineOf(n['openingElement'] as Record<string, unknown>);

    // ── <img> missing alt ────────────────────────────────────────────────────
    if (tag === 'img') {
      if (!hasAttr(attrs, 'alt')) {
        issues.push({
          type: 'missing-alt', severity: 'error', file: rel, line,
          message: '<img> is missing an alt attribute — required for screen readers',
        });
      } else {
        const altAttr = getAttr(attrs, 'alt')!;
        const val     = attrStringValue(altAttr);
        // alt="" is valid (decorative), but a missing/undefined value is not
        if (val === null) {
          // dynamic value — skip (can't statically verify)
        }
      }
    }

    // ── <button> with no accessible label ───────────────────────────────────
    if (tag === 'button') {
      const hasAriaLabel    = hasAttr(attrs, 'aria-label');
      const hasAriaLabelBy  = hasAttr(attrs, 'aria-labelledby');
      const hasTitle        = hasAttr(attrs, 'title');
      const children        = jsxChildren(n);
      const hasText         = hasTextContent(children);

      if (!hasAriaLabel && !hasAriaLabelBy && !hasTitle && !hasText) {
        issues.push({
          type: 'button-no-label', severity: 'error', file: rel, line,
          message: '<button> has no accessible label — add text content, aria-label, or aria-labelledby',
        });
      }
    }

    // ── <div onClick> — should be <button> ──────────────────────────────────
    if (tag === 'div' || tag === 'span') {
      if (hasAttr(attrs, 'onClick')) {
        const hasRole = hasAttr(attrs, 'role');
        const hasTabIndex = hasAttr(attrs, 'tabIndex') || hasAttr(attrs, 'tabindex');
        if (!hasRole || !hasTabIndex) {
          issues.push({
            type: 'click-no-role', severity: 'warning', file: rel, line,
            message: `<${tag} onClick> is not keyboard accessible — use <button> or add role + tabIndex`,
          });
        }
      }
    }

    // ── <input> missing label association ────────────────────────────────────
    if (tag === 'input') {
      const inputType = (() => {
        const typeAttr = getAttr(attrs, 'type');
        if (!typeAttr) return 'text';
        return attrStringValue(typeAttr) ?? 'text';
      })();
      // hidden inputs don't need labels
      if (inputType !== 'hidden') {
        const hasId          = hasAttr(attrs, 'id');
        const hasAriaLabel   = hasAttr(attrs, 'aria-label');
        const hasAriaLabelBy = hasAttr(attrs, 'aria-labelledby');
        const hasPlaceholder = hasAttr(attrs, 'placeholder');
        if (!hasId && !hasAriaLabel && !hasAriaLabelBy && !hasPlaceholder) {
          issues.push({
            type: 'input-no-label', severity: 'warning', file: rel, line,
            message: '<input> has no label — add aria-label, aria-labelledby, or an id paired with <label htmlFor>',
          });
        }
      }
    }

    // ── <a> with no href or role ─────────────────────────────────────────────
    if (tag === 'a') {
      const hasHref = hasAttr(attrs, 'href');
      const hasRole = hasAttr(attrs, 'role');
      if (!hasHref && !hasRole) {
        issues.push({
          type: 'anchor-no-href', severity: 'warning', file: rel, line,
          message: '<a> has no href or role — use <button> for actions or add href for navigation',
        });
      }

      // empty link text
      const hasAriaLabel   = hasAttr(attrs, 'aria-label');
      const hasAriaLabelBy = hasAttr(attrs, 'aria-labelledby');
      const children       = jsxChildren(n);
      if (!hasAriaLabel && !hasAriaLabelBy && !hasTextContent(children)) {
        issues.push({
          type: 'anchor-empty-text', severity: 'error', file: rel, line,
          message: '<a> has no visible text or aria-label — screen readers will announce nothing',
        });
      }
    }
  });

  return issues;
}

// ── Main runner ───────────────────────────────────────────────────────────────

export interface ReactA11yOptions {
  json: boolean;
  cwd?: string;
}

export function runReactA11y(options: ReactA11yOptions): void {
  const cwd    = options.cwd ?? process.cwd();
  const srcDir = fs.existsSync(path.join(cwd, 'src')) ? path.join(cwd, 'src') : cwd;
  const files  = walkFiles(srcDir, ['.tsx', '.jsx']);
  const issues: ReactIssue[] = [];

  for (const filePath of files) {
    let src: string;
    try { src = fs.readFileSync(filePath, 'utf-8'); } catch { continue; }
    const ast = tryParseSource(src);
    const rel = path.relative(cwd, filePath);
    issues.push(...checkFile(ast, rel));
  }

  if (options.json) {
    console.log(JSON.stringify(issues, null, 2));
    return;
  }

  printHeader('REACT: A11Y');

  if (issues.length === 0) {
    console.log('\n  ✔ No accessibility issues found');
  } else {
    for (const i of issues) printWarning(`${i.file}:${i.line}`, i.message);
  }

  printBuddy(
    issues.length > 0 ? 'error' : 'clear',
    issues.length > 0 ? `${issues.length} accessibility issue(s) found.` : ''
  );
}
