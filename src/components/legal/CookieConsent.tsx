import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { storage } from '@/lib/storage';


const CONSENT_KEY = 'lnkmx_cookie_consent';

type ConsentStatus = 'accepted' | 'rejected' | null;

function getConsent(): ConsentStatus {
    return storage.getRaw(CONSENT_KEY) as ConsentStatus;
}

function setConsent(status: 'accepted' | 'rejected') {
    storage.setRaw(CONSENT_KEY, status);
}

/**
 * Check if user has consented to analytics tracking.
 * First-party analytics (our own DB) always allowed — it's anonymous, no cookies.
 * Third-party pixels (FB, TikTok, GA4, Yandex) require explicit consent.
 */
export function hasAnalyticsConsent(): boolean {
    // First-party analytics: always allowed (anonymous, no PII)
    return true;
}

/**
 * Check if user consented to third-party tracking pixels.
 * Used to gate loading of external scripts (FB Pixel, TikTok, GA4, Yandex).
 */
export function hasThirdPartyConsent(): boolean {
    return getConsent() !== 'rejected';
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
            className="fixed bottom-2 left-2 right-2 sm:left-auto sm:right-4 sm:bottom-4 sm:max-w-sm z-[60] p-3 rounded-2xl bg-card/95 backdrop-blur-sm border border-border shadow-lg pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            role="dialog"
            aria-label={t('cookies.title', 'Cookie consent')}
        >
            <div className="flex flex-col gap-3">
                <p className="text-xs sm:text-sm text-muted-foreground">
                    {t('cookies.message')}
                    {' '}
                    <a href="/privacy" className="underline text-primary hover:text-primary/80">
                        {t('cookies.privacy', 'Политика конфиденциальности')}
                    </a>
                </p>
                <div className="flex gap-2 justify-end">
                    <Button
                        variant="ghost"
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
