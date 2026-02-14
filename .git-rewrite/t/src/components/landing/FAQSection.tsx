import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';
import { useScrollAnimation } from './hooks/useScrollAnimation';
import { useMarketingAnalytics } from '@/hooks/useMarketingAnalytics';

export function FAQSection() {
  const { t } = useTranslation();
  const sectionAnimation = useScrollAnimation();
  const { trackMarketingEvent } = useMarketingAnalytics();

  const faqItems = [
    {
      question: t('landing.faq.q1.question'),
      answer: t('landing.faq.q1.answer')
    },
    {
      question: t('landing.faq.q2.question'),
      answer: t('landing.faq.q2.answer')
    },
    {
      question: t('landing.faq.q3.question'),
      answer: t('landing.faq.q3.answer')
    },
    {
      question: t('landing.faq.q4.question'),
      answer: t('landing.faq.q4.answer')
    },
    {
      question: t('landing.faq.q5.question'),
      answer: t('landing.faq.q5.answer')
    },
    {
      question: t('landing.faq.q6.question'),
      answer: t('landing.faq.q6.answer')
    },
    {
      question: t('landing.faq.q7.question'),
      answer: t('landing.faq.q7.answer')
    },
    {
      question: t('landing.faq.q8.question'),
      answer: t('landing.faq.q8.answer')
    },
    {
      question: t('landing.faq.q9.question'),
      answer: t('landing.faq.q9.answer')
    },
    {
      question: t('landing.faq.q10.question'),
      answer: t('landing.faq.q10.answer')
    },
    {
      question: t('landing.faq.q11.question'),
      answer: t('landing.faq.q11.answer')
    },
    {
      question: t('landing.faq.q12.question'),
      answer: t('landing.faq.q12.answer')
    },
    {
      question: t('landing.faq.q13.question'),
      answer: t('landing.faq.q13.answer')
    },
    {
      question: t('landing.faq.q14.question'),
      answer: t('landing.faq.q14.answer')
    }
  ];

  return (
    <section ref={sectionAnimation.ref} className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background pointer-events-none" />
      
      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="text-center mb-10 sm:mb-14 lg:mb-20 space-y-4 sm:space-y-5">
          <div 
            className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-xs sm:text-sm font-medium opacity-0 ${sectionAnimation.isVisible ? 'animate-fade-in' : ''}`}
          >
            <HelpCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
            <span className="text-primary">{t('landing.faq.badge')}</span>
          </div>
          <h2 
            className={`text-2xl sm:text-4xl lg:text-[3.5rem] font-extrabold tracking-[-0.02em] leading-tight opacity-0 ${sectionAnimation.isVisible ? 'animate-blur-in' : ''}`}
            style={{ animationDelay: '150ms' }}
          >
            {t('landing.faq.title')}
          </h2>
          <p 
            className={`text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl mx-auto opacity-0 font-normal ${sectionAnimation.isVisible ? 'animate-fade-in-up' : ''}`}
            style={{ animationDelay: '300ms' }}
          >
            {t('landing.faq.subtitle')}
          </p>
        </div>

        <div 
          className={`opacity-0 ${sectionAnimation.isVisible ? 'animate-fade-in-up' : ''}`}
          style={{ animationDelay: '400ms' }}
        >
          <Accordion
            type="single"
            collapsible
            className="w-full space-y-3 sm:space-y-4"
            onValueChange={(value) => {
              if (!value) return;
              trackMarketingEvent({
                eventType: 'faq_expand',
                metadata: { item: value },
              });
            }}
          >
            {faqItems.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="rounded-2xl bg-card/50 backdrop-blur-xl border border-border/40 px-5 sm:px-6 overflow-hidden hover:border-primary/30 transition-colors"
              >
                <AccordionTrigger className="text-left py-5 sm:py-6 hover:no-underline group">
                  <span className="font-semibold text-base sm:text-lg group-hover:text-primary transition-colors pr-2">
                    {item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 sm:pb-6 leading-relaxed text-sm sm:text-base">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
