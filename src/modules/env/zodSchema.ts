import fs   from 'fs';
import path from 'path';

const URL_KEY      = /url$/i;
const NUMBER_KEY   = /^(PORT|TIMEOUT|MAX_|MIN_|RETRY|LIMIT|SIZE|COUNT|WORKERS|THREADS|POOL)/i;
const BOOLEAN_KEY  = /^(FEATURE_|ENABLE_|DISABLE_|IS_|HAS_|USE_|ALLOW_|FLAG_)/i;

function inferType(key: string): string {
  if (URL_KEY.test(key))     return 'z.string().url()';
  if (NUMBER_KEY.test(key))  return 'z.coerce.number()';
  if (BOOLEAN_KEY.test(key)) return "z.enum(['true', 'false'])";
  return 'z.string().min(1)';
}

export function generateZodSchema(examplePath: string, outPath: string): void {
  if (!fs.existsSync(examplePath)) {
    console.error(`  ✗ ${examplePath} not found`);
    return;
  }

  const lines = fs.readFileSync(examplePath, 'utf-8').split('\n');
  const keys: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    keys.push(trimmed.slice(0, eqIdx).trim());
  }

  if (keys.length === 0) {
    console.error('  ✗ No keys found in example file');
    return;
  }

  const fields = keys.map((k) => `  ${k}: ${inferType(k)},`).join('\n');
  const output = `import { z } from 'zod';\n\nexport const envSchema = z.object({\n${fields}\n});\n\nexport type Env = z.infer<typeof envSchema>;\n`;

  fs.writeFileSync(outPath, output, 'utf-8');
  console.log(`  ✔ Generated ${outPath} (${keys.length} fields)`);
}
