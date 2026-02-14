'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

import type { PageIntegrations } from '@/types/page';

interface TrackingScriptsProps {
    integrations: PageIntegrations;
}

declare global {
    interface Window {
        fbq: any;
        _fbq: any;
        ttq: any;
        gtag: any;
        dataLayer: any[];
        ym: any;
    }
}

export function TrackingScripts({ integrations }: TrackingScriptsProps) {
    const pathname = usePathname();

    useEffect(() => {
        // Facebook Pixel
        if (integrations.fb_pixel) {
            const f = window as any;
            const b = document;
            if (!f.fbq) {
                const n: any = f.fbq = function () {
                    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
                };
                if (!f._fbq) f._fbq = n;
                n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
                const t = b.createElement('script'); t.async = true;
                t.src = 'https://connect.facebook.net/en_US/fbevents.js';
                const s = b.getElementsByTagName('script')[0];
                s.parentNode?.insertBefore(t, s);
            }
            window.fbq('init', integrations.fb_pixel);
            window.fbq('track', 'PageView');
        }

        // TikTok Pixel
        if (integrations.tt_pixel) {
            const w = window as any;
            w.ttq = w.ttq || [];
            w.ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
            w.ttq.setAndDefer = function (t: any, e: any) {
                t[e] = function () {
                    t._i[e] = t._i[e] || [];
                    t._i[e].push(arguments);
                };
            };
            w.ttq.load = function (e: string) {
                const i = "https://analytics.tiktok.com/i18n/pixel/events.js";
                w.ttq._i = w.ttq._i || {};
                w.ttq._i[e] = [];
                w.ttq._t = w.ttq._t || {};
                w.ttq._t[e] = +new Date();
                const o = document.createElement("script");
                o.type = "text/javascript"; o.async = true;
                o.src = i + "?sdkid=" + e + "&lib=ttq";
                const a = document.getElementsByTagName("script")[0];
                a.parentNode?.insertBefore(o, a);
            };
            w.ttq.load(integrations.tt_pixel);
            w.ttq.page();
        }

        // Google Analytics 4
        if (integrations.ga4_id) {
            const script = document.createElement('script');
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${integrations.ga4_id}`;
            document.head.appendChild(script);

            window.dataLayer = window.dataLayer || [];
            const gtag = function (...args: any[]) { window.dataLayer.push(args); }
            window.gtag = gtag;
            gtag('js', new Date());
            gtag('config', integrations.ga4_id);
        }
        // Yandex Metrika
        if (integrations.yandex_metrika) {
            const w = window as any;
            const d = document;
            const c = "yandex_metrika_callbacks2";
            w[c] = w[c] || [];
            w[c].push(function () {
                try {
                    w.ym = w.ym || function (...args: any[]) { (w.ym.a = w.ym.a || []).push(args) };
                    w.ym.l = 1 * new Date().getTime();
                    w.ym(integrations.yandex_metrika, "init", {
                        clickmap: true,
                        trackLinks: true,
                        accurateTrackBounce: true,
                        webvisor: true
                    });
                } catch (e) { }
            });

            const n = d.getElementsByTagName("script")[0];
            const s = d.createElement("script");
            const f = function () { n.parentNode?.insertBefore(s, n); };
            s.type = "text/javascript";
            s.async = true;
            s.src = "https://mc.yandex.ru/metrika/tag.js";

            if ((w as any).opera == "[object Opera]") {
                d.addEventListener("DOMContentLoaded", f, false);
            } else { f(); }
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
                page_path: pathname
            });
        }
    }, [pathname, integrations]);

    return null;
}

// Helper functions for tracking events
export const trackLead = () => {
    if (typeof window === 'undefined') return;
    if (window.fbq) window.fbq('track', 'Lead');
    if (window.ttq) window.ttq.track('SubmitForm');
    if (window.gtag) window.gtag('event', 'generate_lead');
};

export const trackPurchase = (value: number, currency: string = 'USD') => {
    if (typeof window === 'undefined') return;
    if (window.fbq) window.fbq('track', 'Purchase', { value, currency });
    if (window.ttq) window.ttq.track('CompletePayment', { value, currency });
    if (window.gtag) window.gtag('event', 'purchase', { value, currency });
};

export const trackInitiateCheckout = () => {
    if (typeof window === 'undefined') return;
    if (window.fbq) window.fbq('track', 'InitiateCheckout');
    if (window.ttq) window.ttq.track('InitiateCheckout');
    if (window.gtag) window.gtag('event', 'begin_checkout');
};
