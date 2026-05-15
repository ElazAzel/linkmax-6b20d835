'use client';

import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { hasThirdPartyConsent } from '@/components/legal/CookieConsent';
import { setCurrentPageId } from '@/lib/analytics';
import DOMPurify from 'dompurify';

import type { PageIntegrations } from '@/types/page';

interface TrackingScriptsProps {
    integrations: PageIntegrations;
    pageId?: string;
}

export type FBQ = {
    (type: string, name?: string, parameters?: Record<string, unknown>): void;
    callMethod?: (...args: unknown[]) => void;
    queue: unknown[][];
    push: FBQ;
    loaded: boolean;
    version: string;
};

export type TTQ = {
    (...args: unknown[]): void;
    methods: string[];
    setAndDefer: (t: any, e: string) => void;
    load: (e: string) => void;
    page: () => void;
    _i: Record<string, unknown[]>;
    _t: Record<string, number>;
    [key: string]: any;
};

export type GTag = (...args: unknown[]) => void;

export type YM = {
    (id: string, methodName: string, options?: Record<string, unknown> | string): void;
    a?: unknown[][];
    l?: number;
};

declare global {
    interface Window {
        fbq: FBQ;
        _fbq: FBQ;
        ttq: TTQ;
        gtag: GTag;
        dataLayer: unknown[][];
        ym: YM;
        yandex_metrika_callbacks2?: Array<() => void>;
        opera?: string;
    }
}

export function TrackingScripts({ integrations, pageId }: TrackingScriptsProps) {
    const location = useLocation();
    const pathname = location.pathname;
    const pageIdRef = useRef(pageId);
    pageIdRef.current = pageId;
    setCurrentPageId(pageId);

    useEffect(() => {
        // Only load third-party scripts if user hasn't explicitly rejected
        if (!hasThirdPartyConsent()) return;

        // Facebook Pixel
        if (integrations.fb_pixel) {
            const b = document;
            if (!window.fbq) {
                const n = function (...args: unknown[]) {
                    if (n.callMethod) {
                        n.callMethod(...args);
                    } else {
                        n.queue.push(args);
                    }
                } as FBQ;
                if (!window._fbq) window._fbq = n;
                n.push = n;
                n.loaded = true;
                n.version = '2.0';
                n.queue = [];
                window.fbq = n;
                const t = b.createElement('script');
                t.async = true;
                t.src = 'https://connect.facebook.net/en_US/fbevents.js';
                const s = b.getElementsByTagName('script')[0];
                s.parentNode?.insertBefore(t, s);
            }
            window.fbq('init', DOMPurify.sanitize(integrations.fb_pixel));
            window.fbq('track', 'PageView');
        }

        // TikTok Pixel
        if (integrations.tt_pixel) {
            window.ttq = window.ttq || ([] as unknown as TTQ);
            const ttq = window.ttq;
            ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
            ttq.setAndDefer = function (t: TTQ, e: string) {
                t[e] = function (...args: unknown[]) {
                    t._i[e] = t._i[e] || [];
                    t._i[e].push(args);
                };
            };
            ttq.load = function (e: string) {
                const i = "https://analytics.tiktok.com/i18n/pixel/events.js";
                ttq._i = ttq._i || {};
                ttq._i[e] = [];
                ttq._t = ttq._t || {};
                ttq._t[e] = +new Date();
                const o = document.createElement("script");
                o.type = "text/javascript"; o.async = true;
                o.src = i + "?sdkid=" + e + "&lib=ttq";
                const a = document.getElementsByTagName("script")[0];
                a.parentNode?.insertBefore(o, a);
            };
            ttq.load(DOMPurify.sanitize(integrations.tt_pixel));
            ttq.page();
        }

        // Google Analytics 4
        if (integrations.ga4_id) {
            window.dataLayer = window.dataLayer || [];
            if (!window.gtag) {
                window.gtag = function (...args: unknown[]) { 
                  window.dataLayer.push(args); 
                } as GTag;
            }
            
            const gtag = window.gtag;

            // Initialize Consent Mode v2 BEFORE loading the script
            const hasConsent = hasThirdPartyConsent();
            const consentValue = hasConsent ? 'granted' : 'denied';

            gtag('consent', 'default', {
                'ad_storage': consentValue,
                'ad_user_data': consentValue,
                'ad_personalization': consentValue,
                'analytics_storage': consentValue,
                'wait_for_update': 500
            });

            gtag('js', new Date());
            gtag('config', DOMPurify.sanitize(integrations.ga4_id), {
                send_page_view: false // Manual tracking on route change
            });

            // Prevent multiple script injections
            const existingScript = document.querySelector(`script[src*="gtag/js?id=${integrations.ga4_id}"]`);
            if (!existingScript) {
                const script = document.createElement('script');
                script.async = true;
                script.src = `https://www.googletagmanager.com/gtag/js?id=${integrations.ga4_id}`;
                const firstScript = document.getElementsByTagName('script')[0];
                firstScript.parentNode?.insertBefore(script, firstScript);
            }
        }
        // Yandex Metrika
        if (integrations.yandex_metrika) {
            const d = document;
            window.yandex_metrika_callbacks2 = window.yandex_metrika_callbacks2 || [];
            window.yandex_metrika_callbacks2.push(function () {
                try {
                    window.ym = window.ym || function (...args: unknown[]) { (window.ym.a = window.ym.a || []).push(args) };
                    window.ym.l = 1 * new Date().getTime();
                    window.ym(DOMPurify.sanitize(integrations.yandex_metrika!), "init", {
                        clickmap: true,
                        trackLinks: true,
                        accurateTrackBounce: true,
                        webvisor: true
                    });
                } catch (err) {
                    console.error('Yandex Metrika error:', err);
                }
            });

            const n = d.getElementsByTagName("script")[0];
            const s = d.createElement("script");
            const f = function () { n.parentNode?.insertBefore(s, n); };
            s.type = "text/javascript";
            s.async = true;
            s.src = "https://mc.yandex.ru/metrika/tag.js";

            if (window.opera === "[object Opera]") {
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
        if (integrations.yandex_metrika && window.ym) {
            window.ym(DOMPurify.sanitize(integrations.yandex_metrika), 'hit', window.location.href);
        }
    }, [pathname, integrations]);

    return null;
}
