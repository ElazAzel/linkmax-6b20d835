import { useTranslation } from 'react-i18next';
import { Users, Eye, Star, Zap } from 'lucide-react';

export default function TrustSectionV6() {
    const { t } = useTranslation();

    const stats = [
        { icon: Users, value: '2,000+', label: t('landingV5.trust.speed.title') },
        { icon: Eye, value: '500K+', label: t('landingV5.trust.mobile.title') },
        { icon: Star, value: '4.9', label: t('landingV5.trust.noCommission.title') },
        { icon: Zap, value: '<2', label: t('landingV5.trust.speed.description') },
    ];

    return (
        <section className="py-10 border-y border-border/40 bg-muted/20">
            <div className="container px-4 md:px-6 max-w-5xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                    {stats.map((stat, i) => (
                        <div key={i} className="flex flex-col items-center text-center gap-2">
                            <stat.icon className="w-5 h-5 text-primary mb-1" />
                            <span className="text-2xl md:text-3xl font-bold font-heading">{stat.value}</span>
                            <span className="text-xs text-muted-foreground">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
