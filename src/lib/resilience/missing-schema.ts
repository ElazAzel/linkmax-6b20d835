/**
 * missing-schema — recognise "this table / function / column is not in the
 * database" errors.
 *
 * Migrations are applied to the production database separately from code
 * deploys, so a feature can ship before its tables or RPCs exist. Those
 * errors are permanent until the migration lands: retrying or showing
 * "try again" is wrong, the feature is simply unavailable.
 */

const MISSING_SCHEMA_CODES = new Set([
  '42P01', // undefined_table
  '42883', // undefined_function
  '42703', // undefined_column
  'PGRST202', // function not found in the schema cache
  'PGRST204', // column not found in the schema cache
  'PGRST205', // table not found in the schema cache
]);

export function isMissingSchemaError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: unknown }).code;
  return typeof code === 'string' && MISSING_SCHEMA_CODES.has(code);
}

/** Thrown by services whose backing tables/RPCs are not deployed yet. */
export class FeatureUnavailableError extends Error {
  constructor(public readonly feature: string) {
    super(`feature_unavailable:${feature}`);
    this.name = 'FeatureUnavailableError';
  }
}

/*
 * Memory of features whose tables are not deployed. After the first
 * "missing" answer callers skip the request instead of sending one failing
 * call per render or per visitor action. It is kept in localStorage for a
 * day, so a reload does not print the same 404 in every visitor's console
 * again; once the migration lands the feature comes back within a day.
 */
const STORAGE_KEY = 'lnkmx:missing-schema';
const TTL_MS = 24 * 60 * 60 * 1000;
// feature -> when it was reported missing; checked against TTL on every read.
const missingFeatures = new Map<string, number>();
let loaded = false;

function readStored(): Record<string, number> {
  try {
    if (typeof window === 'undefined') return {};
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function loadStored(): void {
  if (loaded) return;
  loaded = true;
  for (const [feature, at] of Object.entries(readStored())) {
    if (typeof at === 'number') missingFeatures.set(feature, at);
  }
}

export function isFeatureSchemaMissing(feature: string): boolean {
  loadStored();
  const at = missingFeatures.get(feature);
  if (at === undefined) return false;
  if (Date.now() - at < TTL_MS) return true;
  // Expired: try the feature again (a long-lived tab picks up the migration).
  missingFeatures.delete(feature);
  return false;
}

/** Remembers the feature as missing when `error` is a missing-schema error. */
export function noteFeatureSchemaError(feature: string, error: unknown): void {
  if (!isMissingSchemaError(error)) return;
  const now = Date.now();
  missingFeatures.set(feature, now);
  try {
    if (typeof window === 'undefined') return;
    const stored = readStored();
    stored[feature] = now;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    /* storage blocked: the in-memory flag still covers this session */
  }
}

/** Test hook. */
export function resetFeatureSchemaState(): void {
  missingFeatures.clear();
  loaded = false;
  try {
    if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
