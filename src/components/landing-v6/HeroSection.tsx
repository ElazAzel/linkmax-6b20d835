import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';

export default function HeroSection() {
    const { t } = useTranslation();

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-12">
            {/* Ambient Auras */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-float-slow pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px] animate-float pointer-events-none delay-1000" />

            <div className="container px-4 md:px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                    {/* Text Content */}
                    <div className="text-left space-y-8">
                        <Reveal delay={100}>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 text-primary text-sm font-medium border border-primary/10 mb-6">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                </span>
                                {t('landing.v6.hero.badge')}
                            </div>
                        </Reveal>

                        <Reveal delay={200}>
                            <h1 className="font-heading text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9]">
                                {t('landing.v6.hero.titlePrefix')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-violet-500 to-primary animate-gradient-flow bg-[length:200%_auto]">{t('landing.v6.hero.titleHighlight')}</span>
                                {t('landing.v6.hero.titleSuffix', { defaultValue: '' }) ? <><br />{t('landing.v6.hero.titleSuffix')}</> : null}
                                {t('landing.v6.hero.titleBrand', { defaultValue: '' }) ? <><br /><span className="italic font-serif">{t('landing.v6.hero.titleBrand')}</span></> : null}
                            </h1>
                        </Reveal>

                        <Reveal delay={300}>
                            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                                {t('landing.v6.hero.description')}
                            </p>
                        </Reveal>

                        <Reveal delay={400}>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button size="lg" className="h-14 px-8 rounded-full text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300" onClick={() => scrollToSection('pricing')}>
                                    {t('landing.v6.hero.ctaPrimary')}
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                                <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-lg border-2 hover:bg-muted/50 transition-all duration-300" onClick={() => scrollToSection('features')}>
                                    {t('landing.v6.hero.ctaSecondary')}
                                </Button>
                            </div>
                        </Reveal>

                        <Reveal delay={500}>
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    <span>{t('landing.v6.hero.noCard')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                    <span>{t('landing.v6.hero.cancelAnytime')}</span>
                                </div>
                            </div>
                        </Reveal>
                    </div>

                    {/* Visual Content - Off-axis overlapping cards */}
                    <div className="relative hidden lg:block h-[800px] w-full perspective-[2000px]">
                        <Reveal delay={600} className="w-full h-full relative">
                            {/* Card 1: Stats */}
                            <div className="absolute top-[15%] right-[5%] w-[280px] bg-card/80 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-glass-lg rotate-[-6deg] animate-float z-20">
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                                        $
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{t('landing.v6.hero.cardRevenue.label')}</p>
                                        <p className="text-xl font-bold font-heading">{t('landing.v6.hero.cardRevenue.value')}</p>
                                    </div>
                                </div>
                                <div className="h-24 bg-gradient-to-t from-green-500/10 to-transparent rounded-xl border border-green-500/20 relative overflow-hidden">
                                    <div className="absolute bottom-0 left-0 right-0 h-[60%] bg-green-500/20 skew-y-6 transform origin-bottom-left"></div>
                                </div>
                            </div>

                            {/* Card 2: Phone Mockup Main */}
                            <div className="absolute top-[5%] left-[15%] w-[320px] aspect-[9/19] bg-background border-[8px] border-muted rounded-[3rem] shadow-2xl rotate-[3deg] z-10 overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-7 bg-black rounded-b-2xl z-20" />
                                <div className="p-6 pt-12 space-y-4 h-full bg-neutral-50 dark:bg-neutral-900 pointer-events-none select-none">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-violet-500 mx-auto shadow-lg" />
                                    <div className="text-center space-y-2">
                                        <div className="h-4 w-32 bg-foreground/10 mx-auto rounded-full" />
                                        <div className="h-3 w-48 bg-foreground/5 mx-auto rounded-full" />
                                    </div>
                                    <div className="space-y-3 pt-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-14 w-full bg-white dark:bg-black/20 rounded-2xl border border-foreground/5 shadow-sm p-3 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-foreground/5" />
                                                <div className="h-3 w-24 bg-foreground/10 rounded-full" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Floating UI Elements */}
                            <div className="absolute bottom-[20%] left-[-5%] bg-white dark:bg-neutral-800 p-4 rounded-2xl shadow-xl flex items-center gap-3 rotate-[5deg] animate-float-slow z-30">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">{t('landing.v6.hero.cardLead.title')}</p>
                                    <p className="text-xs text-muted-foreground">{t('landing.v6.hero.cardLead.subtitle')}</p>
                                </div>
                            </div>
                        </Reveal>
                    </div>
                </div>
            </div>
        </section>
    );
}
