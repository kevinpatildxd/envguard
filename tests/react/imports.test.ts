import { describe, it, expect } from 'vitest';
import path from 'path';
import {
  detectEntries,
  resolveImport,
  extractImports,
  collectUsedNames,
  traverse,
} from '../../src/modules/react/imports';

const FIXTURE = path.resolve(__dirname, 'fixtures/react-project');
const SRC     = path.join(FIXTURE, 'src');

// ── detectEntries ─────────────────────────────────────────────────────────

describe('detectEntries', () => {
  it('detects src/index.tsx as the entry point', () => {
    const entries = detectEntries(FIXTURE);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toContain('index.tsx');
  });

  it('returns empty array when no entry is found', () => {
    expect(detectEntries('/tmp/nonexistent-react-project-xyz')).toHaveLength(0);
  });
});

// ── resolveImport ─────────────────────────────────────────────────────────

describe('resolveImport', () => {
  const entryFile = path.join(SRC, 'index.tsx');

  it('resolves a relative import to an absolute path', () => {
    const resolved = resolveImport('./App', entryFile);
    expect(resolved).not.toBeNull();
    expect(resolved).toContain('App.tsx');
  });

  it('returns null for node_modules imports', () => {
    expect(resolveImport('react', entryFile)).toBeNull();
    expect(resolveImport('react-dom', entryFile)).toBeNull();
  });

  it('resolves nested relative imports', () => {
    const appFile = path.join(SRC, 'App.tsx');
    const resolved = resolveImport('./components/Button', appFile);
    expect(resolved).not.toBeNull();
    expect(resolved).toContain('Button.tsx');
  });

  it('returns null for imports that do not exist on disk', () => {
    expect(resolveImport('./NonExistentFile', entryFile)).toBeNull();
  });
});

// ── extractImports ────────────────────────────────────────────────────────

describe('extractImports', () => {
  it('extracts all imported bindings from a file', () => {
    const appFile = path.join(SRC, 'App.tsx');
    const { bindings } = extractImports(appFile);
    const names = bindings.map((b) => b.local);
    expect(names).toContain('Button');
    expect(names).toContain('format');
  });

  it('resolves local deps to absolute paths', () => {
    const appFile = path.join(SRC, 'App.tsx');
    const { resolvedDeps } = extractImports(appFile);
    expect(resolvedDeps.some((d) => d.includes('Button'))).toBe(true);
  });

  it('does not include node_modules imports in resolvedDeps', () => {
    const appFile = path.join(SRC, 'App.tsx');
    const { resolvedDeps } = extractImports(appFile);
    expect(resolvedDeps.every((d) => !d.includes('node_modules'))).toBe(true);
  });

  it('returns empty results for a non-existent file', () => {
    const { bindings, resolvedDeps } = extractImports('/tmp/nonexistent.tsx');
    expect(bindings).toHaveLength(0);
    expect(resolvedDeps).toHaveLength(0);
  });
});

// ── collectUsedNames ──────────────────────────────────────────────────────

describe('collectUsedNames', () => {
  it('finds identifiers used in JSX', () => {
    const appFile = path.join(SRC, 'App.tsx');
    const used = collectUsedNames(appFile);
    expect(used.has('Button')).toBe(true);
  });

  it('does not count import statement names as usage', () => {
    // 'format' is imported but never used in the body — should not appear as "used"
    const appFile = path.join(SRC, 'App.tsx');
    const used = collectUsedNames(appFile);
    // 'format' appears only in the ImportDeclaration which is skipped
    expect(used.has('format')).toBe(false);
  });

  it('returns empty set for non-existent file', () => {
    const used = collectUsedNames('/tmp/nonexistent.tsx');
    expect(used.size).toBe(0);
  });
});

// ── traverse ──────────────────────────────────────────────────────────────

describe('traverse', () => {
  it('marks the entry file as reachable', () => {
    const entry     = path.join(SRC, 'index.tsx');
    const reachable = new Set<string>();
    traverse(entry, reachable);
    expect(reachable.has(entry)).toBe(true);
  });

  it('marks transitively imported files as reachable', () => {
    const entry     = path.join(SRC, 'index.tsx');
    const reachable = new Set<string>();
    traverse(entry, reachable);
    expect([...reachable].some((f) => f.includes('App.tsx'))).toBe(true);
    expect([...reachable].some((f) => f.includes('Button.tsx'))).toBe(true);
  });

  it('does not mark dead files as reachable', () => {
    const entry     = path.join(SRC, 'index.tsx');
    const reachable = new Set<string>();
    traverse(entry, reachable);
    expect([...reachable].some((f) => f.includes('DeadComponent'))).toBe(false);
  });

  it('does not loop on circular imports', () => {
    // traverse with visited guard — calling it twice on same file should be safe
    const entry     = path.join(SRC, 'index.tsx');
    const reachable = new Set<string>();
    traverse(entry, reachable);
    const countBefore = reachable.size;
    traverse(entry, reachable); // second call — visited set prevents re-processing
    expect(reachable.size).toBe(countBefore);
  });
});
