export interface Alternative {
  size: string;
  suggestion: string;
}

export const ALTERNATIVES: Record<string, Alternative> = {
  'moment':      { size: '67KB',   suggestion: 'date-fns (13KB) or dayjs (2KB)' },
  'lodash':      { size: '71KB',   suggestion: 'lodash-es or individual imports' },
  'axios':       { size: '12KB',   suggestion: 'native fetch (built-in Node 18+)' },
  'request':     { size: '182KB',  suggestion: 'native fetch or node-fetch' },
  'bluebird':    { size: '72KB',   suggestion: 'native Promise (built-in)' },
  'underscore':  { size: '19KB',   suggestion: 'lodash-es or individual utils' },
  'jquery':      { size: '87KB',   suggestion: 'vanilla JS DOM APIs' },
  'uuid':        { size: '17KB',   suggestion: 'crypto.randomUUID() (built-in Node 15+)' },
  'colors':      { size: '10KB',   suggestion: 'chalk' },
  'faker':       { size: '3MB',    suggestion: '@faker-js/faker (tree-shakeable)' },
  'winston':     { size: '91KB',   suggestion: 'pino (9KB) for better performance' },
  'rimraf':      { size: '14KB',   suggestion: 'fs.rm(path, { recursive: true }) (built-in)' },
  'mkdirp':      { size: '7KB',    suggestion: 'fs.mkdirSync(path, { recursive: true }) (built-in)' },
  'glob':        { size: '27KB',   suggestion: 'fast-glob or node:fs glob (Node 22+)' },
  'async':       { size: '58KB',   suggestion: 'native async/await' },
  'q':           { size: '58KB',   suggestion: 'native Promise (built-in)' },
  'cross-env':   { size: '15KB',   suggestion: 'env vars in package.json scripts directly' },
  'dotenv':      { size: '6KB',    suggestion: '--env-file flag (Node 20+)' },
  'crypto-js':   { size: '422KB',  suggestion: 'native node:crypto (built-in)' },
  'xml2js':      { size: '22KB',   suggestion: 'fast-xml-parser (smaller, faster)' },
  'cheerio':     { size: '237KB',  suggestion: 'node-html-parser (much smaller)' },
  'highlight.js':{ size: '917KB',  suggestion: 'shiki (tree-shakeable)' },
};

export function getAlternative(pkg: string): Alternative | undefined {
  return ALTERNATIVES[pkg.toLowerCase()];
}
