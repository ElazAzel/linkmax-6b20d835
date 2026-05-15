import { useEffect, useRef, useState } from 'react';
import { getAppDomain } from '@/lib/utils/url-helpers';

interface TelegramLoginButtonProps {
    botName: string;
    onAuth: (user: any) => void;
    buttonSize?: 'large' | 'medium' | 'small';
    cornerRadius?: number;
    requestAccess?: 'write';
}

export function TelegramLoginButton({
    botName,
    onAuth,
    buttonSize = 'large',
    cornerRadius = 16,
    requestAccess = 'write',
}: TelegramLoginButtonProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isValidDomain, setIsValidDomain] = useState(true);
    const onAuthRef = useRef(onAuth);
    onAuthRef.current = onAuth;

    useEffect(() => {
        try {
            const appHost = new URL(getAppDomain()).hostname;
            const currentHost = window.location.hostname;
            // Prevent "Bot domain invalid" by strictly matching hostname
            if (appHost !== currentHost) {
                setIsValidDomain(false);
                return;
            }
        } catch (e) {
            console.warn('Failed to parse app domain for Telegram widget validation:', e);
        }

        // Expose callback to global window object for the script to call
        (window as any).onTelegramAuth = (user: any) => onAuthRef.current(user);

        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.setAttribute('data-telegram-login', botName);
        script.setAttribute('data-size', buttonSize);

        if (cornerRadius !== undefined) {
            // Telegram supports data-radius
            script.setAttribute('data-radius', cornerRadius.toString());
        }

        script.setAttribute('data-request-access', requestAccess);
        script.setAttribute('data-onauth', 'onTelegramAuth(user)');
        script.async = true;

        if (containerRef.current) {
            // Clear previous content to prevent multiple script tags on strict mode / re-renders
            containerRef.current.innerHTML = '';
            containerRef.current.appendChild(script);
        }

        return () => {
            // We do not delete the global function here because it might be called after unmount in some edge cases,
            // but it's generally safe.
        };
    }, [botName, buttonSize, cornerRadius, requestAccess, onAuth]);

    if (!isValidDomain) {
        return null;
    }

    return <div ref={containerRef} className="flex justify-center w-full min-h-[40px]" />;
}
