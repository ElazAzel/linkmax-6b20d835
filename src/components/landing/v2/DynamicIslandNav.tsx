import React, { useState } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { cn } from '@/lib/utils/utils';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/translation/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { Menu, X, ArrowRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/ui/use-mobile';

interface NavProps {
    onLogin: () => void;
    onSignup: () => void;
}

const scrollTo = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
};

export const DynamicIslandNav = ({ onLogin, onSignup }: NavProps) => {
    const { scrollY } = useScroll();
    const [hidden, setHidden] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const { t } = useTranslation();
    const isMobile = useIsMobile();

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious() ?? 0;
        if (latest > previous && latest > 150 && !expanded) {
            setHidden(true);
        } else {
            setHidden(false);
        }
    });

    // Desktop: inline nav, no expandable menu
    if (!isMobile) {
        return (
            <motion.div
                variants={{ visible: { y: 0 }, hidden: { y: -100 } }}
                animate={hidden ? "hidden" : "visible"}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="fixed top-6 inset-x-0 z-50 flex justify-center pointer-events-none"
            >
                <div className="bg-black/80 dark:bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto rounded-full px-2 py-1.5 flex items-center gap-1">
                    <span className="font-bold text-white tracking-tight px-4 cursor-default">
                        lnk<span className="text-primary">mx</span>
                    </span>

                    <nav className="flex items-center gap-1">
                        {[
                            { href: '#features', label: t('landing.v2.nav.features', 'Features') },
                            { href: '#demo', label: t('landing.v2.nav.howItWorks', 'How it Works') },
                            { href: '#pricing', label: t('landing.v2.nav.pricing', 'Pricing') },
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

                    <LanguageSwitcher />

                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-white/70 hover:text-white hover:bg-white/10 rounded-full px-3 text-xs"
                        onClick={onLogin}
                    >
                        {t('landing.v2.nav.login', 'Log in')}
                    </Button>
                    <Button
                        size="sm"
                        className="h-8 bg-white text-black hover:bg-white/90 rounded-full px-4 text-xs font-semibold"
                        onClick={onSignup}
                    >
                        {t('landing.v2.nav.getStarted', 'Get Started')}
                    </Button>
                </div>
            </motion.div>
        );
    }

    // Mobile: compact pill with expandable menu
    return (
        <motion.div
            variants={{ visible: { y: 0 }, hidden: { y: -100 } }}
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed top-4 inset-x-0 z-50 flex justify-center pointer-events-none px-4"
        >
            <motion.div
                layout
                animate={{
                    width: expanded ? "100%" : "auto",
                    height: expanded ? "auto" : 48,
                    borderRadius: expanded ? 20 : 32
                }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className="relative bg-black/80 dark:bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto overflow-hidden max-w-md w-full flex flex-col items-center"
            >
                {/* Compact bar */}
                <div className="flex items-center justify-between w-full h-12 px-2 pl-4 gap-2 shrink-0">
                    <span className="font-bold text-white tracking-tight cursor-default text-sm">
                        lnk<span className="text-primary">mx</span>
                    </span>

                    <AnimatePresence mode="popLayout">
                        {!expanded && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-1"
                            >
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-white/70 hover:text-white hover:bg-white/10 rounded-full px-2.5 text-xs"
                                    onClick={onLogin}
                                >
                                    {t('landing.v2.nav.login', 'Log in')}
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-7 bg-white text-black hover:bg-white/90 rounded-full px-3 text-xs font-semibold"
                                    onClick={onSignup}
                                >
                                    {t('landing.v2.nav.start', 'Start')}
                                </Button>
                                <button
                                    onClick={() => setExpanded(true)}
                                    className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors"
                                >
                                    <Menu className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {expanded && (
                            <motion.button
                                initial={{ opacity: 0, rotate: -90 }}
                                animate={{ opacity: 1, rotate: 0 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setExpanded(false)}
                                className="p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors z-20"
                            >
                                <X className="w-4 h-4" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* Expanded content */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, transition: { duration: 0.1 } }}
                            transition={{ delay: 0.1 }}
                            className="w-full px-5 pb-5 pt-1 flex flex-col gap-4"
                        >
                            <nav className="flex flex-col gap-1">
                                {[
                                    { href: '#features', label: t('landing.v2.nav.features', 'Features') },
                                    { href: '#demo', label: t('landing.v2.nav.howItWorks', 'How it Works') },
                                    { href: '#pricing', label: t('landing.v2.nav.pricing', 'Pricing') },
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

                            <LanguageSwitcher />

                            <div className="h-px bg-white/10 w-full" />

                            <div className="flex flex-col gap-2">
                                <Button
                                    className="w-full justify-between bg-white/10 hover:bg-white/20 text-white border-none h-11 rounded-xl"
                                    variant="outline"
                                    onClick={() => { onLogin(); setExpanded(false); }}
                                >
                                    {t('landing.v2.nav.login', 'Log in')}
                                </Button>
                                <Button
                                    className="w-full justify-between h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                                    onClick={() => { onSignup(); setExpanded(false); }}
                                >
                                    {t('landing.v2.nav.startFree', 'Start for Free')}
                                    <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
};
