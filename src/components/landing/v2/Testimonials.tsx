import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Star from 'lucide-react/dist/esm/icons/star';
import { useTranslation } from "react-i18next";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils/utils";

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.15 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return (
        <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)', transition: `all 0.5s ease ${delay}ms` }}>
            {children}
        </div>
    );
}

export const Testimonials = () => {
    const { t } = useTranslation();

    const testimonials = [
        {
            name: "Alex R.",
            role: t('landing.testimonials.role1', 'Fitness Coach'),
            content: t('landing.testimonials.review1', "I set up my page in 3 minutes while at the gym. Got my first client an hour later. The AI just gets it."),
            avatar: "AR"
        },
        {
            name: "Sarah C.",
            role: t('landing.testimonials.role2', 'Digital Artist'),
            content: t('landing.testimonials.review2', "The aesthetics are on another level. It doesn't look like a generic link-in-bio. It looks like a custom website."),
            avatar: "SC"
        },
        {
            name: "Marcus J.",
            role: t('landing.testimonials.role3', 'Business Owner'),
            content: t('landing.testimonials.review3', "Direct Telegram leads changed my workflow. No more checking emails. I close deals in the chat."),
            avatar: "MJ"
        },
        {
            name: "Elena V.",
            role: t('landing.testimonials.role4', 'Beauty Salon Owner'),
            content: t('landing.testimonials.review4', "My clients love how easy it is to book. And I love the CRM. I finally know where my traffic comes from."),
            avatar: "EV"
        }
    ];

    return (
        <section className="py-20 relative overflow-hidden z-10 bg-background">
            {/* Subtle background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="container px-4 mx-auto relative">
                <Reveal>
                    <h2 className="text-3xl md:text-5xl font-bold text-center mb-4">
                        {t('landing.testimonials.title', 'Loved by')}{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">{t('landing.testimonials.count', '2,000+')}</span>{' '}
                        {t('landing.testimonials.suffix', 'Creators')}
                    </h2>
                </Reveal>
                <Reveal delay={100}>
                    <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
                        {t('landing.testimonials.subtitle', 'Experts, coaches, and small businesses trust lnkmx to grow.')}
                    </p>
                </Reveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {testimonials.map((testimonial, i) => (
                        <Reveal key={i} delay={i * 100}>
                            <div className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 h-full">
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
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>
    );
};