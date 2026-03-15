/**
 * Sentry SDK initialization
 * 
 * Must be imported FIRST in main.tsx (before React and other code).
 * If VITE_SENTRY_DSN is not set, Sentry is a no-op.
 * 
 * @see https://docs.sentry.io/platforms/javascript/guides/react/
 */
import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;
const isDev = import.meta.env.DEV;

if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,
        environment: isDev ? 'development' : 'production',

        // Performance Monitoring
        tracesSampleRate: isDev ? 1.0 : 0.2, // 20% of transactions in prod

        // Session Replay (optional, only in production)
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: isDev ? 0 : 0.1, // 10% of errors get replays

        // Don't send PII by default
        sendDefaultPii: false,

        // Filter noisy errors
        beforeSend(event) {
            // Ignore ResizeObserver loop errors (benign browser bug)
            if (event.exception?.values?.[0]?.value?.includes('ResizeObserver loop')) {
                return null;
            }
            // Ignore cancelled fetch requests
            if (event.exception?.values?.[0]?.value?.includes('AbortError')) {
                return null;
            }
            // Ignore noise from cute-cursors browser extension
            const eventString = JSON.stringify(event);
            if (eventString.includes('cute-cursors') || eventString.includes('solomon.cute-cursors.com')) {
                return null;
            }
            return event;
        },

        // Integrations
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: false,
                blockAllMedia: false,
            }),
        ],
    });
}

export { Sentry };
export const isSentryEnabled = !!SENTRY_DSN;
