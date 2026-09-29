import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// Unit tests never talk to Supabase, but modules create the client on import.
// Fall back to placeholders so tests run without secrets (Dependabot, forks,
// fresh clones); real values from .env or CI secrets still win.
const fileEnv = loadEnv('test', process.cwd(), 'VITE_');
const envOr = (name: string, fallback: string) => process.env[name] || fileEnv[name] || fallback;

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 60000, // Increased testTimeout from 30000 to 60000
    setupFiles: ['./src/testing/setup.ts'],
    env: {
      VITE_SUPABASE_URL: envOr('VITE_SUPABASE_URL', 'http://127.0.0.1:54321'),
      VITE_SUPABASE_PUBLISHABLE_KEY: envOr('VITE_SUPABASE_PUBLISHABLE_KEY', 'test-publishable-key'),
    },
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'cloudflare-worker/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 60,
        statements: 80,
      },
      include: [
        'src/services/fintech.ts',
        'src/services/payment-service.ts',
        'src/services/user.ts',
        'src/services/admin.ts',
        'src/services/kaspi-service.ts',
        'src/services/zones/robokassa.ts',
      ],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/__tests__/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
