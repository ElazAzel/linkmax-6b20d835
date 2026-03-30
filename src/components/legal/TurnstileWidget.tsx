import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';

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

export const TurnstileWidget = forwardRef<HTMLDivElement, TurnstileWidgetProps>(function TurnstileWidget({ onToken, onError, className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    useImperativeHandle(ref, () => containerRef.current!, []);

    useEffect(() => {
        const el = containerRef.current;
        if (!el || !TURNSTILE_SITE_KEY || TURNSTILE_SITE_KEY.includes('PLACEHOLDER')) return;

        let isMounted = true;

        // Wait for turnstile to be loaded
        const tryRender = () => {
            if (!isMounted) return;
            
            if (!window.turnstile) {
                setTimeout(tryRender, 500); // Increased delay
                return;
            }

            // Remove old widget if exists
            if (widgetIdRef.current) {
                try { window.turnstile.remove(widgetIdRef.current); } catch { /* ignore */ }
            }

            try {
                widgetIdRef.current = window.turnstile.render(el, {
                    sitekey: TURNSTILE_SITE_KEY,
                    callback: (token: string) => {
                        if (isMounted) onToken(token);
                    },
                    'error-callback': () => {
                        if (isMounted) onError?.();
                    },
                    theme: 'auto',
                    size: 'flexible',
                });
            } catch (err) {
                console.error('Turnstile render error:', err);
            }
        };
        
        tryRender();

        return () => {
            isMounted = false;
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
