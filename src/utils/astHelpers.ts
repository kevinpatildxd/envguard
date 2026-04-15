import { parse, ParserOptions } from '@babel/parser';
import type { File } from '@babel/types';

const PARSER_OPTIONS: ParserOptions = {
  sourceType: 'module',
  strictMode: false,
  plugins: [
    'jsx',
    'typescript',
    'decorators-legacy',
    'classProperties',
    'optionalChaining',
    'nullishCoalescingOperator',
    'dynamicImport',
  ],
};

export function parseSource(code: string): File {
  return parse(code, PARSER_OPTIONS);
}

export function tryParseSource(code: string): File | null {
  try {
    return parseSource(code);
  } catch {
    return null;
  }
}
