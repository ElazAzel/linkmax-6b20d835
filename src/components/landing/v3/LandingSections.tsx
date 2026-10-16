import type { CSSProperties, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import CalendarCheck2 from 'lucide-react/dist/esm/icons/calendar-check-2';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Send from 'lucide-react/dist/esm/icons/send';
import Ticket from 'lucide-react/dist/esm/icons/ticket';
import Download from 'lucide-react/dist/esm/icons/download';
import Bot from 'lucide-react/dist/esm/icons/bot';
import Palette from 'lucide-react/dist/esm/icons/palette';
import Users from 'lucide-react/dist/esm/icons/users';
import Check from 'lucide-react/dist/esm/icons/check';
import FileText from 'lucide-react/dist/esm/icons/file-text';

interface Props {
  onStart: () => void;
  onPricing: () => void;
}

const vars = (v: Record<string, string | number>) => v as CSSProperties;

export function LandingSections({ onStart, onPricing }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <ExamplesMarquee />

      <section id="outcomes" className="scroll-mt-24 bg-background px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-[1180px]">
          <SectionHead
            title={t('landing.k.f.title', 'Всё, что нужно для продаж, в одной ссылке')}
            sub={t('landing.k.f.sub', 'Не просто список ссылок. Ваша страница принимает записи, деньги и заявки сама.')}
          />
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Tile wide icon={CalendarCheck2} title={t('landing.k.f.booking', 'Онлайн-запись')} body={t('landing.k.f.bookingBody', 'Услуги с ценой и длительностью, свободные слоты, специалисты и кабинеты. Занятое время не продать дважды.')}>
              <SlotsDemo />
            </Tile>
            <Tile icon={Send} title={t('landing.k.f.leads', 'Заявки в мессенджер')} body={t('landing.k.f.leadsBody', 'Каждая заявка мгновенно приходит в Telegram.')}>
              <ChatDemo
                lines={[
                  t('landing.k.demo.chat1', 'Новая заявка: маникюр'),
                  t('landing.k.demo.chat2', 'Айгерим · +7 701 ··· 45'),
                  t('landing.k.demo.chat3', 'Пт, 14:00 — подтвердить?'),
                ]}
              />
            </Tile>
            <Tile icon={CreditCard} title={t('landing.k.f.pay', 'Оплата')} body={t('landing.k.f.payBody', 'Предоплата и оплата услуг прямо со страницы.')}>
              <PaymentDemo label={t('landing.k.card.pay', 'Оплата получена')} />
            </Tile>
            <Tile icon={Ticket} title={t('landing.k.f.events', 'Мероприятия и билеты')} body={t('landing.k.f.eventsBody', 'Регистрация, билеты с QR и сканер по ссылке для ваших помощников.')}>
              <QrDemo />
            </Tile>
            <Tile icon={Download} title={t('landing.k.f.digital', 'Цифровые товары')} body={t('landing.k.f.digitalBody', 'Гайды, курсы и файлы с выдачей после оплаты.')}>
              <FileDemo />
            </Tile>
            <Tile wide icon={Users} title={t('landing.k.f.crm', 'Карточка клиента')} body={t('landing.k.f.crmBody', 'Заявки, записи и покупки собираются в историю клиента. Этапы, заметки и общая выручка в одном месте.')}>
              <TimelineDemo
                items={[
                  t('landing.k.demo.t1', 'Заявка из Instagram'),
                  t('landing.k.demo.t2', 'Запись на пятницу'),
                  t('landing.k.demo.t3', 'Оплата 12 000 ₸'),
                  t('landing.k.demo.t4', 'Повторный визит'),
                ]}
              />
            </Tile>
            <Tile wide icon={Bot} title={t('landing.k.f.ai', 'Помощник на странице')} body={t('landing.k.f.aiBody', 'Отвечает гостям по вашим услугам и ценам.')}>
              <TypingDemo />
            </Tile>
            <Tile wide icon={Palette} title={t('landing.k.f.themes', '25 тем оформления')} body={t('landing.k.f.themesBody', 'Красиво с телефона, без дизайнера.')}>
              <SwatchDemo />
            </Tile>
          </div>
        </div>
      </section>

      <section id="workflow" className="scroll-mt-24 bg-muted/60 px-4 py-20 sm:px-6 lg:py-28">
        <div className="mx-auto max-w-[1180px]">
          <SectionHead title={t('landing.k.s.title', 'Запуск за 5 минут')} />
          <ol className="relative mt-12 grid gap-3 md:grid-cols-3">
            <span aria-hidden className="lm-progress pointer-events-none absolute left-7 right-7 top-[52px] hidden h-px origin-left bg-foreground/80 md:block" />
            {[
              { n: '01', title: t('landing.k.s1', 'Выберите адрес'), body: t('landing.k.s1b', 'lnkmx.my/вашеимя — за 10 секунд.') },
              { n: '02', title: t('landing.k.s2', 'Добавьте услуги'), body: t('landing.k.s2b', 'Цены, расписание, контакты, оплата.') },
              { n: '03', title: t('landing.k.s3', 'Поставьте ссылку в био'), body: t('landing.k.s3b', 'Instagram, Telegram, WhatsApp, 2ГИС.') },
            ].map((s, i) => (
              <li key={s.n} className="lm-reveal relative rounded-[28px] bg-card p-7 shadow-[0_1px_3px_rgb(0_0_0/0.05)]" style={vars({ '--d': `${i * 90}ms` })}>
                <span className="relative z-[1] flex h-12 w-12 items-center justify-center rounded-full bg-foreground tabular-nums text-sm font-semibold text-background">{s.n}</span>
                <h3 className="mt-8 text-xl font-semibold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="pricing" className="scroll-mt-24 bg-background px-4 py-20 sm:px-6">
        <div className="lm-cta-ring relative mx-auto max-w-[1180px] rounded-[40px] p-px">
          <div className="relative flex flex-col items-center overflow-hidden rounded-[39px] bg-foreground px-6 py-16 text-center text-background sm:py-24">
            <div aria-hidden className="lm-cta-glow pointer-events-none absolute inset-0" />
            <h2 className="relative max-w-[720px] text-balance text-4xl font-semibold tracking-[-0.035em] sm:text-6xl">
              {t('landing.k.cta.title', 'Начните принимать клиентов сегодня')}
            </h2>
            <p className="relative mt-4 text-background/65">{t('landing.k.cta.sub', 'Бесплатно. Без карты. Pro, когда понадобится больше.')}</p>
            <div className="relative mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <button type="button" onClick={onStart} className="lm-shine relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-full bg-background px-8 text-sm font-semibold text-foreground transition-transform hover:scale-[1.02] active:scale-[0.98]">
                {t('landing.short.ctaPrimary', 'Создать бесплатно')} <ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" onClick={onPricing} className="inline-flex h-14 items-center justify-center rounded-full border border-background/20 px-8 text-sm font-semibold transition-colors hover:bg-background/10">
                {t('landing.k.cta.pricing', 'Тарифы')}
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="lm-reveal">
      <h2 className="max-w-[760px] text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.035em] sm:text-6xl">{title}</h2>
      {sub && <p className="mt-4 max-w-[560px] text-base text-muted-foreground sm:text-lg">{sub}</p>}
    </div>
  );
}

function Tile({ icon: Icon, title, body, wide, children }: { icon: typeof ArrowRight; title: string; body: string; wide?: boolean; children: ReactNode }) {
  return (
    <article className={`lm-reveal group flex min-h-[260px] flex-col overflow-hidden rounded-[28px] bg-card p-6 shadow-[0_1px_3px_rgb(0_0_0/0.05)] transition-shadow duration-300 hover:shadow-[0_24px_48px_-24px_rgb(0_0_0/0.25)] ${wide ? 'lg:col-span-2' : ''}`}>
      <div aria-hidden className="relative flex min-h-[110px] flex-1 items-center justify-center">{children}</div>
      <div className="mt-6 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
          <Icon className="h-4 w-4 text-foreground" />
        </span>
        <div>
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
        </div>
      </div>
    </article>
  );
}

/* ---------- Live micro-demos (CSS-driven, paused for reduced motion) ---------- */

function SlotsDemo() {
  const slots = ['10:00', '11:30', '13:00', '14:00', '15:30', '17:00', '18:30', '20:00'];
  return (
    <div className="grid w-full max-w-[420px] grid-cols-4 gap-2">
      {slots.map((s, i) => (
        <span key={s} className="lm-slot rounded-xl bg-muted py-2.5 text-center tabular-nums text-xs text-muted-foreground" style={vars({ '--i': i })}>
          {s}
        </span>
      ))}
    </div>
  );
}

function ChatDemo({ lines }: { lines: string[] }) {
  return (
    <div className="flex w-full max-w-[240px] flex-col gap-1.5">
      {lines.map((line, i) => (
        <span key={line} className="lm-bubble self-start rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-xs text-foreground" style={vars({ '--i': i })}>
          {line}
        </span>
      ))}
    </div>
  );
}

function PaymentDemo({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="lm-pay-check flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background">
        <Check className="h-6 w-6" />
      </span>
      <span className="tabular-nums text-2xl font-semibold tracking-tight">12 000 ₸</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function QrDemo() {
  const cells = Array.from({ length: 49 }, (_, i) => ((i * 7 + (i % 5) * 3) % 3 === 0) || [0, 1, 2, 7, 14, 4, 5, 6, 13, 20, 28, 35, 42, 43, 44].includes(i));
  return (
    <div className="relative grid grid-cols-7 gap-[3px] overflow-hidden rounded-xl bg-card p-2 ring-1 ring-black/5">
      {cells.map((on, i) => (
        <span key={i} className={`h-3 w-3 rounded-[2px] ${on ? 'bg-foreground' : 'bg-muted'}`} />
      ))}
      <span className="lm-scan absolute inset-x-0 h-6 bg-gradient-to-b from-transparent via-emerald-400/50 to-transparent" />
    </div>
  );
}

function FileDemo() {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-muted px-4 py-3">
      <FileText className="h-6 w-6 text-foreground" />
      <span className="text-left">
        <span className="block text-xs font-semibold text-foreground">guide.pdf</span>
        <span className="block tabular-nums text-[11px] text-muted-foreground">2,4 MB</span>
      </span>
      <span className="lm-drop flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background">
        <Download className="h-4 w-4" />
      </span>
    </div>
  );
}

function TimelineDemo({ items }: { items: string[] }) {
  return (
    <ol className="flex w-full max-w-[460px] flex-col gap-2 sm:flex-row sm:items-start sm:gap-0">
      {items.map((item, i) => (
        <li key={item} className="lm-step flex items-center gap-2 sm:flex-1 sm:flex-col sm:text-center" style={vars({ '--i': i })}>
          <span className="lm-step-dot h-3 w-3 shrink-0 rounded-full bg-foreground" />
          <span className="text-xs text-muted-foreground">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function TypingDemo() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-start gap-1.5">
      <span className="rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-xs">{t('landing.k.demo.ask', 'Сколько стоит маникюр?')}</span>
      <span className="flex gap-1 self-end rounded-2xl rounded-br-md bg-foreground px-3 py-2.5">
        {[0, 1, 2].map((i) => <span key={i} className="lm-typing h-1.5 w-1.5 rounded-full bg-background" style={vars({ '--i': i })} />)}
      </span>
    </div>
  );
}

function SwatchDemo() {
  const colors = ['#111111', '#f5f5f7', '#f3c6d6', '#c9f0e4', '#d7ecff', '#e8e2d8'];
  return (
    <div className="flex -space-x-3">
      {colors.map((c, i) => (
        <span key={c} className="lm-swatch h-11 w-11 rounded-full ring-4 ring-card" style={vars({ background: c, '--i': i })} />
      ))}
    </div>
  );
}

/* ---------- Infinite gallery of example pages ---------- */

function ExamplesMarquee() {
  const { t } = useTranslation();
  const rows = [
    [
      { name: 'Aruzhan Nails', tag: t('landing.revenue.audiences.beauty', 'Бьюти и wellness'), bg: '#f3c6d6' },
      { name: 'Dana English', tag: t('landing.revenue.audiences.education', 'Обучение'), bg: '#d7ecff' },
      { name: 'Ruslan Barber', tag: t('landing.revenue.audiences.local', 'Локальный сервис'), bg: '#e8e2d8' },
      { name: 'Mind Studio', tag: t('landing.revenue.audiences.consulting', 'Консультации'), bg: '#c9f0e4' },
      { name: 'Asel Photo', tag: t('landing.revenue.audiences.creative', 'Креативные услуги'), bg: '#fff4c9' },
    ],
    [
      { name: 'Yoga Bloom', tag: t('landing.revenue.audiences.beauty', 'Бьюти и wellness'), bg: '#e9e4ff' },
      { name: 'Code Kids', tag: t('landing.revenue.audiences.education', 'Обучение'), bg: '#ffe2cc' },
      { name: 'Lex Consult', tag: t('landing.revenue.audiences.consulting', 'Консультации'), bg: '#dfe7ef' },
      { name: 'Clean Home', tag: t('landing.revenue.audiences.local', 'Локальный сервис'), bg: '#d9f2d0' },
      { name: 'Studio Ink', tag: t('landing.revenue.audiences.creative', 'Креативные услуги'), bg: '#f1e1f7' },
    ],
  ];

  return (
    <section id="examples" className="scroll-mt-24 overflow-hidden bg-background py-16 sm:py-20">
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <SectionHead
          title={t('landing.k.gallery.title', 'Одна ссылка — для любого дела')}
          sub={t('landing.k.gallery.sub', 'Мастера, преподаватели, консультанты и студии собирают страницу за вечер.')}
        />
      </div>
      <div className="lm-marquee-mask mt-10 space-y-3">
        {rows.map((row, r) => (
          <div key={r} className="flex overflow-hidden">
            <div className={`lm-marquee flex shrink-0 gap-3 pr-3 ${r === 1 ? 'lm-marquee-reverse' : ''}`}>
              {[...row, ...row].map((card, i) => (
                <MiniPage key={`${card.name}-${i}`} {...card} hidden={i >= row.length} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MiniPage({ name, tag, bg, hidden }: { name: string; tag: string; bg: string; hidden?: boolean }) {
  return (
    <div aria-hidden={hidden || undefined} className="w-[220px] shrink-0 overflow-hidden rounded-[24px] bg-card shadow-[0_1px_3px_rgb(0_0_0/0.06)] sm:w-[260px]">
      <div className="h-20" style={{ background: bg }} />
      <div className="-mt-6 px-4 pb-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-card bg-muted text-xs font-semibold">
          {name.split(' ').map((w) => w[0]).join('')}
        </span>
        <p className="mt-2 text-sm font-semibold">{name}</p>
        <p className="text-xs text-muted-foreground">{tag}</p>
        <div className="mt-3 space-y-1.5">
          <span className="block h-7 rounded-xl bg-muted" />
          <span className="block h-7 rounded-xl bg-muted" />
          <span className="block h-7 rounded-xl bg-foreground/90" />
        </div>
      </div>
    </div>
  );
}
