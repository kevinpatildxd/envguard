import fs   from 'fs';
import path from 'path';

export interface DevguardConfig {
  strict?:  boolean;
  json?:    boolean;
  env?: {
    example?: string;
    scanGit?: boolean;
    depth?:   number;
  };
  deps?: {
    licenses?:    boolean;
    supplyChain?: boolean;
    duplicates?:  boolean;
  };
  react?: {
    entry?: string;
  };
}

const CONFIG_FILES = ['.devguard.json', 'devguard.config.json'];

export function loadConfig(cwd: string): DevguardConfig {
  for (const file of CONFIG_FILES) {
    const filePath = path.join(cwd, file);
    if (fs.existsSync(filePath)) {
      try {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as DevguardConfig;
      } catch {
        console.error(`  ⚠ Could not parse ${file} — using defaults`);
      }
    }
  }
  return {};
}
