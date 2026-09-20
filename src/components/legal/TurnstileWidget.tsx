import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';

/**
 * Cloudflare Turnstile widget (invisible / managed mode)
 *
 * The Turnstile script is loaded on demand by `loadTurnstileScript()` when a
 * widget mounts — nothing needs to be included in index.html.
 *
 * Usage:
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

// Loads the Turnstile script on demand (once), instead of shipping it globally
// in index.html — saves ~100KB of third-party JS on every page load.
let turnstileScriptPromise: Promise<void> | null = null;

export function loadTurnstileScript(): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve();
    if (window.turnstile) return Promise.resolve();
    if (turnstileScriptPromise) return turnstileScriptPromise;

    turnstileScriptPromise = new Promise<void>((resolve, reject) => {
        const existing = document.querySelector('script[data-turnstile="true"]') as HTMLScriptElement | null;
        if (existing) {
            existing.addEventListener('load', () => resolve(), { once: true });
            existing.addEventListener('error', () => reject(new Error('Turnstile script failed')), { once: true });
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
        script.async = true;
        script.defer = true;
        script.dataset.turnstile = 'true';
        script.onload = () => resolve();
        script.onerror = () => {
            turnstileScriptPromise = null; // allow retry
            reject(new Error('Turnstile script failed'));
        };
        document.head.appendChild(script);
    });
    return turnstileScriptPromise;
}

export const TurnstileWidget = forwardRef<HTMLDivElement, TurnstileWidgetProps>(function TurnstileWidget({ onToken, onError, className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    useImperativeHandle(ref, () => containerRef.current!, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el || !TURNSTILE_SITE_KEY || TURNSTILE_SITE_KEY.includes('PLACEHOLDER')) return;

        let cancelled = false;

        // Load the script on demand, then render the widget when ready
        loadTurnstileScript()
            .then(() => {
                const waitForApi = () => {
                    if (cancelled) return;
                    if (!window.turnstile) {
                        setTimeout(waitForApi, 300);
                        return;
                    }
                    if (widgetIdRef.current) {
                        try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
                    }
                    try {
                        widgetIdRef.current = window.turnstile.render(el, {
                            sitekey: TURNSTILE_SITE_KEY,
                            callback: (token: string) => {
                                if (!cancelled) onToken(token);
                            },
                            'error-callback': () => {
                                if (!cancelled) onError?.();
                            },
                            theme: 'auto',
                            size: 'flexible',
                        });
                    } catch (err) {
                        console.error('Turnstile render error:', err);
                    }
                };
                waitForApi();
            })
            .catch((err) => {
                if (!cancelled) onError?.();
                console.error('Turnstile load error:', err);
            });

        return () => {
            cancelled = true;
            if (widgetIdRef.current && window.turnstile) {
                try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
                widgetIdRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div ref={containerRef} className={className} />;
});

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
