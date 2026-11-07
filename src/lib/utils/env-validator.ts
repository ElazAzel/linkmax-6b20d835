import { logger } from './logger';

// Plain checks instead of a schema library: this runs on every page load, and
// pulling zod into the entry chunk cost ~56 KB for three fields.
function isHttpUrl(value: unknown): boolean {
  if (typeof value !== 'string' || !value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

/** Returns one message per invalid field; empty when the env is usable. */
export function findEnvErrors(env: Record<string, unknown>): string[] {
  const errors: string[] = [];
  if (!isHttpUrl(env.VITE_SUPABASE_URL)) errors.push('VITE_SUPABASE_URL: must be a valid URL');
  if (typeof env.VITE_SUPABASE_PUBLISHABLE_KEY !== 'string' || !env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    errors.push('VITE_SUPABASE_PUBLISHABLE_KEY: required');
  }
  const projectId = env.VITE_SUPABASE_PROJECT_ID;
  if (projectId !== undefined && (typeof projectId !== 'string' || !projectId)) {
    errors.push('VITE_SUPABASE_PROJECT_ID: must not be empty');
  }
  return errors;
}

/**
 * Validates essential environment variables.
 * Called once from client bootstrap; throws in production so a broken build
 * fails loudly instead of silently talking to nothing.
 */
export const validateEnv = () => {
  const errors = findEnvErrors({
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
  });
  if (errors.length === 0) {
    logger.debug('✅ Environment validation passed');
    return;
  }
  const errorMsg = errors.join('\n');
  console.error('❌ Application Environment Validation Failed:\n', errorMsg);
  if (import.meta.env.PROD) {
    throw new Error(`Critical Environment Configuration Error:\n${errorMsg}`);
  }
};
