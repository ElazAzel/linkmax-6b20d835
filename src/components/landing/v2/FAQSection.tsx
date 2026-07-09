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
      q: t('landing.faq.q1', 'Сколько стоит реально, без скрытых платежей?'),
      a: t(
        'landing.faq.a1',
        'Starter - 0 ₸/мес + 5% с продаж только когда вы зарабатываете. Pro - 2 900 ₸/мес + 1% комиссия. Никаких подключений, абонентских плат и сюрпризов в счете.'
      ),
    },
    {
      q: t('landing.faq.q2', 'Чем вы отличаетесь от Linktree или amoCRM?'),
      a: t(
        'landing.faq.a2',
        'Linktree - это список ссылок без CRM, оплат и записи. amoCRM/Bitrix - тяжелые системы за 15 000+ ₸/мес, требующие месяцев настройки. LinkMAX дает страницу, прием заявок, мини-CRM и онлайн-запись за 15 минут.'
      ),
    },
    {
      q: t('landing.faq.q3', 'Сколько времени занимает запуск?'),
      a: t(
        'landing.faq.a3',
        '15 минут с AI-конструктором. Ответьте на 3 вопроса о вашем бизнесе - Gemini AI сам сгенерирует тексты, услуги, цены и блоки. Дальше остается подключить Telegram-бота для заявок.'
      ),
    },
    {
      q: t('landing.faq.q4', 'Заявки приходят сразу или с задержкой?'),
      a: t(
        'landing.faq.a4',
        'Заявка с вашей страницы попадает в Telegram-бот в течение 3-5 секунд. Без email-задержек, без spam-фильтров.'
      ),
    },
    {
      q: t('landing.faq.q5', 'Можно ли использовать свой домен?'),
      a: t(
        'landing.faq.a5',
        'Да, на Pro-тарифе вы подключаете свой домен одним кликом. Также убирается брендинг LinkMAX. SSL-сертификат настраивается автоматически.'
      ),
    },
    {
      q: t('landing.faq.q6', 'Подходит ли для салона красоты / коуча / репетитора?'),
      a: t(
        'landing.faq.a6',
        'Да. У нас работают парикмахеры, барбершопы, косметологи, нутрициологи, репетиторы, фитнес-тренеры, фотографы и десятки других ниш.'
      ),
    },
    {
      q: t('landing.faq.q7', 'Что будет с моими данными если я закрою аккаунт?'),
      a: t(
        'landing.faq.a7',
        'Все ваши контакты, заявки и страницы можно выгрузить в CSV в один клик. Данные хранятся в защищенной базе с шифрованием и автоматическими бэкапами.'
      ),
    },
  ];

  return (
    <SectionWrapper id="faq" className="bg-white py-20 md:py-24">
      <div className="mx-auto max-w-[900px]">
        <div className="mb-12 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#2563eb]">FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#172033] md:text-[42px] md:leading-[1.12]">
            {t('landing.faq.title', 'Частые')}{' '}
            <span className="text-[#2563eb]">{t('landing.faq.titleHighlight', 'вопросы')}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#6b7689]">
            {t('landing.faq.subtitle', 'Все что нужно знать перед стартом')}
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.q}
                className={cn(
                  'overflow-hidden rounded-[18px] border bg-white transition-all',
                  isOpen ? 'border-[#2563eb] shadow-[0_16px_40px_rgba(23,32,51,0.10)]' : 'border-[#d8dee8]'
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-[#f6f7f9] sm:px-6 sm:py-5"
                  aria-expanded={isOpen}
                >
                  <span className="pr-2 text-sm font-semibold text-[#172033] sm:text-base">{faq.q}</span>
                  <ChevronDown
                    className={cn('h-5 w-5 shrink-0 text-[#2563eb] transition-transform duration-200', isOpen && 'rotate-180')}
                  />
                </button>
                <div className={cn('grid transition-all duration-200 ease-out', isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-6 text-[#6b7689] sm:px-6">{faq.a}</p>
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
