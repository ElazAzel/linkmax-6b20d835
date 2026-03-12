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
        <section ref={containerRef} className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden py-20 px-4">
            {/* Minimal overlays to let CanvasBackground shine through */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background/60 pointer-events-none" />

            {/* Radial glow behind headline - refined for 2026 */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[160px] pointer-events-none" />

            {/* Floating Decorative Elements - Frosted Physicality */}
            <div style={style1} className="absolute left-[8%] top-[25%] w-24 h-24 rounded-3xl glass backdrop-blur-2xl hidden lg:flex items-center justify-center shadow-glass-lg animate-float-slow transition-transform duration-700">
                <Zap className="w-10 h-10 text-yellow-400/80 drop-shadow-sm" />
            </div>
            <div style={style2} className="absolute right-[12%] top-[20%] w-32 h-20 rounded-3xl glass-subtle backdrop-blur-xl hidden lg:flex items-center justify-center shadow-glass-lg animate-float">
                <div className="flex gap-2.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-400/60 shadow-inner" />
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-400/60 shadow-inner" />
                    <div className="w-3.5 h-3.5 rounded-full bg-green-400/60 shadow-inner" />
                </div>
            </div>

            <div className="container relative z-10 flex flex-col items-center text-center">

                {/* Badge - Prismatic & Floating */}
                <div className="mb-10">
                    <Badge variant="outline" className="h-10 px-5 py-2 text-sm glass backdrop-blur-md border-white/20 text-foreground/80 gap-2.5 shadow-glass-lg hover:bg-white/10 transition-all cursor-default scale-110">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="font-semibold tracking-tight">{t('landing.v4.hero.badge', 'The Micro-Business OS')}</span>
                    </Badge>
                </div>

                {/* Headline - Editorial Boldness */}
                <h1 className="max-w-5xl text-display mb-8 tracking-tighter leading-[0.9] text-balance">
                    <span className="block text-foreground drop-shadow-sm">{t('landing.v4.hero.titleStart', 'Website, CRM & Analytics')}</span>
                    <span className="block mt-4 pb-4 text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/70 to-secondary animate-[gradient-shift_5s_ease_infinite] bg-[length:200%_auto]">
                        {t('landing.v4.hero.titleEnd', 'in one place')}
                    </span>
                </h1>

                {/* Subtitle - Refined Contrast */}
                <p className="max-w-xl text-lg md:text-xl text-muted-foreground/90 mb-12 leading-relaxed font-medium">
                    {t('landing.v4.hero.subtitle', 'Page builder, lead management, click analytics. Everything your small business needs - no code required.')}
                </p>

                {/* CTA Buttons - Physical & Magnetic */}
                <div className="flex flex-col gap-6 w-full sm:w-auto items-center">
                    <MagneticButton
                        onClick={onStart}
                        size="lg"
                        className="h-16 px-10 rounded-[2rem] text-xl font-bold shadow-2xl shadow-primary/30 bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all min-w-[240px]"
                    >
                        {t('landing.v4.hero.cta', 'Start for Free')}
                        <ArrowRight className="w-6 h-6 ml-2" />
                    </MagneticButton>

                    <button
                        onClick={onExamples}
                        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground/70 hover:text-primary transition-all group"
                    >
                        <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                        <span className="uppercase tracking-widest">{t('landing.v4.hero.secondary', 'See Examples')}</span>
                    </button>
                </div>

                {/* Animated Stats Strip */}
                <div className="mt-16 pt-8 border-t border-border/10 w-full max-w-sm md:max-w-2xl">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col items-center gap-1 group">
                            <Layers className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
                            <span className="text-lg md:text-xl font-bold text-foreground tabular-nums"><AnimatedCount target={28} suffix="+" /></span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-0 truncate">{t('landing.v4.hero.trust1', 'Smart Blocks')}</span>
                        </div>
                        <div className="w-px h-10 bg-border/20" />
                        <div className="flex flex-col items-center gap-1 group">
                            <Users className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
                            <span className="text-lg md:text-xl font-bold text-foreground tabular-nums"><AnimatedCount target={2000} suffix="+" /></span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-0 truncate">{t('landing.v4.hero.trust2', 'Creators')}</span>
                        </div>
                        <div className="w-px h-10 bg-border/20" />
                        <div className="flex flex-col items-center gap-1 group">
                            <Globe className="w-5 h-5 text-primary/60 group-hover:text-primary transition-colors" />
                            <span className="text-lg md:text-xl font-bold text-foreground tabular-nums"><AnimatedCount target={40} suffix="+" /></span>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider min-w-0 truncate">{t('landing.v4.hero.trust3', 'Languages')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div
                style={opacityStyle}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
                <span className="text-xs uppercase tracking-widest text-muted-foreground/50">{t('landing.v4.hero.scroll', 'Scroll')}</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-primary/50 to-transparent animate-pulse" />
            </div>

            <style>{`@keyframes gradient-shift{0%,100%{background-position:0% center}50%{background-position:100% center}}`}</style>
        </section>
    );
};