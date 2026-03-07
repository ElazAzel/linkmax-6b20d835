import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Zap from 'lucide-react/dist/esm/icons/zap';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import Globe from 'lucide-react/dist/esm/icons/globe';
import Play from 'lucide-react/dist/esm/icons/play';
import Users from 'lucide-react/dist/esm/icons/users';
import Layers from 'lucide-react/dist/esm/icons/layers';
import { MagneticButton } from './MagneticButton';
import { Badge } from '@/components/ui/badge';

interface HeroProp {
    onStart: () => void;
    onExamples: () => void;
}

function useScrollParallax() {
    const [style1, setStyle1] = useState<React.CSSProperties>({});
    const [style2, setStyle2] = useState<React.CSSProperties>({});
    const [style3, setStyle3] = useState<React.CSSProperties>({});
    const [opacityStyle, setOpacityStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const sy = window.scrollY;
                setStyle1({ transform: `translateY(${(sy / 500) * 200}px) rotate(-5deg)`, willChange: 'transform' });
                setStyle2({ transform: `translateY(${(sy / 500) * -150}px) rotate(10deg)`, willChange: 'transform' });
                setStyle3({ transform: `translateY(${(sy / 500) * 100}px) rotate(-3deg)`, willChange: 'transform' });
                setOpacityStyle({ opacity: Math.max(0, 1 - sy / 300), willChange: 'opacity' });
                ticking = false;
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return { style1, style2, style3, opacityStyle };
}

/** Animated counter for stats */
function AnimatedCount({ target, suffix = '' }: { target: number; suffix?: string }) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting) {
                let start = 0;
                const step = Math.ceil(target / 40);
                const iv = setInterval(() => {
                    start += step;
                    if (start >= target) { setCount(target); clearInterval(iv); }
                    else setCount(start);
                }, 30);
                obs.disconnect();
            }
        }, { threshold: 0.5 });
        obs.observe(el);
        return () => obs.disconnect();
    }, [target]);

    return <span ref={ref} className="tabular-nums">{count.toLocaleString()}{suffix}</span>;
}

export const HeroSection = ({ onStart, onExamples }: HeroProp) => {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const { style1, style2, style3, opacityStyle } = useScrollParallax();

    return (
        <section ref={containerRef} className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden py-20">
            {/* Background Aurora */}
            <div className="absolute inset-0 bg-aurora opacity-60 dark:opacity-40" />

            {/* Animated Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />

            {/* Radial glow behind headline */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

            {/* Floating Decorative Elements */}
            <div style={style1} className="absolute left-[5%] top-[20%] w-24 h-24 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hidden lg:flex items-center justify-center shadow-glass-lg animate-float-slow">
                <Zap className="w-10 h-10 text-yellow-400" />
            </div>
            <div style={style2} className="absolute right-[10%] top-[15%] w-32 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hidden lg:flex items-center justify-center shadow-glass-lg animate-float">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
            </div>
            <div style={style3} className="absolute left-[8%] bottom-[25%] w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 hidden lg:flex items-center justify-center shadow-glass-lg animate-float">
                <BarChart3 className="w-8 h-8 text-primary/70" />
            </div>

            <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center">

                {/* Badge */}
                <div className="mb-8">
                    <Badge variant="outline" className="h-8 px-4 py-1 text-sm bg-background/50 backdrop-blur-md border-primary/20 text-primary gap-2 shadow-sm hover:bg-background/80 transition-colors cursor-default">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="font-medium">{t('landing.v4.hero.badge', 'The Micro-Business OS')}</span>
                    </Badge>
                </div>

                {/* Headline */}
                <h1 className="max-w-4xl text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6 leading-[1.1] md:leading-[1.1]">
                    <span className="block text-foreground">{t('landing.v4.hero.titleStart', 'Website, CRM & Analytics')}</span>
                    <span className="block mt-2 pb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60 animate-[gradient-shift_4s_ease_infinite] bg-[length:200%_auto]">
                        {t('landing.v4.hero.titleEnd', 'in one place')}
                    </span>
                </h1>

                {/* Subtitle */}
                <p className="max-w-2xl text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed">
                    {t('landing.v4.hero.subtitle', 'Page builder, lead management, click analytics. Everything your small business needs - no code required.')}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col gap-4 w-full sm:w-auto items-center">
                    <MagneticButton
                        onClick={onStart}
                        size="lg"
                        className="h-14 px-8 rounded-2xl text-lg font-semibold shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 min-w-[200px]"
                    >
                        {t('landing.v4.hero.cta', 'Start for Free')}
                        <ArrowRight className="w-5 h-5 ml-1" />
                    </MagneticButton>

                    <button
                        onClick={onExamples}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
                    >
                        <Play className="w-3.5 h-3.5 fill-current group-hover:scale-110 transition-transform" />
                        {t('landing.v4.hero.secondary', 'See Examples')}
                    </button>
                </div>

                {/* Animated Stats Strip */}
                <div className="mt-16 pt-8 border-t border-border/10 w-full max-w-sm md:max-w-2xl">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col items-center gap-1 group">
                            <Layers className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
                            <span className="text-lg md:text-xl font-bold text-foreground"><AnimatedCount target={28} suffix="+" /></span>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-0 truncate">{t('landing.v4.hero.trust1', 'Smart Blocks')}</span>
                        </div>
                        <div className="w-px h-10 bg-border/20" />
                        <div className="flex flex-col items-center gap-1 group">
                            <Users className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
                            <span className="text-lg md:text-xl font-bold text-foreground"><AnimatedCount target={2000} suffix="+" /></span>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-0 truncate">{t('landing.v4.hero.trust2', 'Creators')}</span>
                        </div>
                        <div className="w-px h-10 bg-border/20" />
                        <div className="flex flex-col items-center gap-1 group">
                            <Globe className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
                            <span className="text-lg md:text-xl font-bold text-foreground"><AnimatedCount target={40} suffix="+" /></span>
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider min-w-0 truncate">{t('landing.v4.hero.trust3', 'Languages')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div
                style={opacityStyle}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50">{t('landing.v4.hero.scroll', 'Scroll')}</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-primary/50 to-transparent animate-pulse" />
            </div>

            <style>{`@keyframes gradient-shift{0%,100%{background-position:0% center}50%{background-position:100% center}}`}</style>
        </section>
    );
};