import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Briefcase from 'lucide-react/dist/esm/icons/briefcase';
import Users from 'lucide-react/dist/esm/icons/users';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import { MagneticButton } from './MagneticButton';
import { Badge } from '@/components/ui/badge';

interface HeroProp {
    onStart: () => void;
    onExamples: () => void;
}

function useScrollParallax() {
    const [style1, setStyle1] = useState<React.CSSProperties>({});
    const [style2, setStyle2] = useState<React.CSSProperties>({});
    const [opacityStyle, setOpacityStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                const sy = window.scrollY;
                setStyle1({ transform: `translateY(${(sy / 500) * 150}px) rotate(-2deg)`, willChange: 'transform' });
                setStyle2({ transform: `translateY(${(sy / 500) * -100}px) rotate(4deg)`, willChange: 'transform' });
                setOpacityStyle({ opacity: Math.max(0, 1 - sy / 300), willChange: 'opacity' });
                ticking = false;
            });
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return { style1, style2, opacityStyle };
}

export const HeroSectionExpert = ({ onStart, onExamples }: HeroProp) => {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const { style1, style2, opacityStyle } = useScrollParallax();

    return (
        <section ref={containerRef} className="relative min-h-[100dvh] flex flex-col justify-center overflow-hidden py-24 px-4 sm:px-6 lg:px-8">
            
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-background/80 pointer-events-none" />
            <div className="absolute top-1/4 left-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[150px] pointer-events-none" />

            <div className="container relative z-10 mx-auto max-w-7xl">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                    
                    {/* Left Column: Copywriting */}
                    <div className="flex flex-col items-start text-left max-w-2xl">
                        
                        <Badge variant="outline" className="mb-6 h-9 px-4 text-xs font-semibold glass backdrop-blur-md border-primary/20 text-primary gap-2 shadow-sm rounded-full">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {t('landing.expert.badge', '🇰🇿 Сделано для экспертов Казахстана')}
                        </Badge>
                        
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 tracking-tight leading-[1.1]">
                            <span className="block text-foreground mb-2">{t('landing.expert.title1', 'Сайт + CRM + запись')}</span>
                            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-primary animate-[gradient-shift_8s_ease_infinite] bg-[length:200%_auto]">
                                {t('landing.expert.title2', 'в одном приложении.')}
                            </span>
                        </h1>

                        <p className="text-lg sm:text-xl text-muted-foreground/90 mb-8 leading-relaxed max-w-xl">
                            {t('landing.expert.subtitle', 'AI создаст вашу страницу за 2 минуты. Клиенты записываются онлайн, заявки приходят в Telegram. Бесплатно навсегда.')}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                            <MagneticButton
                                onClick={onStart}
                                size="lg"
                                className="h-14 px-8 rounded-2xl text-base font-bold bg-primary text-primary-foreground shadow-lg hover:shadow-primary/25 hover:-translate-y-1 transition-all"
                            >
                                {t('landing.expert.ctaPrimary', 'Создать страницу бесплатно')}
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </MagneticButton>
                            
                            <button
                                onClick={onExamples}
                                className="h-14 px-8 rounded-2xl text-base font-semibold bg-secondary/50 hover:bg-secondary border border-border/50 transition-all flex items-center justify-center gap-2"
                            >
                                <Users className="h-4 w-4" />
                                {t('landing.expert.ctaSecondary', 'Посмотреть примеры')}
                            </button>
                        </div>
                        
                        <div className="mt-8 flex items-center gap-4 text-sm font-medium text-muted-foreground">
                            <div className="flex -space-x-2">
                                {[1,2,3,4].map((i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted overflow-hidden">
                                        <img 
                                            src={`https://i.pravatar.cc/100?img=${i + 10}`} 
                                            alt="User" 
                                            {...(i === 1 ? { fetchPriority: "high" } as any : {})}
                                        />
                                    </div>
                                ))}
                            </div>
                            <p>{t('landing.expert.usersCountLabel', 'Уже используют')} <strong className="text-foreground">50+</strong> {t('landing.expert.usersCountSuffix', 'специалистов')}</p>
                        </div>
                    </div>

                    {/* Right Column: Visual Showcase (Liquid Glass Phone) */}
                    <div className="relative hidden lg:block h-[600px] w-full perspective-[1000px]">
                        {/* Main Phone Mockup */}
                        <div style={style1} className="absolute inset-0 flex items-center justify-center z-20">
                            <div className="w-[300px] h-[600px] rounded-[3rem] p-3 glass backdrop-blur-2xl shadow-2xl relative border border-white/20 dark:border-white/10 flex flex-col overflow-hidden bg-background/50">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-50 flex items-center justify-center">
                                    <div className="w-16 h-1.5 rounded-full bg-white/20" />
                                </div>
                                <div className="flex-1 rounded-[2.25rem] bg-background border border-border/50 overflow-hidden relative shadow-inner">
                                    {/* CRM UI Mockup */}
                                    <div className="p-4 pt-10 space-y-4">
                                        <div className="h-12 w-full rounded-2xl bg-primary/10 flex items-center px-4 gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                                <Briefcase className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="h-3 w-20 bg-foreground/20 rounded mb-1" />
                                                <div className="h-2 w-12 bg-foreground/10 rounded" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="h-16 w-full rounded-xl bg-muted/50 border border-border/50 p-3 flex gap-3 items-center">
                                                     <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                        <Phone className="w-4 h-4 text-blue-500" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="h-3 w-full max-w-[120px] bg-foreground/20 rounded mb-1.5" />
                                                        <div className="h-2 w-20 bg-foreground/10 rounded" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 w-full h-24 bg-gradient-to-t from-background to-transparent" />
                                </div>
                            </div>
                        </div>

                        {/* Floating elements */}
                        <div style={style2} className="absolute right-0 top-20 w-48 p-4 rounded-2xl glass backdrop-blur-xl border border-white/20 shadow-xl z-30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <span className="text-xl">💰</span>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-0.5">{t('landing.expert.mockupNewPayment', 'Новая оплата')}</p>
                                    <p className="text-sm font-bold text-foreground">+150,000 ₸</p>
                                </div>
                            </div>
                        </div>

                        <div style={{...style2, animationDelay: '0.5s'}} className="absolute left-0 bottom-32 w-56 p-4 rounded-2xl glass backdrop-blur-xl border border-white/20 shadow-xl z-30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <Smartphone className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Smart Draft CRM</p>
                                    <p className="text-sm font-bold text-foreground">{t('landing.expert.mockupDraftGenerated', 'Ответ сгенерирован')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll Indicator */}
            <div style={opacityStyle} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-muted-foreground/50">{t('landing.expert.scrollDown', 'Прокрутите вниз')}</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-primary/50 to-transparent animate-pulse" />
            </div>

            <style>{`@keyframes gradient-shift{0%,100%{background-position:0% center}50%{background-position:100% center}}`}</style>
        </section>
    );
};
