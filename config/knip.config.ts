import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ['src/main.tsx', 'src/telegram/main.tsx'],
  project: ['src/**/*.{ts,tsx}'],
  ignore: ['src/integrations/supabase/types.ts', 'src/platform/supabase/types.ts'],
  ignoreDependencies: ['@playwright/test'],
};

export default config;
