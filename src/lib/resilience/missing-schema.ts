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
 * Session-level memory of features whose tables are not deployed. After the
 * first "missing" answer callers skip the request instead of sending one
 * failing call per render or per visitor action.
 */
const missingFeatures = new Set<string>();

export function isFeatureSchemaMissing(feature: string): boolean {
  return missingFeatures.has(feature);
}

/** Remembers the feature as missing when `error` is a missing-schema error. */
export function noteFeatureSchemaError(feature: string, error: unknown): void {
  if (isMissingSchemaError(error)) missingFeatures.add(feature);
}

/** Test hook. */
export function resetFeatureSchemaState(): void {
  missingFeatures.clear();
}
