import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface TrackingScriptsProps {
    integrations: {
        fb_pixel?: string;
        tt_pixel?: string;
        ga4_id?: string;
    };
}

declare global {
    interface Window {
        fbq: any;
        ttq: any;
        gtag: any;
    }
}

export function TrackingScripts({ integrations }: TrackingScriptsProps) {
    const location = useLocation();

    useEffect(() => {
        // Facebook Pixel
        if (integrations.fb_pixel) {
            !function (f, b, e, v, n, t, s) {
                if (f.fbq) return; n = f.fbq = function () {
                    n.callMethod ?
                    n.callMethod.apply(n, arguments) : n.queue.push(arguments)
                };
                if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
                n.queue = []; t = b.createElement(e); t.async = !0;
                t.src = v; s = b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t, s)
            }(window, document, 'script',
                'https://connect.facebook.net/en_US/fbevents.js');

            window.fbq('init', integrations.fb_pixel);
            window.fbq('track', 'PageView');
        }

        // TikTok Pixel
        if (integrations.tt_pixel) {
            !function (w, d, t) {
                w.ttq = w.ttq || [];
                w.ttq.methods = [
                    "page",
                    "track",
                    "identify",
                    "instances",
                    "debug",
                    "on",
                    "off",
                    "once",
                    "ready",
                    "alias",
                    "group",
                    "enableCookie",
                    "disableCookie",
                ];
                w.ttq.setAndDefer = function (t, e) {
                    t.split(".").forEach(function (e, n) {
                        w.ttq == w.ttq[e] && (w.ttq[e] = w.ttq[e] || []);
                        w.ttq = w.ttq[e];
                    });
                    w.ttq.push([e].concat(Array.prototype.slice.call(arguments, 2)));
                };
                w.ttq.load = function (e, n) {
                    var i = "https://analytics.tiktok.com/i18n/pixel/events.js";
                    w.ttq._i = w.ttq._i || {};
                    w.ttq._i[e] = [];
                    w.ttq._i[e]._u = i;
                    w.ttq._t = w.ttq._t || {};
                    w.ttq._t[e] = +new Date();
                    w.ttq._o = w.ttq._o || {};
                    w.ttq._o[e] = n || {};
                    var o = document.createElement("script");
                    o.type = "text/javascript";
                    o.async = !0;
                    o.src = i + "?sdkid=" + e + "&lib=" + t;
                    var a = document.getElementsByTagName("script")[0];
                    a.parentNode.insertBefore(o, a);
                };
                w.ttq.load(integrations.tt_pixel);
                w.ttq.page();
            }(window, document, 'ttq');
        }

        // Google Analytics 4
        if (integrations.ga4_id) {
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${integrations.ga4_id}`;
            document.head.appendChild(script);

            window.dataLayer = window.dataLayer || [];
            function gtag() { window.dataLayer.push(arguments); }
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', integrations.ga4_id);
        }
    }, [integrations]);

    // Track PageView on route change (SPA support)
    useEffect(() => {
        if (integrations.fb_pixel && window.fbq) {
            window.fbq('track', 'PageView');
        }
        if (integrations.tt_pixel && window.ttq) {
            window.ttq.page();
        }
        if (integrations.ga4_id && window.gtag) {
            window.gtag('event', 'page_view', {
                page_location: window.location.href,
                page_path: location.pathname
            });
        }
    }, [location, integrations]);

    return null;
}

// Helper functions for tracking events
export const trackLead = () => {
    if (typeof window === 'undefined') return;

    // Facebook
    if (window.fbq) window.fbq('track', 'Lead');

    // TikTok
    if (window.ttq) window.ttq.track('SubmitForm');

    // GA4
    if (window.gtag) window.gtag('event', 'generate_lead');
};

export const trackPurchase = (value: number, currency: string = 'USD') => {
    if (typeof window === 'undefined') return;

    // Facebook
    if (window.fbq) {
        window.fbq('track', 'Purchase', { value, currency });
    }

    // TikTok
    if (window.ttq) {
        window.ttq.track('CompletePayment', { value, currency });
    }

    // GA4
    if (window.gtag) {
        window.gtag('event', 'purchase', {
            value,
            currency,
        });
    }
};

export const trackInitiateCheckout = () => {
    if (typeof window === 'undefined') return;

    if (window.fbq) window.fbq('track', 'InitiateCheckout');
    if (window.ttq) window.ttq.track('InitiateCheckout');
    if (window.gtag) window.gtag('event', 'begin_checkout');
};
