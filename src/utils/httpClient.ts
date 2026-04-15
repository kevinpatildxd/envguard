import fs from 'fs';
import path from 'path';
import os from 'os';

const CACHE_DIR  = path.join(os.homedir(), '.devguard');
const CACHE_FILE = path.join(CACHE_DIR, 'cache.json');
const TTL_MS     = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry {
  ts: number;
  data: unknown;
}

function loadCache(): Record<string, CacheEntry> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    }
  } catch {
    // corrupted cache — start fresh
  }
  return {};
}

function saveCache(cache: Record<string, CacheEntry>): void {
  try {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  } catch {
    // non-fatal — cache write failure should never crash the tool
  }
}

export async function httpGet<T>(url: string): Promise<T> {
  const cache = loadCache();
  const entry = cache[url];

  if (entry && Date.now() - entry.ts < TTL_MS) {
    return entry.data as T;
  }

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const data = (await res.json()) as T;

  cache[url] = { ts: Date.now(), data };
  saveCache(cache);

  return data;
}

export async function httpPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json() as Promise<T>;
}
