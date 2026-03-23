import { z } from 'zod';

/**
 * Environment variables schema
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1, 'VITE_SUPABASE_PUBLISHABLE_KEY is required'),
  // Add other critical variables here as the project grows
});

/**
 * Validates environment variables at runtime
 * @throws Error if validation fails
 */
export function validateEnv() {
  const env = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };

  const result = envSchema.safeParse(env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMsg = Object.entries(errors)
      .map(([field, msgs]) => `${field}: ${msgs?.join(', ')}`)
      .join('\n');
    
    console.error('❌ Application Environment Validation Failed:\n', errorMsg);
    
    // In production, we might want to alert Sentry or show a fatal error UI
    if (import.meta.env.PROD) {
      throw new Error(`Critical Environment Configuration Error:\n${errorMsg}`);
    }
  } else {
    if (import.meta.env.DEV) {
      console.log('✅ Environment validation passed');
    }
  }
}
