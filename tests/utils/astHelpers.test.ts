import { describe, it, expect } from 'vitest';
import { parseSource, tryParseSource } from '../../src/utils/astHelpers';

describe('parseSource', () => {
  it('parses plain JavaScript', () => {
    const ast = parseSource(`const x = 1;`);
    expect(ast.type).toBe('File');
  });

  it('parses TypeScript', () => {
    const ast = parseSource(`const x: number = 1;`);
    expect(ast.type).toBe('File');
  });

  it('parses JSX', () => {
    const ast = parseSource(`const el = <div className="x" />;`);
    expect(ast.type).toBe('File');
  });

  it('parses TSX', () => {
    const ast = parseSource(`const el = <Component<Props> />;`);
    expect(ast.type).toBe('File');
  });

  it('throws on invalid syntax', () => {
    expect(() => parseSource(`const = `)).toThrow();
  });
});

describe('tryParseSource', () => {
  it('returns null on invalid syntax instead of throwing', () => {
    const result = tryParseSource(`const = `);
    expect(result).toBeNull();
  });

  it('returns AST on valid syntax', () => {
    const result = tryParseSource(`const x = 1;`);
    expect(result).not.toBeNull();
    expect(result?.type).toBe('File');
  });
});
