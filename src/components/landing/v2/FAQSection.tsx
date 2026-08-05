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
        'Вы попадаете в мастер создания страницы. Если указали короткий адрес на лендинге, он передаётся в signup flow.'
      ),
    },
  ];

  return (
    <SectionWrapper id="faq" className="bg-[#f6f6f1] py-12 md:py-16">
      <div className="mx-auto max-w-[900px]">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold tracking-[-0.035em] text-[#101318] md:text-[42px] md:leading-[1.08]">
            {t('landing.faq.title', 'Коротко перед стартом')}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-[#62675f]">
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
                  'overflow-hidden rounded-[20px] border bg-white transition-all',
                  isOpen ? 'border-[#ff5701] shadow-[0_16px_40px_rgba(16,19,24,0.10)]' : 'border-[#ded9c9]'
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f6f6f1] sm:px-6 sm:py-5"
                  aria-expanded={isOpen}
                >
                  <span className="pr-2 text-sm font-semibold text-[#101318] sm:text-base">{faq.q}</span>
                  <ChevronDown
                    className={cn('h-5 w-5 shrink-0 text-[#ff5701] transition-transform duration-200', isOpen && 'rotate-180')}
                  />
                </button>
                <div className={cn('grid transition-all duration-200 ease-out', isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-6 text-[#62675f] sm:px-6">{faq.a}</p>
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
