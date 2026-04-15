import fs from 'fs';
import { ParsedEnv } from '../../types';

function parseLines(content: string): ParsedEnv {
  const map: ParsedEnv = new Map();

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();

    if (!line || line.startsWith('#')) continue;

    const eqIndex = line.indexOf('=');
    if (eqIndex === -1) continue;

    const key = line.slice(0, eqIndex).trim();
    if (!key) continue;

    let value = line.slice(eqIndex + 1).trim();

    const commentIndex = value.indexOf(' #');
    if (commentIndex !== -1) {
      value = value.slice(0, commentIndex).trim();
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    map.set(key, value);
  }

  return map;
}

export function parseEnvFile(filePath: string): ParsedEnv {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return parseLines(fs.readFileSync(filePath, 'utf-8'));
}

export function parseEnvExample(filePath: string): ParsedEnv {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return parseLines(fs.readFileSync(filePath, 'utf-8'));
}
