// Shared severity
export type Severity = 'error' | 'warning';

// ── Env module ──────────────────────────────────────────────────────────────

export interface ValidationResult {
  rule: string;
  severity: Severity;
  key: string;
  message: string;
}

export type ParsedEnv = Map<string, string>;

// ── Deps module ─────────────────────────────────────────────────────────────

export interface DepsIssue {
  type: 'unused' | 'outdated' | 'vulnerable' | 'alternative';
  severity: Severity;
  name: string;
  message: string;
  suggestion?: string;
}

// ── React module ─────────────────────────────────────────────────────────────

export interface ReactIssue {
  type: string;
  severity: Severity;
  file: string;
  line?: number;
  message: string;
}

// ── Shared audit result ───────────────────────────────────────────────────────

export interface AuditResult<T> {
  module: string;
  issues: T[];
}
