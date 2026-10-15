import { defineConfig, loadEnv } from 'vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { nitro } from 'nitro/vite';
import { validatePublicEnv } from './scripts/portability-core.mjs';

// Independent plugin graph: never compose this with the Lovable wrapper.
export default defineConfig(({ mode }) => {
  const publicEnv = validatePublicEnv({ ...loadEnv(mode, process.cwd(), ''), ...process.env });
  return {
    // Only explicitly reviewed public values enter browser code.
    envPrefix: 'LINKMAX_UNUSED_PUBLIC_PREFIX_',
    define: Object.fromEntries(Object.entries(publicEnv).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)])),
    plugins: [tsconfigPaths(), tailwindcss(), tanstackStart({ server: { entry: 'server' } }), nitro({ preset: 'node-server' }), react()],
    resolve: { dedupe: ['react', 'react-dom', '@tanstack/react-router'] },
    ssr: { noExternal: ['react-helmet-async'] },
  };
});
