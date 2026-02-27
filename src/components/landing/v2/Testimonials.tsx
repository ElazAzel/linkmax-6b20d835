import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Star from 'lucide-react/dist/esm/icons/star';
import { useTranslation } from "react-i18next";

export const Testimonials = () => {
    const { t } = useTranslation();

    const testimonials = [
        {
            name: "Alex R.",
            role: t('landing.v2.testimonials.roles.coach', 'Fitness Coach'),
            content: t('landing.v2.testimonials.reviews.coach', "I set up my page in 3 minutes while at the gym. Got my first client an hour later. The AI just gets it."),
            avatar: "AR"
        },
        {
            name: "Sarah C.",
            role: t('landing.v2.testimonials.roles.artist', 'Digital Artist'),
            content: t('landing.v2.testimonials.reviews.artist', "The aesthetics are on another level. It doesn't look like a generic link-in-bio. It looks like a custom website."),
            avatar: "SC"
        },
        {
            name: "Marcus J.",
            role: t('landing.v2.testimonials.roles.crypto', 'Crypto Analyst'),
            content: t('landing.v2.testimonials.reviews.crypto', "Direct Telegram leads changed my workflow. No more checking emails. I close deals in the chat."),
            avatar: "MJ"
        },
        {
            name: "Elena V.",
            role: t('landing.v2.testimonials.roles.salon', 'Beauty Salon Owner'),
            content: t('landing.v2.testimonials.reviews.salon', "My clients love how easy it is to book. And I love the analytics. I finally know where my traffic comes from."),
            avatar: "EV"
        }
    ];

    return (
        <section className="py-20 relative overflow-hidden z-10 bg-background">
            <div className="container px-4 mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold text-center mb-12">
                    {t('landing.v2.testimonials.title', 'Loved by')}{' '}
                    <span className="text-primary">{t('landing.v2.testimonials.count', '2,000+')}</span>{' '}
                    {t('landing.v2.testimonials.suffix', 'Creators')}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {testimonials.map((testimonial, i) => (
                        <div
                            key={i}
                            className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-4 transition-transform duration-200 hover:-translate-y-1"
                        >
                            <div className="flex gap-1 text-primary">
                                {[...Array(5)].map((_, j) => (
                                    <Star key={j} className="w-4 h-4 fill-current" />
                                ))}
                            </div>
                            <p className="text-sm leading-relaxed text-muted-foreground flex-grow">
                                "{testimonial.content}"
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <Avatar className="h-8 w-8 border border-primary/20">
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{testimonial.avatar}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="text-sm font-bold">{testimonial.name}</div>
                                    <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
