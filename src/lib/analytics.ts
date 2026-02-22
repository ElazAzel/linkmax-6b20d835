import { storage } from '@/lib/storage';

// ─── Server-Side Pixel Proxy ─────────────────────────────────────
const PIXEL_PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL || ''}/functions/v1/pixel-proxy`;

// Stable client ID for GA4 MP
export function getOrCreateClientId(): string {
    const key = 'ga_cid'; // Use a shorter key for storage utility compatibility
    let cid = storage.getRaw(key);
    if (!cid) {
        cid = crypto.randomUUID();
        storage.setRaw(key, cid);
    }
    return cid;
}

function sendServerEvent(
    pageId: string,
    event: string,
    eventData: Record<string, unknown> = {},
    userData: Record<string, string> = {},
    eventId?: string,
) {
    if (!pageId || typeof navigator === 'undefined') return eventId;

    const id = eventId || crypto.randomUUID();
    const payload = JSON.stringify({
        pageId,
        event,
        eventData,
        userData,
        sourceUrl: window.location.href,
        clientId: getOrCreateClientId(),
        eventId: id,
    });

    // Use sendBeacon for reliable delivery (survives page navigation)
    if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(PIXEL_PROXY_URL, blob);
    } else {
        fetch(PIXEL_PROXY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
        }).catch(() => { }); // fire-and-forget
    }

    return id;
}

// Store current pageId for helper functions
let _currentPageId: string | undefined;

export function setCurrentPageId(id: string | undefined) {
    _currentPageId = id;
}

export function getCurrentPageId() {
    return _currentPageId;
}

// ─── Helper functions for tracking events — dual client+server ───

export const trackLead = (userData?: Record<string, string>) => {
    if (typeof window === 'undefined') return;
    if (window.fbq) window.fbq('track', 'Lead');
    if (window.ttq) window.ttq.track('SubmitForm');
    if (window.gtag) window.gtag('event', 'generate_lead');
    if (window.ym) window.ym('reachGoal', 'lead');
    if (_currentPageId) sendServerEvent(_currentPageId, 'Lead', {}, userData);
};

export const trackPurchase = (value: number, currency: string = 'USD') => {
    if (typeof window === 'undefined') return;
    if (window.fbq) window.fbq('track', 'Purchase', { value, currency });
    if (window.ttq) window.ttq.track('CompletePayment', { value, currency });
    if (window.gtag) window.gtag('event', 'purchase', { value, currency });
    if (_currentPageId) sendServerEvent(_currentPageId, 'Purchase', { value, currency });
};

export const trackInitiateCheckout = () => {
    if (typeof window === 'undefined') return;
    if (window.fbq) window.fbq('track', 'InitiateCheckout');
    if (window.ttq) window.ttq.track('InitiateCheckout');
    if (window.gtag) window.gtag('event', 'begin_checkout');
    if (_currentPageId) sendServerEvent(_currentPageId, 'InitiateCheckout');
};

export const trackViewContent = (contentName?: string, contentType?: string) => {
    if (typeof window === 'undefined') return;
    const data = { content_name: contentName, content_type: contentType };
    if (window.fbq) window.fbq('track', 'ViewContent', data);
    if (window.ttq) window.ttq.track('ViewContent', data);
    if (window.gtag) window.gtag('event', 'view_item', data);
    if (_currentPageId) sendServerEvent(_currentPageId, 'ViewContent', data);
};

export const trackClickLink = (blockTitle?: string, url?: string) => {
    if (typeof window === 'undefined') return;
    const data = { content_name: blockTitle, link_url: url };
    if (window.fbq) window.fbq('trackCustom', 'ClickLink', data);
    if (window.ttq) window.ttq.track('ClickButton', data);
    if (window.gtag) window.gtag('event', 'click', { event_category: 'link', event_label: blockTitle, link_url: url });
};

export const trackSubscribe = (userData?: Record<string, string>) => {
    if (typeof window === 'undefined') return;
    if (window.fbq) window.fbq('track', 'Subscribe');
    if (window.ttq) window.ttq.track('Subscribe');
    if (window.gtag) window.gtag('event', 'subscribe');
    if (_currentPageId) sendServerEvent(_currentPageId, 'Subscribe', {}, userData);
};
