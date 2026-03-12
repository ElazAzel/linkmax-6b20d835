import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Star from 'lucide-react/dist/esm/icons/star';
import { useTranslation } from "react-i18next";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils/utils";
import { SectionWrapper } from '@/components/shared/SectionWrapper';

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
        <SectionWrapper className="overflow-hidden z-10 bg-background">
            {/* Subtle background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

            <div className="container px-4 mx-auto relative">
                <Reveal>
                    <h2 className="text-section-title text-center mb-4">
                        {t('landing.testimonials.title', 'Loved by')}{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">{t('landing.testimonials.count', '2,000+')}</span>{' '}
                        {t('landing.testimonials.suffix', 'Creators')}
                    </h2>
                </Reveal>
                <Reveal delay={100}>
                    <p className="text-center text-muted-foreground mb-12 max-w-lg mx-auto">
                        {t('landing.testimonials.subtitle', 'Experts, coaches, and small businesses trust LinkMAX to grow.')}
                    </p>
                </Reveal>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                    {testimonials.map((testimonial, i) => (
                        <Reveal key={i} delay={i * 100}>
                            <div className="glass backdrop-blur-3xl border-white/5 rounded-[2rem] p-8 flex flex-col gap-5 transition-all duration-500 hover:-translate-y-2 hover:bg-white/10 shadow-glass group h-full">
                                <div className="flex gap-1 text-primary drop-shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]">
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                                    ))}
                                </div>
                                <p className="text-sm md:text-base leading-relaxed text-foreground/70 font-medium italic">
                                    "{testimonial.content}"
                                </p>
                                <div className="flex items-center gap-4 mt-auto">
                                    <Avatar className="h-10 w-10 border border-white/10 rounded-xl">
                                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-black rounded-xl">{testimonial.avatar}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="text-sm font-black tracking-tight">{testimonial.name}</div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-primary/60">{testimonial.role}</div>
                                    </div>
                                </div>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </SectionWrapper>
    );
};