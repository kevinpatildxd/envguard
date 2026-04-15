import { ParsedEnv } from '../../types';

export interface ConsistencyIssue {
  key: string;
  presentIn: string[];
  missingIn: string[];
}

export function checkConsistency(
  envFiles: { file: string; env: ParsedEnv }[]
): ConsistencyIssue[] {
  if (envFiles.length < 2) return [];

  const allKeys = new Set<string>();
  for (const { env } of envFiles) {
    for (const key of env.keys()) allKeys.add(key);
  }

  const issues: ConsistencyIssue[] = [];

  for (const key of allKeys) {
    const presentIn = envFiles.filter(({ env }) =>  env.has(key)).map(({ file }) => file);
    const missingIn = envFiles.filter(({ env }) => !env.has(key)).map(({ file }) => file);
    if (missingIn.length > 0 && presentIn.length > 0) {
      issues.push({ key, presentIn, missingIn });
    }
  }

  return issues.sort((a, b) => a.key.localeCompare(b.key));
}
