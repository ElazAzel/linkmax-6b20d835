import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { cn } from '@/lib/utils/utils';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import Menu from 'lucide-react/dist/esm/icons/menu';
import X from 'lucide-react/dist/esm/icons/x';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { useIsMobile } from '@/hooks/ui/use-mobile';
import { BrandLogo } from '@/components/brand/BrandLogo';

// Lazy load LanguageSwitcher — it imports dropdown-menu, switch, input, scroll-area
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
                    "fixed top-0 inset-x-0 z-50 flex justify-center border-b border-[#16131A]/15 bg-[#F4F5F0]/95 px-4 pointer-events-none transition-transform duration-300 ease-in-out sm:px-6",
                    hidden ? "-translate-y-[100px]" : "translate-y-0"
                )}
            >
                <div className="pointer-events-auto flex w-full max-w-[1180px] items-center gap-1 bg-transparent px-1 py-3">
                    <button type="button" onClick={() => scrollTo('#hero')} className="mr-3 px-2 py-1" aria-label="LinkMAX">
                        <BrandLogo className="h-7" />
                    </button>

                    <nav className="flex items-center gap-1">
                        {[
                            { href: '#features', label: t('landing.short.nav.what', 'Что это') },
                            { href: '#how-it-works', label: t('landing.short.nav.how', 'Как работает') },
                            { href: '#faq', label: t('landing.short.nav.faq', 'FAQ') },
                        ].map(({ href, label }) => (
                            <button
                                key={href}
                                onClick={() => scrollTo(href)}
                                className="rounded-md px-3 py-1.5 text-sm font-medium text-[#16131A]/70 transition-colors hover:bg-[#F4F5F0] hover:text-[#16131A]"
                            >
                                {label}
                            </button>
                        ))}
                    </nav>

                    <div className="mx-1 h-5 w-px bg-[#16131A]/15" />

                    <Suspense fallback={null}>
                        <LanguageSwitcher />
                    </Suspense>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 rounded-md px-3 text-xs font-semibold text-[#16131A]/75 hover:bg-[#F4F5F0] hover:text-[#16131A]"
                        onClick={onLogin}
                    >
                        {t('landing.v2.nav.login', 'Войти')}
                    </Button>
                    <Button
                        size="sm"
                        className="h-8 rounded-md bg-[#C93618] px-4 text-xs font-semibold text-white hover:bg-[#A92D16]"
                        onClick={onSignup}
                    >
                        {t('landing.short.nav.create', 'Создать')}
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
            <div
                    style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
                >
                    <div className="overflow-hidden">
                        <div className="px-5 pb-5 pt-1 flex flex-col gap-4">
                            <nav className="flex flex-col gap-1">
                                {[
                                    { href: '#features', label: t('landing.short.nav.what', 'Что это') },
                                    { href: '#how-it-works', label: t('landing.short.nav.how', 'Как работает') },
                                    { href: '#faq', label: t('landing.short.nav.faq', 'FAQ') },
                                ].map(({ href, label }) => (
                                    <a
                                        key={href}
                                        href={href}
                                        onClick={(e) => { e.preventDefault(); scrollTo(href); setExpanded(false); }}
                                        className="block border-b border-[#16131A]/10 py-2.5 text-base font-medium text-[#16131A]/75 transition-colors hover:text-[#16131A]"
                                    >
                                        {label}
                                    </a>
                                ))}
                            </nav>

                            <Suspense fallback={null}>
                                <LanguageSwitcher />
                            </Suspense>

                            <div className="h-px w-full bg-[#16131A]/10" />

                            <div className="flex flex-col gap-2">
                                <Button
                                    className="h-11 w-full justify-between rounded-md border border-[#16131A]/20 bg-white text-[#16131A] hover:bg-[#F4F5F0]"
                                    variant="outline"
                                    onClick={() => { onLogin(); setExpanded(false); }}
                                >
                                    {t('landing.v2.nav.login', 'Войти')}
                                </Button>
                                <Button
                                    className="h-11 w-full justify-between rounded-md bg-[#C93618] text-white hover:bg-[#A92D16]"
                                    onClick={() => { onSignup(); setExpanded(false); }}
                                >
                                    {t('landing.short.nav.createFree', 'Создать бесплатно')}
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
