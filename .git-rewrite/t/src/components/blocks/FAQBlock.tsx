import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FAQBlock as FAQBlockType } from '@/types/page';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getTranslatedString } from '@/lib/i18n-helpers';

interface FAQBlockProps {
  block: FAQBlockType;
}

export const FAQBlock = React.memo(function FAQBlock({ block }: FAQBlockProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as 'ru' | 'en' | 'kk';

  const title = block.title ? getTranslatedString(block.title, currentLang) : '';

  if (!block.items || block.items.length === 0) {
    return (
      <Card className="w-full bg-card border-border shadow-sm">
        <CardContent className="p-6 text-center text-muted-foreground">
          {t('blocks.faq.empty', 'Добавьте вопросы и ответы')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-3">
      {title && (
        <h3 className="text-xl font-semibold text-center">{title}</h3>
      )}
      
      <Accordion type="single" collapsible className="w-full space-y-2">
        {block.items.map((item, index) => {
          const question = getTranslatedString(item.question, currentLang);
          const answer = getTranslatedString(item.answer, currentLang);
          
          return (
            <AccordionItem 
              key={item.id} 
              value={item.id}
              className="bg-card border border-border rounded-lg px-4 shadow-sm"
            >
              <AccordionTrigger className="text-left font-medium hover:no-underline">
                {question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {answer}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
});
