import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { sanitizeSlug } from '@/lib/utils/slug';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import CalendarCheck2 from 'lucide-react/dist/esm/icons/calendar-check-2';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';

interface HeroBentoOSProps {
  onStart: (desiredSlug?: string) => void;
  onExamples: () => void;
}

export function HeroBentoOS({ onStart, onExamples }: HeroBentoOSProps) {
  const { t } = useTranslation();
  const [slug, setSlug] = useState('');

  const cleanSlug = sanitizeSlug(slug);

  const handleSlugChange = (value: string) => {
    setSlug(sanitizeSlug(value));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onStart(cleanSlug || undefined);
  };

  const slugPrefix = t('landing.short.slugPrefix', 'lnkmx.my/');
  const slugHint = t('landing.short.slugHint', 'yourname');

  const useCases = [
    { id: 'profile', label: t('landing.short.useCase1', 'визитка') },
    { id: 'services', label: t('landing.short.useCase2', 'услуги') },
    { id: 'booking', label: t('landing.short.useCase3', 'запись') },
    { id: 'payments', label: t('landing.short.useCase4', 'оплата') },
    { id: 'leads', label: t('landing.short.useCase5', 'заявки') },
  ];

  const previewBlocks = [
    {
      id: 'booking',
      icon: CalendarCheck2,
      title: t('landing.short.preview.bookingTitle', 'Запись'),
      body: t('landing.short.preview.bookingBody', '3 свободных окна сегодня'),
    },
    {
      id: 'lead',
      icon: MessageCircle,
      title: t('landing.short.preview.leadTitle', 'Заявка'),
      body: t('landing.short.preview.leadBody', 'Клиент оставил WhatsApp'),
    },
    {
      id: 'payment',
      icon: CreditCard,
      title: t('landing.short.preview.payTitle', 'Оплата'),
      body: t('landing.short.preview.payBody', 'Инвойс готов к отправке'),
    },
  ];

  return (
    <section className="relative overflow-hidden bg-[#101318] px-4 pb-12 pt-24 text-white sm:px-6 sm:pt-28 lg:px-8 lg:pb-16">
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#ff5701]/[0.18] blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-white/10" />
      </div>

      <div className="relative mx-auto grid min-w-0 max-w-[1120px] gap-8 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
        <div className="min-w-0 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.08] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-white/[0.76]">
            <span className="h-2 w-2 rounded-full bg-[#ff5701]" />
            {t('landing.short.eyebrow', 'Страница, заявки и оплата')}
          </div>

          <h1 className="mt-6 max-w-[10ch] break-words text-[40px] font-semibold leading-[0.96] tracking-[-0.04em] text-white sm:max-w-2xl sm:text-6xl lg:text-[78px] lg:leading-[0.9]">
            {t('landing.short.title', 'Создайте страницу для клиентов за пару минут')}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/[0.72] sm:text-lg">
            {t(
              'landing.short.subtitle',
              'LinkMAX собирает услуги, ссылки, запись, оплату и заявки в одну страницу. Без кода и длинной настройки.'
            )}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 w-full max-w-[360px] sm:max-w-2xl">
            <div className="flex flex-col gap-2 rounded-[22px] border border-white/[0.12] bg-white p-2 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:flex-row">
              <div className="flex h-[52px] min-w-0 flex-1 items-center rounded-[16px] bg-[#f6f6f1] px-4 text-left">
                <span className="shrink-0 text-sm font-semibold text-[#6f746d]">{slugPrefix}</span>
                {!slug && (
                  <span className="pointer-events-none ml-1 text-base font-semibold text-[#a0a59d]" aria-hidden="true">
                    {slugHint}
                  </span>
                )}
                <input
                  value={slug}
                  onChange={(event) => handleSlugChange(event.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-base font-semibold text-[#101318] outline-none"
                  aria-label={t('landing.short.slugAria', 'Короткий адрес страницы')}
                  maxLength={30}
                />
              </div>
              <Button
                type="submit"
                className="h-[52px] rounded-[16px] bg-[#ff5701] px-6 text-base font-semibold text-white shadow-[0_10px_24px_rgba(255,87,1,0.28)] transition-transform hover:-translate-y-0.5 hover:bg-[#e64e00]"
              >
                {t('landing.short.create', 'Создать страницу')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-white/[0.66]">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#ff5701]" />
                {t('landing.short.free', 'Бесплатный старт')}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#ff5701]" />
                {t('landing.short.noCode', 'без кода')}
              </span>
              <button type="button" onClick={onExamples} className="font-semibold text-white underline-offset-4 hover:underline">
                {t('landing.short.examples', 'посмотреть примеры')}
              </button>
            </div>
          </form>
        </div>

        <div className="relative min-h-[430px] lg:min-h-[560px]" aria-hidden="true">
          <div className="absolute right-0 top-2 w-[78%] rounded-[34px] border border-white/[0.12] bg-[#f6f6f1] p-4 text-[#101318] shadow-[0_30px_100px_rgba(0,0,0,0.42)] sm:p-5 lg:right-4 lg:top-8">
            <div className="flex items-center justify-between border-b border-[#d9d7cc] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#101318] text-sm font-black text-white">
                  {t('landing.short.preview.initials', 'LM')}
                </div>
                <div>
                  <div className="text-sm font-bold">{t('landing.short.preview.name', 'Amina Studio')}</div>
                  <div className="text-xs font-medium text-[#6f746d]">{t('landing.short.preview.slug', 'lnkmx.my/amina')}</div>
                </div>
              </div>
              <div className="rounded-full bg-[#ff5701] px-3 py-1 text-xs font-bold text-white">
                {t('landing.short.preview.live', 'online')}
              </div>
            </div>

            <div className="py-5">
              <div className="text-2xl font-semibold tracking-[-0.03em]">
                {t('landing.short.preview.headline', 'Маникюр, запись и оплата в одном месте')}
              </div>
              <div className="mt-3 grid gap-2">
                {previewBlocks.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#101318] text-white">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold">{item.title}</div>
                      <div className="truncate text-xs font-medium text-[#6f746d]">{item.body}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#101318]/40" />
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-[#ff5701] px-4 py-3 text-center text-sm font-bold text-white">
                {t('landing.short.preview.cta', 'Записаться на сегодня')}
              </div>
            </div>
          </div>

          <div className="absolute left-0 top-14 w-[54%] rounded-[26px] border border-white/[0.12] bg-white/[0.92] p-4 text-[#101318] shadow-[0_20px_70px_rgba(0,0,0,0.30)] backdrop-blur lg:top-24">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#6f746d]">
              <Sparkles className="h-4 w-4 text-[#ff5701]" />
              {t('landing.short.preview.aiLabel', 'AI собрал')}
            </div>
            <div className="mt-3 text-4xl font-semibold tracking-[-0.06em]">7</div>
            <div className="mt-1 text-sm font-medium leading-5 text-[#4f554e]">
              {t('landing.short.preview.aiBody', 'блоков: услуги, цены, запись, отзывы, контакты')}
            </div>
          </div>

          <div className="absolute bottom-8 left-4 w-[64%] rounded-[26px] border border-white/[0.12] bg-[#101318]/[0.88] p-4 text-white shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur lg:bottom-14">
            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/[0.54]">
              {t('landing.short.preview.inboxLabel', 'Новая заявка')}
            </div>
            <div className="mt-3 text-base font-semibold">{t('landing.short.preview.inboxName', 'Айжан хочет консультацию')}</div>
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-white/10 px-3 py-2 text-sm font-semibold">
              <span>{t('landing.short.preview.inboxStatus', 'в CRM')}</span>
              <span className="text-[#ff5701]">{t('landing.short.preview.inboxTime', '2 мин')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mx-auto mt-8 flex max-w-[1120px] flex-wrap gap-2">
        {useCases.map((item) => (
          <span key={item.id} className="rounded-full border border-white/[0.12] bg-white/[0.08] px-3 py-1.5 text-sm font-semibold text-white/[0.72]">
            {item.label}
          </span>
        ))}
      </div>
    </section>
  );
}
