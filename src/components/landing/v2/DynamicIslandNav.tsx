import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
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
    const brandPrefix = t('landing.short.brandPrefix', 'lnk');
    const brandAccent = t('landing.short.brandAccent', 'mx');

    // Desktop: inline nav, no expandable menu
    if (!isMobile) {
        return (
            <div
                className={cn(
                    "fixed top-6 inset-x-0 z-50 flex justify-center pointer-events-none transition-transform duration-300 ease-in-out",
                    hidden ? "-translate-y-[100px]" : "translate-y-0"
                )}
            >
                <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-card/95 px-2 py-1.5 shadow-[0_16px_40px_rgba(16,19,24,0.12)] backdrop-blur-xl">
                    <span className="cursor-default px-4 font-bold tracking-tight text-foreground">
                        {brandPrefix}<span className="text-muted-foreground">{brandAccent}</span>
                    </span>

                    <nav className="flex items-center gap-1">
                        {[
                            { href: '#outcomes', label: t('landing.revenue.nav.outcomes', 'Результат') },
                            { href: '#workflow', label: t('landing.revenue.nav.workflow', 'Как работает') },
                            { href: '#examples', label: t('landing.revenue.nav.examples', 'Для кого') },
                            { href: '#pricing', label: t('landing.revenue.nav.pricing', 'Тарифы') },
                        ].map(({ href, label }) => (
                            <button
                                key={href}
                                onClick={() => scrollTo(href)}
                                className="min-h-11 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                            >
                                {label}
                            </button>
                        ))}
                    </nav>

                    <div className="mx-1 h-5 w-px bg-border" />

                    <Suspense fallback={null}>
                        <LanguageSwitcher />
                    </Suspense>

                    <Button
                        variant="ghost"
                        size="sm"
                        className="min-h-11 rounded-full px-3 text-xs font-semibold text-muted-foreground hover:bg-background hover:text-foreground"
                        onClick={onLogin}
                    >
                        {t('landing.v2.nav.login', 'Войти')}
                    </Button>
                    <Button
                        size="sm"
                        className="min-h-11 rounded-full bg-foreground px-4 text-xs font-semibold text-background hover:bg-foreground/90 hover:text-background"
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
                "fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none px-4 transition-transform duration-300 ease-in-out",
                hidden ? "-translate-y-[100px]" : "translate-y-0"
            )}
        >
            <div
                className={cn(
                    "pointer-events-auto relative flex w-full max-w-md flex-col items-center overflow-hidden border border-border bg-card/95 shadow-[0_16px_40px_rgba(16,19,24,0.12)] backdrop-blur-xl transition-all duration-300 ease-out",
                    expanded ? "rounded-card" : "rounded-full"
                )}
            >
                {/* Compact bar */}
                <div className="flex items-center justify-between w-full h-12 px-2 pl-4 gap-2 shrink-0">
                    <span className="cursor-default text-sm font-bold tracking-tight text-foreground">
                        {brandPrefix}<span className="text-muted-foreground">{brandAccent}</span>
                    </span>

                    {!expanded ? (
                        <div className="flex items-center gap-1 animate-in fade-in duration-200">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="min-h-11 rounded-full px-2.5 text-xs font-semibold text-muted-foreground hover:bg-background hover:text-foreground"
                                onClick={onLogin}
                            >
                                {t('landing.v2.nav.login', 'Войти')}
                            </Button>
                            <Button
                                size="sm"
                                className="min-h-11 rounded-full bg-foreground px-3 text-xs font-semibold text-background hover:bg-foreground/90 hover:text-background"
                                onClick={onSignup}
                            >
                                {t('landing.short.nav.create', 'Создать')}
                            </Button>
                            <button
                                onClick={() => setExpanded(true)}
                                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                                aria-label={t('landing.v2.nav.openMenu', 'Открыть меню')}
                            >
                                <Menu className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setExpanded(false)}
                            className="z-20 rounded-full p-2 text-muted-foreground transition-colors animate-in fade-in spin-in-90 duration-200 hover:bg-background hover:text-foreground"
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
                                    { href: '#outcomes', label: t('landing.revenue.nav.outcomes', 'Результат') },
                                    { href: '#workflow', label: t('landing.revenue.nav.workflow', 'Как работает') },
                                    { href: '#examples', label: t('landing.revenue.nav.examples', 'Для кого') },
                                    { href: '#pricing', label: t('landing.revenue.nav.pricing', 'Тарифы') },
                                ].map(({ href, label }) => (
                                    <a
                                        key={href}
                                        href={href}
                                        onClick={(e) => { e.preventDefault(); scrollTo(href); setExpanded(false); }}
                                        className="block border-b border-border py-2.5 text-base font-medium text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {label}
                                    </a>
                                ))}
                            </nav>

                            <Suspense fallback={null}>
                                <LanguageSwitcher />
                            </Suspense>

                            <div className="h-px w-full bg-border" />

                            <div className="flex flex-col gap-2">
                                <Button
                                    className="h-11 w-full justify-between rounded-xl border border-border bg-card text-foreground hover:bg-background"
                                    variant="outline"
                                    onClick={() => { onLogin(); setExpanded(false); }}
                                >
                                    {t('landing.v2.nav.login', 'Войти')}
                                </Button>
                                <Button
                                    className="h-11 w-full justify-between rounded-xl bg-foreground text-background hover:bg-foreground/90 hover:text-background"
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
