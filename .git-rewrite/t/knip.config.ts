import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ['src/main.tsx'],
  project: ['src/**/*.{ts,tsx}'],
  ignore: ['src/platform/supabase/types.ts'],
  ignoreDependencies: ['@playwright/test'],
};

export default config;
