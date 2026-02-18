import { useRef, useEffect, useState, useCallback } from 'react';

/**
 * Cloudflare Turnstile widget (invisible / managed mode)
 *
 * 1. Include the Turnstile script once in index.html:
 *    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
 *
 * 2. Usage:
 *    const { token, resetTurnstile } = useTurnstile();
 *    <TurnstileWidget onToken={setToken} />
 *
 *    Pass `token` alongside form data.
 *    After submission, call resetTurnstile() to get a fresh token.
 */

// Add site key here or read from env
const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '0x4AAAAAAA_PLACEHOLDER_';

interface TurnstileWidgetProps {
    onToken: (token: string) => void;
    onError?: () => void;
    className?: string;
}

declare global {
    interface Window {
        turnstile?: {
            render: (el: HTMLElement, options: Record<string, unknown>) => string;
            reset: (widgetId: string) => void;
            remove: (widgetId: string) => void;
        };
    }
}

export function TurnstileWidget({ onToken, onError, className }: TurnstileWidgetProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        // Wait for turnstile to be loaded
        const tryRender = () => {
            if (!window.turnstile) {
                setTimeout(tryRender, 200);
                return;
            }

            // Remove old widget if exists
            if (widgetIdRef.current) {
                try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
            }

            widgetIdRef.current = window.turnstile.render(el, {
                sitekey: TURNSTILE_SITE_KEY,
                callback: (token: string) => onToken(token),
                'error-callback': () => onError?.(),
                theme: 'auto', // follows system dark/light
                size: 'flexible',  // invisible by default, challenges only when suspicious
            });
        };
        tryRender();

        return () => {
            if (widgetIdRef.current && window.turnstile) {
                try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div ref={containerRef} className={className} />;
}

/**
 * Hook for managing Turnstile token state
 */
export function useTurnstile() {
    const [token, setToken] = useState<string | null>(null);
    const widgetRef = useRef<string | null>(null);

    const resetTurnstile = useCallback(() => {
        setToken(null);
        if (widgetRef.current && window.turnstile) {
            try { window.turnstile.reset(widgetRef.current); } catch { /* ignore */ }
        }
    }, []);

    return { token, setToken, resetTurnstile };
}
