import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
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

const CYCLE_MS = 3600;

/**
 * Korner-style hero: a light canvas, oversized type and a live phone that
 * cycles through real-looking pages while notifications pop around it.
 * The headline animates with CSS only, so it is visible before JS loads.
 */
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

  const title = t('landing.revenue.hero.title', 'Клиент выбирает, записывается и оплачивает — по одной ссылке');
  const words = title.split(' ');

  return (
    <section className="lm-hero relative isolate overflow-hidden bg-background">
      <div aria-hidden className="lm-hero-glow pointer-events-none absolute inset-0 -z-10" />

      <div className="mx-auto grid max-w-[1240px] grid-cols-[minmax(0,1fr)] items-center gap-y-4 px-4 pb-16 pt-28 sm:px-6 sm:pt-36 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-x-10 lg:pb-24 lg:pt-36">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
        <p
          data-testid="landing-hero-badge"
          className="lm-fade-up inline-flex items-center gap-2 rounded-full bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-[0_1px_3px_rgb(0_0_0/0.06)]"
        >
          <span aria-hidden className="lm-live-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {t('landing.revenue.hero.eyebrow', 'Для специалистов и сервисного бизнеса')}
        </p>

        <h1
          data-testid="landing-hero-title"
          className="mt-7 max-w-[980px] text-balance text-[40px] font-semibold leading-[1.02] tracking-[-0.045em] text-foreground sm:text-6xl lg:text-[76px]"
        >
          {words.map((word, index) => (
            <span key={`${word}-${index}`}>
              <span className="lm-word" style={{ '--i': index } as CSSProperties}>{word}</span>
              {index < words.length - 1 ? ' ' : ''}
            </span>
          ))}
        </h1>

        <p
          data-testid="landing-hero-description"
          className="lm-fade-up mt-6 max-w-[600px] text-pretty text-base leading-7 text-muted-foreground sm:text-lg"
          style={{ animationDelay: '320ms' }}
        >
          {t('landing.k.hero.sub', 'Страница с услугами, онлайн-запись, оплата, билеты и цифровые товары. Заявки сразу приходят в Telegram и WhatsApp.')}
        </p>

        <form
          onSubmit={handleSubmit}
          className="lm-fade-up mt-8 flex w-full max-w-[520px] items-center gap-1.5 rounded-full bg-card p-1.5 shadow-[0_10px_40px_-12px_rgb(0_0_0/0.18)] ring-1 ring-black/5 focus-within:ring-2 focus-within:ring-foreground/20"
          style={{ animationDelay: '420ms' }}
        >
          <label className="flex h-12 min-w-0 flex-1 items-center pl-4 text-left">
            <span className="shrink-0 text-sm text-muted-foreground">{t('landing.short.slugPrefix', 'lnkmx.my/')}</span>
            <input
              value={slug}
              onChange={(e) => setSlug(sanitizeSlug(e.target.value))}
              placeholder={t('landing.short.slugHint', 'yourname')}
              aria-label={t('landing.short.slugAria', 'Короткий адрес страницы')}
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
            />
          </label>
          <button
            type="submit"
            data-testid="landing-hero-primary-cta"
            className="lm-shine relative inline-flex h-12 shrink-0 items-center justify-center gap-1.5 overflow-hidden whitespace-nowrap rounded-full bg-foreground px-4 text-[13px] font-semibold text-background transition-transform hover:scale-[1.02] active:scale-[0.98] sm:gap-2 sm:px-6 sm:text-sm"
          >
            {t('landing.short.ctaPrimary', 'Создать бесплатно')}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <ul className="lm-fade-up mt-6 flex max-w-full flex-wrap justify-center gap-2 lg:justify-start" style={{ animationDelay: '520ms' }}>
          {useCases.map((item) => (
            <li key={item.id} className="rounded-full bg-card/70 px-3.5 py-1.5 text-xs text-muted-foreground ring-1 ring-black/5 sm:text-sm">
              {item.label}
            </li>
          ))}
        </ul>

        <button
          type="button"
          data-testid="landing-hero-secondary-cta"
          onClick={onExamples}
          className="mt-4 min-h-11 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t('landing.k.hero.examples', 'Посмотреть примеры страниц')}
        </button>
        </div>

        <LivePhoneStage />
      </div>
    </section>
  );
}

interface DemoPage {
  name: string;
  initials: string;
  bio: string;
  cover: string;
  services: { name: string; price: string }[];
}

function useDemoPages(): DemoPage[] {
  const { t } = useTranslation();
  return [
    {
      name: 'Aruzhan Nails',
      initials: 'AN',
      bio: t('landing.k.mock.bio', 'Маникюр и брови · Алматы'),
      cover: 'linear-gradient(135deg,#f9d7e3 0%,#f3c6d6 40%,#e9e4ff 100%)',
      services: [
        { name: t('landing.k.mock.s1', 'Маникюр + покрытие'), price: '8 000 ₸' },
        { name: t('landing.k.mock.s2', 'Коррекция бровей'), price: '5 000 ₸' },
        { name: t('landing.k.mock.s3', 'Наращивание ресниц'), price: '12 000 ₸' },
      ],
    },
    {
      name: 'Dana English',
      initials: 'DE',
      bio: t('landing.k.mock2.bio', 'Английский для взрослых · онлайн'),
      cover: 'linear-gradient(135deg,#d7ecff 0%,#c9f0e4 55%,#fff4c9 100%)',
      services: [
        { name: t('landing.k.mock2.s1', 'Пробный урок'), price: t('landing.k.mock2.free', 'Бесплатно') },
        { name: t('landing.k.mock2.s2', 'Урок 60 минут'), price: '9 000 ₸' },
        { name: t('landing.k.mock2.s3', 'Разговорный клуб'), price: '4 000 ₸' },
      ],
    },
    {
      name: 'Ruslan Barber',
      initials: 'RB',
      bio: t('landing.k.mock3.bio', 'Мужские стрижки · Астана'),
      cover: 'linear-gradient(135deg,#e8e2d8 0%,#d6d0c4 45%,#c9d6df 100%)',
      services: [
        { name: t('landing.k.mock3.s1', 'Стрижка'), price: '7 000 ₸' },
        { name: t('landing.k.mock3.s2', 'Борода'), price: '4 000 ₸' },
        { name: t('landing.k.mock3.s3', 'Стрижка и борода'), price: '10 000 ₸' },
      ],
    },
  ];
}

function LivePhoneStage() {
  const { t } = useTranslation();
  const pages = useDemoPages();
  // Index 0 on the server and on the first client render: the cycle starts after mount.
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setActive((i) => (i + 1) % pages.length), CYCLE_MS);
    return () => window.clearInterval(timer);
  }, [pages.length]);

  const toasts = [
    { icon: MessageCircle, title: t('landing.k.card.lead', 'Новая заявка'), body: t('landing.k.card.leadBody', 'Айгерим, WhatsApp · 2 мин назад') },
    { icon: CalendarCheck2, title: t('landing.k.card.booking', 'Запись подтверждена'), body: t('landing.k.card.bookingBody', 'Пт, 14:00 · Маникюр') },
    { icon: CreditCard, title: t('landing.k.card.pay', 'Оплата получена'), body: '12 000 ₸' },
    { icon: Ticket, title: t('landing.k.card.ticket', 'Билет продан'), body: t('landing.k.card.ticketBody', 'Мастер-класс · 1 место') },
  ];
  const left = toasts[active % toasts.length];
  const right = toasts[(active + 2) % toasts.length];
  const page = pages[active];

  return (
    <div className="lm-fade-up relative mx-auto mt-12 flex w-full max-w-[560px] justify-center sm:mt-14 lg:mt-0" style={{ animationDelay: '600ms' }}>
      <div className="absolute -left-6 top-6 z-[1] hidden w-[250px] lg:block">
        <AnimatePresence mode="wait" initial={false}>
          <Toast key={`l-${active}`} {...left} />
        </AnimatePresence>
      </div>
      <div className="absolute -right-4 bottom-24 z-[1] hidden w-[250px] lg:block">
        <AnimatePresence mode="wait" initial={false}>
          <Toast key={`r-${active}`} {...right} />
        </AnimatePresence>
      </div>

      <div className="lm-float relative w-[288px] rounded-[48px] bg-card p-2.5 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.35),0_0_0_1px_rgb(0_0_0/0.04)]">
        <div className="relative h-[540px] overflow-hidden rounded-[40px] bg-background text-left">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={page.name}
              className="absolute inset-0"
              initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <PhonePage page={page} bookLabel={t('landing.k.mock.book', 'Записаться')} />
            </motion.div>
          </AnimatePresence>
          <div aria-hidden className="absolute left-1/2 top-2.5 h-6 w-24 -translate-x-1/2 rounded-full bg-foreground" />
        </div>

        <div className="absolute -bottom-9 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
          {pages.map((p, i) => (
            <span key={p.name} className={`h-1.5 rounded-full bg-foreground transition-all duration-500 ${i === active ? 'w-6 opacity-80' : 'w-1.5 opacity-20'}`} />
          ))}
        </div>

        {/* On phones one toast rides on the device corner */}
        <div className="absolute -right-3 top-24 w-[210px] lg:hidden">
          <AnimatePresence mode="wait" initial={false}>
            <Toast key={`m-${active}`} {...left} compact />
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function PhonePage({ page, bookLabel }: { page: DemoPage; bookLabel: string }) {
  return (
    <div className="h-full">
      <div className="h-28 w-full" style={{ background: page.cover }} />
      <div className="-mt-9 px-4">
        <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full border-4 border-background bg-card text-lg font-semibold text-foreground shadow-sm">
          {page.initials}
        </div>
        <p className="mt-2 text-lg font-semibold tracking-tight text-foreground">{page.name}</p>
        <p className="text-xs text-muted-foreground">{page.bio}</p>
      </div>
      <div className="mt-4 space-y-2 px-3">
        {page.services.map((s) => (
          <div key={s.name} className="flex items-center justify-between rounded-2xl bg-card px-3.5 py-3 text-xs shadow-[0_1px_2px_rgb(0_0_0/0.05)]">
            <span className="font-medium text-foreground">{s.name}</span>
            <span className="tabular-nums text-muted-foreground">{s.price}</span>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="aspect-square rounded-2xl" style={{ background: page.cover, opacity: 0.85 }} />
          <div className="aspect-square rounded-2xl bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05)]" />
        </div>
        <div className="rounded-2xl bg-foreground py-3 text-center text-xs font-semibold text-background">{bookLabel}</div>
      </div>
    </div>
  );
}

function Toast({ icon: Icon, title, body, compact }: { icon: typeof ArrowRight; title: string; body: string; compact?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={`flex items-center gap-3 rounded-2xl bg-card/95 text-left shadow-[0_18px_40px_-16px_rgb(0_0_0/0.25)] ring-1 ring-black/5 backdrop-blur ${compact ? 'p-2.5' : 'p-3.5'}`}
    >
      <span className={`flex shrink-0 items-center justify-center rounded-full bg-foreground text-background ${compact ? 'h-8 w-8' : 'h-10 w-10'}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className={`block truncate font-semibold text-foreground ${compact ? 'text-xs' : 'text-sm'}`}>{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{body}</span>
      </span>
    </motion.div>
  );
}
