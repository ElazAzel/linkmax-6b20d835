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
        <div className="flex items-center gap-2 px-1 mb-3">
          <HelpCircle className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
      )}
      
      <Accordion type="single" collapsible className="w-full space-y-1.5">
        {block.items.map((item) => {
          const question = getI18nText(item.question, currentLang);
          const answer = getI18nText(item.answer, currentLang);
          
          return (
            <AccordionItem 
              key={item.id} 
              value={item.id}
              className="bg-card border border-border rounded-xl px-4 shadow-sm data-[state=open]:bg-muted/30"
            >
              <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-3 gap-2">
                {question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-3 leading-relaxed">
                {answer}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
});
