/**
 * Telegram Mini App entrypoint
 * Separate from main.tsx for optimized bundle size:
 * - No Sentry, PWA, Cookie consent
 * - Minimal i18n (no DB backend on cold start)
 * - Telegram WebApp SDK script loaded via tg.html <head>
 */

import '../i18n/config';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TelegramApp from './TelegramApp';

// Lighter QueryClient for Mini App — shorter stale/gc times
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 2 * 60 * 1000,    // 2 min
            gcTime: 5 * 60 * 1000,       // 5 min
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

const container = document.getElementById('tg-root');

if (container) {
    createRoot(container).render(
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <TelegramApp />
            </QueryClientProvider>
        </React.StrictMode>
    );
} else {
    console.error('[TelegramApp] #tg-root element not found');
}
