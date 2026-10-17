import React from 'react';
import { useTranslation } from 'react-i18next';
import type { FAQBlock as FAQBlockType } from '@/types/page';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { getI18nText } from '@/lib/i18n-helpers';
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle';
import { BlockShell, SectionHeader } from './shells/BlockShell';
import { parseRichText } from '@/lib/rich-text-parser';

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
      {title && <SectionHeader className="px-5 pt-4 mb-1" icon={<HelpCircle className="h-4 w-4" />} title={title} />}

      <Accordion type="single" collapsible className="w-full divide-y divide-border/60 px-5 py-1">
        {block.items.map((item, index) => {
          const question = getI18nText(item.question, currentLang);
          const answer = getI18nText(item.answer, currentLang);
          // Seeded and AI-made pages store items without ids; Radix needs a value to open one.
          const value = item.id || `faq-${index}`;

          return (
            <AccordionItem key={value} value={value} className="border-0">
              <AccordionTrigger className="gap-3 py-4 text-left text-[15px] font-semibold text-foreground hover:no-underline">
                {question}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line break-words">
                {parseRichText(answer)}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
});
