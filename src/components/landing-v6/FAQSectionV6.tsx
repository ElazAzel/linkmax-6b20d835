import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useTranslation } from 'react-i18next';
import { ChevronDown } from "lucide-react";
import { useEffect } from 'react';

export default function FAQSectionV6() {
    const { t } = useTranslation();

    const faqs = (t('landing.v6.faq.items', { returnObjects: true }) as { question: string, answer: string }[]);

    // Inject JSON-LD via useEffect to avoid React DOM conflicts
    useEffect(() => {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                }
            }))
        });
        document.head.appendChild(script);
        return () => {
            document.head.removeChild(script);
        };
    }, [faqs]);

    return (
        <section className="py-24 bg-background relative overflow-hidden" id="faq">
            <div className="container px-4 md:px-6 mx-auto max-w-4xl relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                        {t('landing.v6.faq.title')}
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        {t('landing.v6.faq.subtitle')}
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-card border border-border rounded-xl overflow-hidden"
                        >
                            <Collapsible>
                                <CollapsibleTrigger className="flex items-center justify-between w-full p-6 text-left font-medium text-lg hover:bg-muted/50 transition-colors [&[data-state=open]>svg]:rotate-180">
                                    {faq.question}
                                    <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-200 shrink-0 ml-4" />
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                    <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                                        {faq.answer}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                    ))}
                </div>
            </div>

            {/* Decorative background element */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -z-10 pointer-events-none" />
        </section>
    );
}
