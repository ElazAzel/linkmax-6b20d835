import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import { Menu, X, ArrowRight } from 'lucide-react';

interface NavProps {
    onLogin: () => void;
    onSignup: () => void;
}

export const DynamicIslandNav = ({ onLogin, onSignup }: NavProps) => {
    const { scrollY } = useScroll();
    const [hidden, setHidden] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const { t } = useTranslation();

    useMotionValueEvent(scrollY, "change", (latest) => {
        const previous = scrollY.getPrevious();
        if (latest > previous && latest > 150 && !expanded) {
            setHidden(true);
        } else {
            setHidden(false);
        }
    });

    return (
        <motion.div
            variants={{
                visible: { y: 0 },
                hidden: { y: -100 },
            }}
            animate={hidden ? "hidden" : "visible"}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="fixed top-6 inset-x-0 z-50 flex justify-center pointer-events-none"
        >
            <motion.div
                layout
                initial={{ width: "auto", height: "auto", borderRadius: 32 }}
                animate={{
                    width: expanded ? 320 : "auto",
                    height: expanded ? 380 : 54, // Expanded height vs Compact height
                    borderRadius: expanded ? 24 : 32
                }}
                transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 30
                }}
                className={cn(
                    "relative bg-black/80 dark:bg-black/90 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto overflow-hidden max-w-[90vw]",
                    "flex flex-col items-center"
                )}
            >
                {/* Collapsed State Content */}
                <div className="flex items-center justify-between w-full h-[54px] px-2 pl-4 gap-4">
                    <span className="font-bold text-white tracking-tight cursor-default">
                        lnk<span className="text-primary">mx</span>
                    </span>

                    <AnimatePresence mode="popLayout">
                        {!expanded && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="flex items-center gap-2"
                            >
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-white/70 hover:text-white hover:bg-white/10 rounded-full px-3 text-xs"
                                    onClick={onLogin}
                                >
                                    Log in
                                </Button>
                                <Button
                                    size="sm"
                                    className="h-8 bg-white text-black hover:bg-white/90 rounded-full px-4 text-xs font-semibold"
                                    onClick={onSignup}
                                >
                                    Get Started
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

                    {/* Close Button (Only visible when expanded, takes place of menu) */}
                    <AnimatePresence>
                        {expanded && (
                            <motion.button
                                initial={{ opacity: 0, rotate: -90 }}
                                animate={{ opacity: 1, rotate: 0 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setExpanded(false)}
                                className="absolute right-2 top-2.5 p-2 rounded-full hover:bg-white/10 text-white/70 transition-colors z-20"
                            >
                                <X className="w-4 h-4" />
                            </motion.button>
                        )}
                    </AnimatePresence>
                </div>

                {/* Expanded State Content */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, transition: { duration: 0.1 } }}
                            transition={{ delay: 0.1 }}
                            className="w-full px-6 pb-6 pt-2 flex flex-col gap-6"
                        >
                            <nav className="flex flex-col gap-2">
                                <MobileNavLink href="#features" onClick={() => setExpanded(false)}>Features</MobileNavLink>
                                <MobileNavLink href="#demo" onClick={() => setExpanded(false)}>How it Works</MobileNavLink>
                                <MobileNavLink href="#pricing" onClick={() => setExpanded(false)}>Pricing</MobileNavLink>
                            </nav>

                            <div className="flex gap-2">
                                <LanguageSwitcher />
                            </div>

                            <div className="h-[1px] bg-white/10 w-full" />

                            <div className="flex flex-col gap-2">
                                <Button
                                    className="w-full justify-between bg-white/10 hover:bg-white/20 text-white border-none h-12 rounded-xl"
                                    variant="outline"
                                    onClick={() => { onLogin(); setExpanded(false); }}
                                >
                                    Log in
                                </Button>
                                <Button
                                    className="w-full justify-between h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                                    onClick={() => { onSignup(); setExpanded(false); }}
                                >
                                    Start for Free
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

const MobileNavLink = ({ href, children, onClick }: { href: string, children: React.ReactNode, onClick: () => void }) => (
    <a
        href={href}
        onClick={(e) => {
            e.preventDefault();
            const element = document.querySelector(href);
            if (element) element.scrollIntoView({ behavior: 'smooth' });
            onClick();
        }}
        className="text-lg font-medium text-white/60 hover:text-white transition-colors py-2 block border-b border-white/5"
    >
        {children}
    </a>
);
