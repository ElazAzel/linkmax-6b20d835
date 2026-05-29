import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FAQBlock as FAQBlockType } from '@/types/page';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getI18nText } from '@/lib/i18n-helpers';
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle';
import { BlockShell, SectionHeader } from './shells/BlockShell';

interface FAQBlockProps {
  block: FAQBlockType;
}

export const FAQBlock = React.memo(function FAQBlock({ block }: FAQBlockProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as 'ru' | 'en' | 'kk';

  const title = block.title ? getI18nText(block.title, currentLang) : '';

  if (!block.items || block.items.length === 0) {
    return (
      <BlockShell variant="quiet" padding="md" className="text-center text-muted-foreground text-sm">
        {t('blocks.faq.empty', 'Добавьте вопросы и ответы')}
      </BlockShell>
    );
  }

  return (
    <div
      className="w-full"
      style={{
        backgroundColor: block.blockStyle?.backgroundColor,
        backgroundImage: block.blockStyle?.backgroundGradient,
      }}
    >
      {title && <SectionHeader icon={<HelpCircle className="h-4 w-4" />} title={title} />}

      <Accordion type="single" collapsible className="w-full space-y-2">
        {block.items.map((item) => {
          const question = getI18nText(item.question, currentLang);
          const answer = getI18nText(item.answer, currentLang);

          return (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="qb-card px-5 transition-shadow data-[state=open]:shadow-lift"
            >
              <AccordionTrigger className="text-left text-sm font-medium hover:no-underline py-4 gap-3 text-foreground data-[state=open]:text-primary">
                {question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground pb-4 leading-relaxed">
                {answer}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
});
