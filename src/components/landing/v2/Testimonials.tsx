import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";

const testimonials = [
    {
        name: "Alex R.",
        role: "Fitness Coach",
        content: "I set up my page in 3 minutes while at the gym. Got my first client an hour later. The AI just gets it.",
        avatar: "AR"
    },
    {
        name: "Sarah C.",
        role: "Digital Artist",
        content: "The aesthetics are on another level. It doesn't look like a generic link-in-bio. It looks like a custom website.",
        avatar: "SC"
    },
    {
        name: "Marcus J.",
        role: "Crypto Analyst",
        content: "Direct Telegram leads changed my workflow. No more checking emails. I close deals in the chat.",
        avatar: "MJ"
    },
    {
        name: "Elena V.",
        role: "Beauty Salon Owner",
        content: "My clients love how easy it is to book. And I love the analytics. I finally know where my traffic comes from.",
        avatar: "EV"
    }
];

export const Testimonials = () => {
    const { t } = useTranslation();

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
                        <motion.div
                            key={i}
                            initial={{ opacity: 1, y: 0 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -5 }}
                            className="bg-card border border-border/60 rounded-2xl p-6 flex flex-col gap-4"
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
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
