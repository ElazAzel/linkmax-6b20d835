import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const CONSENT_KEY = 'lnkmx_cookie_consent';

type ConsentStatus = 'accepted' | 'rejected' | null;

function getConsent(): ConsentStatus {
    try {
        return localStorage.getItem(CONSENT_KEY) as ConsentStatus;
    } catch {
        return null;
    }
}

function setConsent(status: 'accepted' | 'rejected') {
    try {
        localStorage.setItem(CONSENT_KEY, status);
    } catch {
        // Ignore storage errors
    }
}

/**
 * Check if user has consented to analytics tracking.
 * Used by analytics hooks to gate tracking calls.
 */
export function hasAnalyticsConsent(): boolean {
    return getConsent() === 'accepted';
}

/**
 * Cookie consent banner component.
 * Shows once until user accepts or rejects.
 * Non-blocking, positioned at bottom of screen.
 */
export function CookieConsent() {
    const [visible, setVisible] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        // Only show if no consent decision yet
        const consent = getConsent();
        if (consent === null) {
            // Small delay so it doesn't flash on initial load
            const timer = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    if (!visible) return null;

    const handleAccept = () => {
        setConsent('accepted');
        setVisible(false);
    };

    const handleReject = () => {
        setConsent('rejected');
        setVisible(false);
    };

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-[9999] p-4 bg-card/95 backdrop-blur-sm border-t border-border shadow-lg"
            role="dialog"
            aria-label={t('cookies.title', 'Cookie consent')}
        >
            <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-4">
                <p className="text-sm text-muted-foreground flex-1">
                    {t(
                        'cookies.message',
                        'Мы используем аналитику для улучшения платформы. Нажмите «Принять», чтобы разрешить сбор анонимных данных о посещениях.'
                    )}
                    {' '}
                    <a href="/privacy" className="underline text-primary hover:text-primary/80">
                        {t('cookies.privacy', 'Политика конфиденциальности')}
                    </a>
                </p>
                <div className="flex gap-2 shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReject}
                    >
                        {t('cookies.reject', 'Отклонить')}
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleAccept}
                    >
                        {t('cookies.accept', 'Принять')}
                    </Button>
                </div>
            </div>
        </div>
    );
}
