import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Play from 'lucide-react/dist/esm/icons/play';
import { MagneticButton } from './MagneticButton';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/utils';

interface HeroProp {
    onStart: () => void;
    onExamples: () => void;
}

export const HeroSection = ({ onStart, onExamples }: HeroProp) => {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollY } = useScroll();

    // Parallax effects (scroll-driven, don't block initial paint)
    const y1 = useTransform(scrollY, [0, 500], [0, 200]);
    const y2 = useTransform(scrollY, [0, 500], [0, -150]);
    const opacity = useTransform(scrollY, [0, 300], [1, 0]);

    return (
        <section ref={containerRef} className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden py-20">
            {/* Background Aurora */}
            <div className="absolute inset-0 bg-aurora opacity-60 dark:opacity-40" />

            {/* Animated Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            {/* Floating 3D Elements (Decorative) — parallax only, no initial hide */}
            <motion.div style={{ y: y1, rotate: -5 }} className="absolute left-[5%] top-[20%] w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hidden lg:flex items-center justify-center shadow-glass-lg animate-float-slow">
                <Zap className="w-10 h-10 text-yellow-400" />
            </motion.div>
            <motion.div style={{ y: y2, rotate: 10 }} className="absolute right-[10%] top-[15%] w-32 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hidden lg:flex items-center justify-center shadow-glass-lg animate-float">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
            </motion.div>

            <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center">

                {/* Badge — render immediately for Speed Index */}
                <div className="mb-8">
                    <Badge variant="outline" className="h-8 px-4 py-1 text-sm bg-background/50 backdrop-blur-md border-primary/20 text-primary gap-2 shadow-sm hover:bg-background/80 transition-colors cursor-default">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="font-medium">{t('landing.v4.hero.badge', 'AI-Powered • No Code • 2 Mins')}</span>
                    </Badge>
                </div>

                {/* Headline — render immediately for LCP */}
                <h1
                    className="max-w-4xl text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[1.1] md:leading-[1.1]"
                >
                    <span className="block text-foreground">{t('landing.v4.hero.titleStart', 'Build pages that')}</span>
                    <span className="block mt-2 pb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
                        {t('landing.v4.hero.titleEnd', 'actually convert')}
                    </span>
                </h1>

                {/* Subtitle — render immediately for Speed Index */}
                <p className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
                    {t('landing.v4.hero.subtitle', 'The all-in-one platform for creators and micro-businesses. AI builds the structure, you get the leads.')}
                </p>

                {/* CTA Buttons — render immediately for Speed Index */}
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center">
                    <MagneticButton
                        onClick={onStart}
                        size="lg"
                        className="h-14 px-8 rounded-2xl text-lg font-semibold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 min-w-[200px]"
                    >
                        {t('landing.v4.hero.cta', 'Start for Free')}
                        <ArrowRight className="w-5 h-5 ml-1" />
                    </MagneticButton>

                    <MagneticButton
                        onClick={onExamples}
                        variant="outline"
                        size="lg"
                        className="h-14 px-8 rounded-2xl text-lg font-medium bg-background/50 backdrop-blur-sm border-input hover:bg-accent/50 min-w-[200px]"
                    >
                        <Play className="w-4 h-4 mr-2 fill-current" />
                        {t('landing.v4.hero.secondary', 'See Examples')}
                    </MagneticButton>
                </div>

                {/* Trust Indicators — render immediately */}
                <div className="mt-16 pt-8 border-t border-border/10 w-full max-w-sm md:max-w-2xl">
                    <div className="flex justify-between items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="flex items-center gap-2"><Smartphone className="w-5 h-5" /> <span className="text-xs font-semibold">{t('landing.v4.hero.mobileFirst', 'Mobile First')}</span></div>
                        <div className="flex items-center gap-2"><BarChart3 className="w-5 h-5" /> <span className="text-xs font-semibold">{t('landing.v4.hero.analytics', 'Analytics')}</span></div>
                        <div className="flex items-center gap-2"><Globe className="w-5 h-5" /> <span className="text-xs font-semibold">{t('landing.v4.hero.seoReady', 'SEO Ready')}</span></div>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator — scroll-driven opacity, no initial hide */}
            <motion.div
                style={{ opacity }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50">{t('landing.v4.hero.scroll', 'Scroll')}</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-primary/50 to-transparent" />
            </motion.div>
        </section>
    );
};
