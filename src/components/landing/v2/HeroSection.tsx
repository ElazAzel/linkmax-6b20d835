import { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Play from 'lucide-react/dist/esm/icons/play';
import Users from 'lucide-react/dist/esm/icons/users';
import Eye from 'lucide-react/dist/esm/icons/eye';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import { MagneticButton } from './MagneticButton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

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
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const { style1, style2, style3, opacityStyle } = useScrollParallax();
    const [username, setUsername] = useState('');
    const [isFocused, setIsFocused] = useState(false);

    const handleCreatePage = useCallback(() => {
        if (username.trim()) {
            navigate(`/auth?username=${encodeURIComponent(username.trim())}`);
        } else {
            onStart();
        }
    }, [username, navigate, onStart]);

    return (
        <section ref={containerRef} className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden py-20 px-4">
            {/* Minimal overlays to let CanvasBackground shine through */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/5 to-background/10 pointer-events-none" />

            {/* Dynamic background glow that follows the canvas */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.03] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/[0.02] blur-[100px] pointer-events-none" />
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
                <div className="mb-6 sm:mb-10">
                    <Badge variant="outline" className="h-10 px-5 py-2 text-sm glass backdrop-blur-md border-white/20 text-foreground/80 gap-2.5 shadow-glass-lg hover:bg-white/10 transition-all cursor-default scale-110">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="font-semibold tracking-tight">{t('landing.v4.hero.badge', 'The Micro-Business OS')}</span>
                    </Badge>
                </div>

                {/* Headline - Editorial Boldness */}
                <h1 className="max-w-5xl text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-6 sm:mb-10 tracking-[-0.04em] leading-[0.9] text-balance">
                    <span className="block text-foreground drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)]">{t('landing.v4.hero.titleStart', 'AI-страница за минуту,')}</span>
                    <span className="block mt-3 sm:mt-6 pb-3 sm:pb-6 text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-secondary animate-[gradient-shift_6s_ease_infinite] bg-[length:200%_auto] filter drop-shadow-[0_4px_12px_rgba(var(--primary-rgb),0.3)]">
                        {t('landing.v4.hero.titleEnd', 'клиенты — в Telegram')}
                    </span>
                </h1>

                {/* Subtitle - Refined Contrast */}
                <p className="max-w-xl text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground/80 mb-8 sm:mb-12 leading-relaxed font-semibold tracking-tight px-4 md:px-0">
                    {t('landing.v4.hero.subtitle', 'AI создаёт страницу с прайсом и контактами. Клиент нажимает «Написать» → вы получаете уведомление в Telegram.')}
                </p>

                {/* Username Input CTA */}
                <div className="w-full max-w-md px-4 sm:px-0 relative">
                    <div className="absolute -inset-10 bg-primary/10 blur-[60px] rounded-full opacity-50 pointer-events-none" />
                    <div
                        className={`relative flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl transition-all duration-400 glass backdrop-blur-2xl border shadow-glass-lg ${
                            isFocused
                                ? 'border-primary/50 shadow-glass-xl ring-4 ring-primary/10'
                                : 'border-white/20 hover:border-white/30 hover:shadow-glass-xl'
                        }`}
                    >
                        <div className="flex-shrink-0 pl-3 sm:pl-4 text-muted-foreground font-bold text-sm sm:text-base select-none">
                            lnkmx.my/
                        </div>
                        <Input
                            value={username}
                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                            placeholder={t('landing.hero.usernamePlaceholder', 'yourname')}
                            variant="minimal"
                            className="flex-1 text-lg font-medium placeholder:text-muted-foreground/50 bg-transparent border-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleCreatePage()}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            aria-label="Username"
                        />
                        <MagneticButton
                            onClick={handleCreatePage}
                            size="lg"
                            className="rounded-xl font-black px-5 sm:px-7 bg-primary text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border-none"
                        >
                            <span className="hidden sm:inline mr-2">{t('landing.hero.createPage', 'Создать')}</span>
                            <ArrowRight className="h-5 w-5" />
                        </MagneticButton>
                    </div>

                    <button
                        onClick={onExamples}
                        className="mt-5 inline-flex items-center gap-3 text-xs sm:text-sm font-black text-muted-foreground/50 hover:text-primary transition-all group uppercase tracking-[0.2em] sm:tracking-[0.3em] mx-auto w-full justify-center"
                    >
                        <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary/50 transition-colors">
                            <Play className="w-3 h-3 fill-current group-hover:scale-125 transition-transform duration-500" />
                        </div>
                        {t('landing.v4.hero.secondary', 'Посмотреть примеры')}
                    </button>
                </div>

                {/* Real Stats Strip */}
                <div className="mt-12 md:mt-16 pt-8 border-t border-border/10 w-full max-w-sm md:max-w-2xl px-2">
                    <div className="flex justify-between items-center gap-2">
                        <div className="flex flex-col items-center gap-0.5 md:gap-1 group min-w-0 flex-1">
                            <Eye className="w-4 h-4 md:w-5 md:h-5 text-primary/60 group-hover:text-primary transition-colors" />
                            <span className="text-base md:text-xl font-bold text-foreground tabular-nums"><AnimatedCount target={2400} suffix="+" /></span>
                            <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate w-full text-center">{t('landing.v4.hero.trust1', 'Просмотров')}</span>
                        </div>
                        <div className="w-px h-8 md:h-10 bg-border/20 shrink-0" />
                        <div className="flex flex-col items-center gap-0.5 md:gap-1 group min-w-0 flex-1">
                            <Users className="w-4 h-4 md:w-5 md:h-5 text-primary/60 group-hover:text-primary transition-colors" />
                            <span className="text-base md:text-xl font-bold text-foreground tabular-nums"><AnimatedCount target={50} suffix="+" /></span>
                            <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate w-full text-center">{t('landing.v4.hero.trust2', 'Страниц')}</span>
                        </div>
                        <div className="w-px h-8 md:h-10 bg-border/20 shrink-0" />
                        <div className="flex flex-col items-center gap-0.5 md:gap-1 group min-w-0 flex-1">
                            <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-primary/60 group-hover:text-primary transition-colors" />
                            <span className="text-base md:text-xl font-bold text-foreground tabular-nums"><AnimatedCount target={360} suffix="+" /></span>
                            <span className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate w-full text-center">{t('landing.v4.hero.trust3', 'Заявок/мес')}</span>
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
