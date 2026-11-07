import { expect, it } from 'vitest';
import { findEnvErrors } from './env-validator';

it('accepts a complete Supabase env', () => {
  expect(findEnvErrors({ VITE_SUPABASE_URL: 'https://x.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'k' })).toEqual([]);
  expect(findEnvErrors({ VITE_SUPABASE_URL: 'http://127.0.0.1:54321', VITE_SUPABASE_PUBLISHABLE_KEY: 'k', VITE_SUPABASE_PROJECT_ID: 'p' })).toEqual([]);
});

it('names each broken field', () => {
  expect(findEnvErrors({})).toEqual(['VITE_SUPABASE_URL: must be a valid URL', 'VITE_SUPABASE_PUBLISHABLE_KEY: required']);
  expect(findEnvErrors({ VITE_SUPABASE_URL: 'not a url', VITE_SUPABASE_PUBLISHABLE_KEY: 'k', VITE_SUPABASE_PROJECT_ID: '' })).toEqual([
    'VITE_SUPABASE_URL: must be a valid URL',
    'VITE_SUPABASE_PROJECT_ID: must not be empty',
  ]);
  expect(findEnvErrors({ VITE_SUPABASE_URL: 'ftp://x', VITE_SUPABASE_PUBLISHABLE_KEY: 'k' })).toHaveLength(1);
});
