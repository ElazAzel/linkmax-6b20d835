import { z } from 'zod';
import { logger } from './logger';

// ─── Environment Variables Schema ───
// We use a strict schema to prevent silent failures in production.
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  VITE_SUPABASE_PROJECT_ID: z.string().min(1).optional(),
});

/**
 * Validates essential environment variables.
 * Should be called early in the app entry point (main.tsx).
 */
export const validateEnv = () => {
  try {
    const rawEnv = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      VITE_SUPABASE_PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID,
    };

    envSchema.parse(rawEnv);
    logger.debug('✅ Environment validation passed');
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      const errors = err.flatten().fieldErrors;
      const errorMsg = Object.entries(errors)
        .map(([field, msgs]) => `${field}: ${msgs?.join(', ')}`)
        .join('\n');
      
      console.error('❌ Application Environment Validation Failed:\n', errorMsg);
      
      if (import.meta.env.PROD) {
        throw new Error(`Critical Environment Configuration Error:\n${errorMsg}`);
      }
    } else {
      console.error('❌ Unexpected Error during Environment Validation:', err);
      if (import.meta.env.PROD) throw err;
    }
  }
};
