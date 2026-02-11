import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
    {
        name: "Alex Rivera",
        role: "Fitness Coach",
        content: "I set up my page in 3 minutes while at the gym. Got my first client an hour later. The AI just gets it.",
        avatar: "AR"
    },
    {
        name: "Sarah Chen",
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
    return (
        <section className="py-20 relative overflow-hidden">
            <div className="container px-4 mx-auto">
                <h2 className="text-3xl md:text-5xl font-bold text-center mb-12">
                    Loved by <span className="text-spotlight">10,000+</span> Creators
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="glass-card p-6 flex flex-col gap-4"
                        >
                            <div className="flex gap-1 text-yellow-500">
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                            </div>
                            <p className="text-sm leading-relaxed text-muted-foreground flex-grow">
                                "{t.content}"
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                                <Avatar className="h-8 w-8 border border-primary/20">
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{t.avatar}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="text-sm font-bold">{t.name}</div>
                                    <div className="text-xs text-muted-foreground">{t.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
