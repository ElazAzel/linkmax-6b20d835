import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { cn } from '@/lib/utils/utils';

interface FAQItem {
  q: string;
  a: string;
}

export const FAQSection = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FAQItem[] = [
    {
      q: t('landing.faq.q1', 'Это бесплатно?'),
      a: t(
        'landing.faq.a1',
        'Да, страницу можно создать бесплатно. Платные возможности нужны, когда вы подключаете больше страниц, домен, расширенную аналитику или снижаете комиссию.'
      ),
    },
    {
      q: t('landing.faq.q2', 'Нужно ли уметь делать сайты?'),
      a: t(
        'landing.faq.a2',
        'Нет. Вы вводите короткий адрес, отвечаете на несколько вопросов, а AI собирает основу страницы. Тексты и блоки можно менять вручную.'
      ),
    },
    {
      q: t('landing.faq.q3', 'Чем это отличается от Linktree или Taplink?'),
      a: t(
        'landing.faq.a3',
        'LinkMAX не ограничивается списком ссылок. Внутри есть заявки, запись, инвойсы, мини-CRM, аналитика и рабочая зона для бизнеса.'
      ),
    },
    {
      q: t('landing.faq.q4', 'Что происходит после регистрации?'),
      a: t(
        'landing.faq.a4',
        'После входа откроется главная кабинета. Редактор запускается только при создании новой страницы или по прямой ссылке.'
      ),
    },
  ];

  return (
    <SectionWrapper id="faq" className="bg-brand-canvas py-14 md:py-16">
      <div className="mx-auto max-w-[900px]">
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl font-semibold leading-tight text-brand-ink md:text-4xl">
            {t('landing.faq.title', 'Коротко перед стартом')}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-brand-sage">
            {t('landing.faq.subtitle', 'Без длинной презентации: только то, что нужно знать перед созданием страницы.')}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.q}
                className={cn(
                  'overflow-hidden rounded-lg border bg-white transition-colors',
                  isOpen ? 'border-brand-coral' : 'border-brand-ink/15'
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex min-h-14 w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-brand-canvas sm:px-6"
                  aria-expanded={isOpen}
                >
                  <span className="pr-2 text-sm font-semibold text-brand-ink sm:text-base">{faq.q}</span>
                  <ChevronDown
                    className={cn('h-5 w-5 shrink-0 text-brand-coral transition-transform duration-200', isOpen && 'rotate-180')}
                  />
                </button>
                <div className={cn('grid transition-all duration-200 ease-out', isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-6 text-brand-sage sm:px-6">{faq.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.q,
                acceptedAnswer: { '@type': 'Answer', text: faq.a },
              })),
            }),
          }}
        />
      </div>
    </SectionWrapper>
  );
};
