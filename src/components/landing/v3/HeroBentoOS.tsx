import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { sanitizeSlug } from '@/lib/utils/slug';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import CalendarCheck2 from 'lucide-react/dist/esm/icons/calendar-check-2';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Ticket from 'lucide-react/dist/esm/icons/ticket';

interface HeroBentoOSProps {
  onStart: (desiredSlug?: string) => void;
  onExamples: () => void;
}

export function HeroBentoOS({ onStart, onExamples }: HeroBentoOSProps) {
  const { t } = useTranslation();
  const [slug, setSlug] = useState('');
  const cleanSlug = sanitizeSlug(slug);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onStart(cleanSlug || undefined);
  };

  const useCases = [
    { id: 'beauty', label: t('landing.revenue.audiences.beauty', 'Бьюти и wellness') },
    { id: 'consulting', label: t('landing.revenue.audiences.consulting', 'Консультации') },
    { id: 'education', label: t('landing.revenue.audiences.education', 'Обучение') },
    { id: 'creative', label: t('landing.revenue.audiences.creative', 'Креативные услуги') },
    { id: 'local', label: t('landing.revenue.audiences.local', 'Локальный сервис') },
  ];

  const services = [
    { name: t('landing.k.mock.s1', 'Маникюр + покрытие'), price: '8 000 ₸' },
    { name: t('landing.k.mock.s2', 'Коррекция бровей'), price: '5 000 ₸' },
    { name: t('landing.k.mock.s3', 'Наращивание ресниц'), price: '12 000 ₸' },
  ];

  return (
    <section className="bg-foreground text-background">
      <div className="mx-auto flex max-w-[1120px] flex-col items-center px-4 pb-16 pt-28 text-center sm:px-6 sm:pt-32 lg:pb-24">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-background/60">
          {t('landing.revenue.hero.eyebrow', 'Для специалистов и сервисного бизнеса')}
        </p>

        <ul className="mt-5 flex max-w-full flex-wrap justify-center gap-2">
          {useCases.map((item) => (
            <li key={item.id} className="rounded-full border border-background/15 px-3.5 py-1.5 text-xs text-background/80 sm:text-sm">
              {item.label}
            </li>
          ))}
        </ul>

        <h1 className="mt-8 max-w-[900px] text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-5xl lg:text-[64px]">
          {t('landing.revenue.hero.title', 'Клиент выбирает, записывается и оплачивает — по одной ссылке')}
        </h1>

        <p className="mt-5 max-w-[620px] text-pretty text-base leading-7 text-background/65 sm:text-lg">
          {t('landing.k.hero.sub', 'Страница с услугами, онлайн-запись, оплата, билеты и цифровые товары. Заявки сразу приходят в Telegram и WhatsApp.')}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex w-full max-w-[480px] flex-col gap-2 sm:flex-row">
          <label className="flex h-14 w-full items-center rounded-full bg-background/10 sm:flex-1 px-5 text-left focus-within:ring-2 focus-within:ring-background/40">
            <span className="shrink-0 text-sm text-background/50">{t('landing.short.slugPrefix', 'lnkmx.my/')}</span>
            <input
              value={slug}
              onChange={(e) => setSlug(sanitizeSlug(e.target.value))}
              placeholder={t('landing.short.slugHint', 'yourname')}
              aria-label={t('landing.short.slugAria', 'Короткий адрес страницы')}
              className="min-w-0 flex-1 bg-transparent text-sm text-background outline-none placeholder:text-background/35"
            />
          </label>
          <button type="submit" className="inline-flex h-14 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-background px-6 text-sm font-semibold text-foreground transition-opacity hover:opacity-90">
            {t('landing.short.ctaPrimary', 'Создать бесплатно')}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        <button type="button" onClick={onExamples} className="mt-4 text-sm text-background/60 underline-offset-4 hover:text-background hover:underline">
          {t('landing.k.hero.examples', 'Посмотреть примеры страниц')}
        </button>

        {/* Phone mockup with side cards that never overlap the text */}
        <div className="relative mt-14 grid w-full max-w-[920px] items-center gap-4 lg:grid-cols-[1fr_300px_1fr]">
          <div className="hidden flex-col gap-4 lg:flex">
            <FloatCard icon={MessageCircle} title={t('landing.k.card.lead', 'Новая заявка')} body={t('landing.k.card.leadBody', 'Айгерим, WhatsApp · 2 мин назад')} />
            <FloatCard icon={CreditCard} title={t('landing.k.card.pay', 'Оплата получена')} body="12 000 ₸" />
          </div>

          <div className="mx-auto w-[280px] rounded-[44px] bg-background p-2.5 text-foreground shadow-lg">
            <div className="rounded-[36px] bg-muted px-4 pb-6 pt-8 text-left">
              <div className="mx-auto h-16 w-16 rounded-full bg-primary/20" />
              <p className="mt-3 text-center text-base font-semibold">Aruzhan Nails</p>
              <p className="text-center text-xs text-muted-foreground">{t('landing.k.mock.bio', 'Маникюр и брови · Алматы')}</p>
              <div className="mt-5 space-y-2">
                {services.map((s) => (
                  <div key={s.name} className="flex items-center justify-between rounded-2xl bg-background px-3.5 py-3 text-xs">
                    <span className="font-medium">{s.name}</span>
                    <span className="font-num text-muted-foreground">{s.price}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-foreground py-3 text-center text-xs font-semibold text-background">
                {t('landing.k.mock.book', 'Записаться')}
              </div>
            </div>
          </div>

          <div className="hidden flex-col gap-4 lg:flex">
            <FloatCard icon={CalendarCheck2} title={t('landing.k.card.booking', 'Запись подтверждена')} body={t('landing.k.card.bookingBody', 'Пт, 14:00 · Маникюр')} />
            <FloatCard icon={Ticket} title={t('landing.k.card.ticket', 'Билет продан')} body={t('landing.k.card.ticketBody', 'Мастер-класс · 1 место')} />
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatCard({ icon: Icon, title, body }: { icon: typeof ArrowRight; title: string; body: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-background/10 p-4 text-left">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background text-foreground">
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block text-xs text-background/60">{body}</span>
      </span>
    </div>
  );
}
