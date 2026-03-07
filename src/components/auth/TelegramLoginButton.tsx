import { useEffect, useRef } from 'react';

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

    useEffect(() => {
        // Expose callback to global window object for the script to call
        (window as any).onTelegramAuth = onAuth;

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

    return <div ref={containerRef} className="flex justify-center w-full min-h-[40px]" />;
}
