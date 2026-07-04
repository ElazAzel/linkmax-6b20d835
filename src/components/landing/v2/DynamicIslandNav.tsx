import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { cn } from '@/lib/utils/utils';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import Menu from 'lucide-react/dist/esm/icons/menu';
import X from 'lucide-react/dist/esm/icons/x';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { useIsMobile } from '@/hooks/ui/use-mobile';

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
                    "fixed top-6 inset-x-0 z-50 flex justify-center pointer-events-none transition-transform duration-300 ease-in-out",
                    hidden ? "-translate-y-[100px]" : "translate-y-0"
                )}
            >
                <div className="bg-black/80 dark:bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto rounded-full px-2 py-1.5 flex items-center gap-1">
                    <span className="font-bold text-white tracking-tight px-4 cursor-default">
                        lnk<span className="text-primary">mx</span>
                    </span>

                    <nav className="flex items-center gap-1">
                        {[
                            { href: '#features', label: t('landing.v2.nav.features', 'Возможности') },
                            { href: '#demo', label: t('landing.v2.nav.howItWorks', 'Как работает') },
                            { href: '#pricing', label: t('landing.v2.nav.pricing', 'Тарифы') },
                        ].map(({ href, label }) => (
                            <button
                                key={href}
                                onClick={() => scrollTo(href)}
                                className="text-sm text-white/60 hover:text-white transition-colors px-3 py-1.5 rounded-full hover:bg-white/10"
                            >
                                {label}
                            </button>
                        ))}
                    </nav>

                    <div className="w-px h-5 bg-white/10 mx-1" />

                    <Suspense fallback={null}>
                        <LanguageSwitcher />
                    </Suspense>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-white/70 hover:text-white hover:bg-white/10 rounded-full px-3 text-xs"
                        onClick={onLogin}
                    >
                        {t('landing.v2.nav.login', 'Войти')}
                    </Button>
                    <Button
                        size="sm"
                        className="h-8 bg-white text-black hover:bg-white/90 rounded-full px-4 text-xs font-semibold"
                        onClick={onSignup}
                    >
                        {t('landing.v2.nav.getStarted', 'Начать')}
                    </Button>
                </div>
            </div>
        );
    }

    // Mobile: compact pill with expandable menu (CSS transitions, no framer-motion)
    return (
        <div
            className={cn(
                "fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none px-4 transition-transform duration-300 ease-in-out",
                hidden ? "-translate-y-[100px]" : "translate-y-0"
            )}
        >
            <div
                className={cn(
                    "relative bg-black/80 dark:bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto overflow-hidden max-w-md w-full flex flex-col items-center transition-all duration-300 ease-out",
                    expanded ? "rounded-[20px]" : "rounded-full"
                )}
            >
                {/* Compact bar */}
                <div className="flex items-center justify-between w-full h-12 px-2 pl-4 gap-2 shrink-0">
                    <span className="font-bold text-white tracking-tight cursor-default text-sm">
                        lnk<span className="text-primary">mx</span>
                    </span>

                    {!expanded ? (
                        <div className="flex items-center gap-1 animate-in fade-in duration-200">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-white/70 hover:text-white hover:bg-white/10 rounded-full px-2.5 text-xs"
                                onClick={onLogin}
                            >
                                {t('landing.v2.nav.login', 'Войти')}
                            </Button>
                            <Button
                                size="sm"
                                className="h-7 bg-white text-black hover:bg-white/90 rounded-full px-3 text-xs font-semibold"
                                onClick={onSignup}
                            >
                                {t('landing.v2.nav.start', 'Начать')}
                            </Button>
                            <button
                                onClick={() => setExpanded(true)}
                                className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors"
                                aria-label={t('landing.v2.nav.openMenu', 'Открыть меню')}
                            >
                                <Menu className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setExpanded(false)}
                            className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors z-20 animate-in fade-in spin-in-90 duration-200"
                            aria-label={t('landing.v2.nav.closeMenu', 'Закрыть меню')}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Expanded content - CSS grid transition for smooth height */}
                <div
                    className="grid transition-all duration-300 ease-out w-full"
                    style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
                >
                    <div className="overflow-hidden">
                        <div className="px-5 pb-5 pt-1 flex flex-col gap-4">
                            <nav className="flex flex-col gap-1">
                                {[
                                    { href: '#features', label: t('landing.v2.nav.features', 'Возможности') },
                                    { href: '#demo', label: t('landing.v2.nav.howItWorks', 'Как работает') },
                                    { href: '#pricing', label: t('landing.v2.nav.pricing', 'Тарифы') },
                                ].map(({ href, label }) => (
                                    <a
                                        key={href}
                                        href={href}
                                        onClick={(e) => { e.preventDefault(); scrollTo(href); setExpanded(false); }}
                                        className="text-base font-medium text-white/60 hover:text-white transition-colors py-2.5 block border-b border-white/5"
                                    >
                                        {label}
                                    </a>
                                ))}
                            </nav>

                            <Suspense fallback={null}>
                                <LanguageSwitcher />
                            </Suspense>

                            <div className="h-px bg-white/10 w-full" />

                            <div className="flex flex-col gap-2">
                                <Button
                                    className="w-full justify-between bg-white/10 hover:bg-white/20 text-white border-none h-11 rounded-xl"
                                    variant="outline"
                                    onClick={() => { onLogin(); setExpanded(false); }}
                                >
                                    {t('landing.v2.nav.login', 'Войти')}
                                </Button>
                                <Button
                                    className="w-full justify-between h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                                    onClick={() => { onSignup(); setExpanded(false); }}
                                >
                                    {t('landing.v2.nav.startFree', 'Начать бесплатно')}
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
