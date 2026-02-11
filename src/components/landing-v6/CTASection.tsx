import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Reveal } from '@/components/motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function CTASection() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <section className="py-32 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute inset-0 bg-primary/5 -z-20" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-[radial-gradient(ellipse_at_center,theme(colors.primary.DEFAULT/0.1),transparent_70%)] -z-10" />

            <div className="container px-4 md:px-6 max-w-4xl mx-auto text-center">
                <Reveal delay={0} direction="up">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
                        <Sparkles className="w-4 h-4" />
                        <span>{t('landing.v6.cta.badge')}</span>
                    </div>
                </Reveal>

                <Reveal delay={100} direction="up">
                    <h2 className="font-heading text-4xl md:text-6xl font-bold tracking-tight mb-8 text-foreground pb-2">
                        {t('landing.v6.cta.titlePrefix')}<br />
                        <span className="text-primary">{t('landing.v6.cta.titleSuffix')}</span>
                    </h2>
                </Reveal>

                <Reveal delay={200} direction="up">
                    <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                        {t('landing.v6.cta.description')}
                    </p>
                </Reveal>

                <Reveal delay={300} direction="up">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            size="lg"
                            onClick={() => navigate('/auth')}
                            className="h-14 px-10 rounded-full text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 w-full sm:w-auto"
                        >
                            {t('landing.v6.cta.primary')}
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            onClick={() => navigate('/gallery')}
                            className="h-14 px-10 rounded-full text-lg font-medium bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-background/80 w-full sm:w-auto"
                        >
                            {t('landing.v6.cta.secondary')}
                        </Button>
                    </div>
                </Reveal>

                <Reveal delay={400} direction="up" className="mt-12">
                    <p className="text-sm text-muted-foreground/60">
                        {t('landing.v6.cta.note')}
                    </p>
                </Reveal>
            </div>
        </section>
    );
}
