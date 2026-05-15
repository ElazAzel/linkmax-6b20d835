import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import { SectionWrapper } from '@/components/shared/SectionWrapper';
import { cn } from '@/lib/utils/utils';
import DOMPurify from 'dompurify';

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
        'Starter — 0 ₸/мес + 5% с продаж только когда вы зарабатываете. Pro — 2 900 ₸/мес + 1% комиссия. Никаких подключений, абонентских плат и сюрпризов в счёте.'
      ),
    },
    {
      q: t('landing.faq.q2', 'Чем вы отличаетесь от Linktree или amoCRM?'),
      a: t(
        'landing.faq.a2',
        'Linktree — это просто список ссылок без CRM, оплат и записи. amoCRM/Bitrix — тяжёлые системы за 15 000+ ₸/мес, требующие месяцев настройки. LinkMAX даёт вам страницу + приём заявок + мини-CRM + онлайн-запись за 15 минут.'
      ),
    },
    {
      q: t('landing.faq.q3', 'Сколько времени занимает запуск?'),
      a: t(
        'landing.faq.a3',
        '15 минут с AI-конструктором. Ответьте на 3 вопроса о вашем бизнесе — Gemini AI сам сгенерирует тексты, услуги, цены и блоки. Дальше остаётся только подключить Telegram-бота для заявок.'
      ),
    },
    {
      q: t('landing.faq.q4', 'Заявки приходят сразу или с задержкой?'),
      a: t(
        'landing.faq.a4',
        'Заявка с вашей страницы попадает в Telegram-бот в течение 3-5 секунд. Без email-задержек, без spam-фильтров. Среднее время ответа клиенту у наших экспертов — 4 минуты.'
      ),
    },
    {
      q: t('landing.faq.q5', 'Можно ли использовать свой домен?'),
      a: t(
        'landing.faq.a5',
        'Да, на Pro-тарифе вы подключаете свой домен (например, masterolga.kz) одним кликом. Также убирается брендинг LinkMAX. SSL-сертификат настраивается автоматически.'
      ),
    },
    {
      q: t('landing.faq.q6', 'Подходит ли для салона красоты / коуча / репетитора?'),
      a: t(
        'landing.faq.a6',
        'Да. У нас работают парикмахеры, барбершопы, косметологи, нутрициологи, репетиторы, фитнес-тренеры, фотографы и десятки других ниш. Для каждой есть готовые AI-пресеты страниц.'
      ),
    },
    {
      q: t('landing.faq.q7', 'Что будет с моими данными если я закрою аккаунт?'),
      a: t(
        'landing.faq.a7',
        'Все ваши контакты, заявки и страницы можно выгрузить в CSV в один клик. Данные хранятся в защищённой базе с шифрованием и автоматическими бэкапами.'
      ),
    },
  ];

  return (
    <SectionWrapper id="faq" className="overflow-hidden z-10 bg-transparent">
      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-section-title mb-4">
            {t('landing.faq.title', 'Частые')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/70">
              {t('landing.faq.titleHighlight', 'вопросы')}
            </span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg">
            {t('landing.faq.subtitle', 'Всё что нужно знать перед стартом')}
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className={cn(
                  'glass rounded-2xl border border-border/30 overflow-hidden transition-all duration-300',
                  isOpen && 'border-primary/30 shadow-glass'
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between gap-4 text-left hover:bg-primary/5 transition-colors"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-bold text-foreground pr-2">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-5 h-5 text-primary shrink-0 transition-transform duration-300',
                      isOpen && 'rotate-180'
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'grid transition-all duration-300 ease-out',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 sm:px-6 pb-5 text-sm text-muted-foreground leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* SEO: JSON-LD FAQPage schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqs.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            })),
          }}
        />
      </div>
    </SectionWrapper>
  );
};
