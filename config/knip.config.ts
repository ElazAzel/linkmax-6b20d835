import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  // TanStack Start loads these by convention, without source-level imports.
  // Native helpers and business APIs are retained even while their UI is gated.
  entry: [
    'src/{client,server,router,start}.{ts,tsx}',
    'src/telegram/main.tsx',
    'src/platform/native/keyboard.ts',
    'src/hooks/social/useCollaboration.ts',
    'src/lib/{money,trust}/**/*.ts',
    'tailwind.legacy.config.ts',
  ],
  project: ['src/**/*.{ts,tsx}'],
  ignore: ['src/integrations/supabase/types.ts', 'src/platform/supabase/types.ts'],
  // Capacitor discovers native platforms by package name, outside the JS graph.
  ignoreDependencies: ['@capacitor/ios'],
};

export default config;
