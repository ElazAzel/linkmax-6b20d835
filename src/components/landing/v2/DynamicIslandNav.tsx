import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { cn } from '@/lib/utils/utils';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import Menu from 'lucide-react/dist/esm/icons/menu';
import X from 'lucide-react/dist/esm/icons/x';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { useIsMobile } from '@/hooks/ui/use-mobile';
import { BrandLogo } from '@/components/brand/BrandLogo';

// Lazy load LanguageSwitcher вЂ” it imports dropdown-menu, switch, input, scroll-area
// which are not needed until user interacts with the nav
const LanguageSwitcher = lazy(() => import('@/components/translation/LanguageSwitcher').then(m => ({ default: m.LanguageSwitcher })));

interface NavProps {
    onLogin: () => void;
    onSignup: () => void;
}

const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
};

/**
 * Scroll-hide hook using passive listener + rAF (no forced reflow).
 */
function useScrollHide(expanded: boolean) {
    const [hidden, setHidden] = useState(false);
    const prevScrollY = useRef(0);

    useEffect(() => {
        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const current = window.scrollY;
                if (current > prevScrollY.current && current > 150 && !expanded) {
                    setHidden(true);
                } else {
                    setHidden(false);
                }
                prevScrollY.current = current;
                ticking = false;
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [expanded]);

    return hidden;
}

export const DynamicIslandNav = ({ onLogin, onSignup }: NavProps) => {
    const [expanded, setExpanded] = useState(false);
    const { t } = useTranslation();
    const isMobile = useIsMobile();
    const hidden = useScrollHide(expanded);
    // Desktop: inline nav, no expandable menu
    if (!isMobile) {
        return (
            <div
                className={cn(
                    "fixed top-0 inset-x-0 z-50 flex justify-center border-b border-brand-ink/15 bg-brand-canvas/95 px-4 pointer-events-none transition-transform duration-300 ease-in-out sm:px-6",
                    hidden ? "-translate-y-[100px]" : "translate-y-0"
                )}
            >
                <div className="pointer-events-auto flex w-full max-w-[1180px] items-center gap-1 bg-transparent px-1 py-3">
                    <button type="button" onClick={() => scrollTo('#hero')} className="mr-3 px-2 py-1" aria-label="LinkMAX">
                        <BrandLogo className="h-7" />
                    </button>

                    <nav className="flex items-center gap-1">
                        {[
                            { href: '#features', label: t('landing.short.nav.what', 'Р§С‚Рѕ СЌС‚Рѕ') },
                            { href: '#how-it-works', label: t('landing.short.nav.how', 'РљР°Рє СЂР°Р±РѕС‚Р°РµС‚') },
                            { href: '#faq', label: t('landing.short.nav.faq', 'FAQ') },
                        ].map(({ href, label }) => (
                            <button
                                key={href}
                                onClick={() => scrollTo(href)}
                                className="rounded-md px-3 py-1.5 text-sm font-medium text-brand-ink/70 transition-colors hover:bg-brand-canvas hover:text-brand-ink"
                            >
                                {label}
                            </button>
                        ))}
                    </nav>

                    <div className="mx-1 h-5 w-px bg-brand-ink/15" />

                    <Suspense fallback={null}>
                        <LanguageSwitcher />
                    </Suspense>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-md px-3 text-xs font-semibold text-brand-ink/75 hover:bg-brand-canvas hover:text-brand-ink"
                        onClick={onLogin}
                    >
                        {t('landing.v2.nav.login', 'Р’РѕР№С‚Рё')}
                    </Button>
                    <Button
                        size="sm"
                        className="h-8 rounded-md bg-brand-coral px-4 text-xs font-semibold text-white hover:bg-brand-coral/90"
                        onClick={onSignup}
                    >
                        {t('landing.short.nav.create', 'РЎРѕР·РґР°С‚СЊ')}
                    </Button>
                </div>
            </div>
        );
    }

    // Mobile: compact pill with expandable menu (CSS transitions, no framer-motion)
    return (
        <div
            className={cn(
                "fixed top-0 inset-x-0 z-50 flex justify-center pointer-events-none transition-transform duration-300 ease-in-out",
                hidden ? "-translate-y-[100px]" : "translate-y-0"
            )}
        >
            <div className="pointer-events-auto mt-2 w-[calc(100%-1.5rem)] max-w-[420px] overflow-hidden rounded-2xl border border-brand-ink/15 bg-brand-canvas/95 shadow-sm">
                <div className="flex items-center justify-between px-4 py-2.5">
                    <button type="button" onClick={() => scrollTo('#hero')} className="px-1 py-1" aria-label="LinkMAX">
                        <BrandLogo className="h-6" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setExpanded((v) => !v)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-ink"
                        aria-label={expanded ? 'Close menu' : 'Open menu'}
                        aria-expanded={expanded}
                    >
                        {expanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>

                <div
                    className="grid transition-all duration-300 ease-in-out"
                    style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
                >
                    <div className="overflow-hidden">

                        <div className="px-5 pb-5 pt-1 flex flex-col gap-4">
                            <nav className="flex flex-col gap-1">
                                {[
                                    { href: '#features', label: t('landing.short.nav.what', 'Р§С‚Рѕ СЌС‚Рѕ') },
                                    { href: '#how-it-works', label: t('landing.short.nav.how', 'РљР°Рє СЂР°Р±РѕС‚Р°РµС‚') },
                                    { href: '#faq', label: t('landing.short.nav.faq', 'FAQ') },
                                ].map(({ href, label }) => (
                                    <a
                                        key={href}
                                        href={href}
                                        onClick={(e) => { e.preventDefault(); scrollTo(href); setExpanded(false); }}
                                        className="block border-b border-brand-ink/10 py-2.5 text-base font-medium text-brand-ink/75 transition-colors hover:text-brand-ink"
                                    >
                                        {label}
                                    </a>
                                ))}
                            </nav>

                            <Suspense fallback={null}>
                                <LanguageSwitcher />
                            </Suspense>

                            <div className="h-px w-full bg-brand-ink/10" />

                            <div className="flex flex-col gap-2">
                                <Button
                                    className="h-11 w-full justify-between rounded-md border border-brand-ink/20 bg-white text-brand-ink hover:bg-brand-canvas"
                                    variant="outline"
                                    onClick={() => { onLogin(); setExpanded(false); }}
                                >
                                    {t('landing.v2.nav.login', 'Р’РѕР№С‚Рё')}
                                </Button>
                                <Button
                                    className="h-11 w-full justify-between rounded-md bg-brand-coral text-white hover:bg-brand-coral/90"
                                    onClick={() => { onSignup(); setExpanded(false); }}
                                >
                                    {t('landing.short.nav.createFree', 'РЎРѕР·РґР°С‚СЊ Р±РµСЃРїР»Р°С‚РЅРѕ')}
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
