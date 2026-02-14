import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FAQBlock as FAQBlockType } from '@/types/page';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getI18nText } from '@/lib/i18n-helpers';
import { HelpCircle } from 'lucide-react';

interface FAQBlockProps {
  block: FAQBlockType;
}

export const FAQBlock = React.memo(function FAQBlock({ block }: FAQBlockProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as 'ru' | 'en' | 'kk';

  const title = block.title ? getI18nText(block.title, currentLang) : '';

  if (!block.items || block.items.length === 0) {
    return (
      <div className="w-full p-4 rounded-xl bg-card border border-border text-center text-muted-foreground text-sm">
        {t('blocks.faq.empty', 'Добавьте вопросы и ответы')}
      </div>
    );
  }

  return (
    <div
      className="w-full space-y-2"
      style={{
        backgroundColor: block.blockStyle?.backgroundColor,
        backgroundImage: block.blockStyle?.backgroundGradient,
      }}
    >
      {title && (
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <HelpCircle className="h-4 w-4" />
          </div>
          <h3 className="font-bold text-sm text-gradient">{title}</h3>
        </div>
      )}

      <Accordion type="single" collapsible className="w-full space-y-3">
        {block.items.map((item) => {
          const question = getI18nText(item.question, currentLang);
          const answer = getI18nText(item.answer, currentLang);

          return (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="glass-card backdrop-blur-md border-white/10 rounded-2xl px-5 shadow-glass data-[state=open]:shadow-primary/10 data-[state=open]:border-primary/20 transition-all duration-300"
            >
              <AccordionTrigger className="text-left text-sm font-bold hover:no-underline py-4 gap-3 text-foreground/90 data-[state=open]:text-primary">
                {question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground/80 pb-4 leading-relaxed font-medium">
                {answer}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
});
