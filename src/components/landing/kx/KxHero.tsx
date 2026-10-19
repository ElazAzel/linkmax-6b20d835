import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ClaimForm, Marquee, RotatingWord } from './primitives';

interface Props {
  onStart: (slug?: string) => void;
}

export function KxHero({ onStart }: Props) {
  const { t } = useTranslation();
  const words = [
    t('landing.kx.hero.w1', 'визитку'),
    t('landing.kx.hero.w2', 'портфолио'),
    t('landing.kx.hero.w3', 'магазин'),
    t('landing.kx.hero.w4', 'прайс'),
    t('landing.kx.hero.w5', 'резюме'),
    t('landing.kx.hero.w6', 'меню'),
    t('landing.kx.hero.w7', 'витрину'),
    t('landing.kx.hero.w8', 'донаты'),
  ];
  const chips = [
    t('landing.kx.chips.c1', 'Визитка'),
    t('landing.kx.chips.c2', 'Портфолио'),
    t('landing.kx.chips.c3', 'Онлайн-запись'),
    t('landing.kx.chips.c4', 'Прайс-лист'),
    t('landing.kx.chips.c5', 'Магазин'),
    t('landing.kx.chips.c6', 'Мерч'),
    t('landing.kx.chips.c7', 'Страница эксперта'),
    t('landing.kx.chips.c8', 'Подкаст'),
    t('landing.kx.chips.c9', 'Резюме с кейсами'),
    t('landing.kx.chips.c10', 'Донаты'),
    t('landing.kx.chips.c11', 'Меню кафе'),
    t('landing.kx.chips.c12', 'Билеты на ивент'),
    t('landing.kx.chips.c13', 'Курс'),
    t('landing.kx.chips.c14', 'Ссылка в био'),
  ];
  const half = Math.ceil(chips.length / 2);

  return (
    <section className="relative pt-10 md:pt-16" aria-labelledby="kx-hero-title">
      {/* soft glow behind the headline, the only decoration on the page */}
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-0 h-[520px] w-[900px] max-w-[160vw] -translate-x-1/2 rounded-full opacity-40 blur-[120px]" style={{ background: 'radial-gradient(closest-side, rgb(255 107 0 / .55), transparent)' }} />

      <div className="kx-wrap relative grid items-center gap-14 lg:grid-cols-[1.15fr_.85fr] lg:gap-10">
        <div>
          <h1 id="kx-hero-title" className="kx-display text-[40px] min-[400px]:text-[44px] sm:text-[64px] lg:text-[76px]">
            {t('landing.kx.hero.before', 'Собери')}{' '}
            <RotatingWord words={words} />
            <br />
            <span className="sm:whitespace-nowrap">{t('landing.kx.hero.after', 'за пару минут')}</span>
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-[var(--kx-muted)] md:text-xl">
            {t('landing.kx.hero.sub', 'Одна ссылка вместо десяти. Покажи, что делаешь, принимай заявки и оплату прямо со страницы. Займи короткий адрес, пока он свободен.')}
          </p>
          <div className="mt-8 max-w-[36rem]">
            <ClaimForm id="kx-claim-hero" onSubmit={onStart} />
          </div>
        </div>

        <PhoneDemo />
      </div>

      <div className="mt-16 grid gap-3 md:mt-24" aria-label={t('landing.kx.chips.label', 'Что можно собрать')}>
        <Marquee items={chips.slice(0, half)} direction="left" speed={52} />
        <Marquee items={chips.slice(half)} direction="right" speed={60} />
      </div>
    </section>
  );
}

/* ---------- animated phone ---------- */

interface Persona {
  key: string;
  screen: string;
  ink: string;
  initials: string;
  name: string;
  role: string;
  avatar: string;
  tiles: Array<{ span?: 2; rows?: 2; bg: string; fg?: string; content: ReactNode }>;
}

function usePersonas(): Persona[] {
  const { t } = useTranslation();
  const photo = (a: string, b: string) => `linear-gradient(140deg, ${a}, ${b})`;
  return [
    {
      key: 'nails',
      screen: '#f3eee8',
      ink: '#1b1410',
      initials: 'AN',
      name: 'Aruzhan Nails',
      role: t('landing.kx.demo.nailsRole', 'Маникюр и брови · Алматы'),
      avatar: photo('#e7b7a3', '#b8644c'),
      tiles: [
        { span: 2, bg: '#1b1410', fg: '#fff', content: <TileCta label={t('landing.kx.demo.book', 'Записаться онлайн')} note={t('landing.kx.demo.slots', 'Сегодня 3 окна')} /> },
        { rows: 2, bg: photo('#d9a08a', '#7a3b2e'), content: null },
        { bg: '#fff', content: <TilePrice label={t('landing.kx.demo.manicure', 'Маникюр')} price="8 000 ₸" /> },
        { bg: '#fff', content: <TilePrice label={t('landing.kx.demo.brows', 'Брови')} price="5 000 ₸" /> },
        { bg: '#25d366', fg: '#fff', content: <TileLabel label="WhatsApp" /> },
        { bg: photo('#f0c9b8', '#c98a74'), content: null },
      ],
    },
    {
      key: 'english',
      screen: '#eef1fb',
      ink: '#0f1a3a',
      initials: 'DE',
      name: 'Dana English',
      role: t('landing.kx.demo.englishRole', 'Английский для взрослых · онлайн'),
      avatar: photo('#9fb4ff', '#3149b8'),
      tiles: [
        { span: 2, bg: '#2f45c4', fg: '#fff', content: <TileCta label={t('landing.kx.demo.trial', 'Пробный урок бесплатно')} note={t('landing.kx.demo.trialNote', '30 минут, без оплаты')} /> },
        { bg: '#fff', content: <TilePrice label="IELTS" price={t('landing.kx.demo.ieltsPrice', 'от 6 000 ₸')} /> },
        { bg: '#fff', content: <TilePrice label={t('landing.kx.demo.group', 'Группа')} price={t('landing.kx.demo.groupPrice', '4 500 ₸')} /> },
        { span: 2, bg: '#fff', content: <TileQuote text={t('landing.kx.demo.quote', '«Наконец перестала бояться говорить»')} /> },
        { bg: '#229ed9', fg: '#fff', content: <TileLabel label="Telegram" /> },
        { bg: photo('#c9d4ff', '#7287e8'), content: null },
      ],
    },
    {
      key: 'photo',
      screen: '#121212',
      ink: '#f4f4f1',
      initials: 'TS',
      name: 'Timur Shot',
      role: t('landing.kx.demo.photoRole', 'Фотограф · свадьбы и портреты'),
      avatar: photo('#ffb36b', '#ff6b00'),
      tiles: [
        { rows: 2, bg: photo('#3a3a3a', '#0f0f0f'), content: null },
        { bg: photo('#ff9a4d', '#a33d00'), content: null },
        { bg: photo('#575757', '#1f1f1f'), content: null },
        { span: 2, bg: '#ff6b00', fg: '#000', content: <TileCta label={t('landing.kx.demo.date', 'Забронировать дату')} note={t('landing.kx.demo.datePrice', 'Съёмка от 25 000 ₸')} /> },
        { bg: '#1e1e1e', fg: '#fff', content: <TileLabel label="Instagram" /> },
        { bg: '#1e1e1e', fg: '#fff', content: <TileLabel label={t('landing.kx.demo.reviews', 'Отзывы')} /> },
      ],
    },
  ];
}

function TileCta({ label, note }: { label: string; note: string }) {
  return (
    <>
      <span className="text-[13px] font-semibold leading-tight">{label}</span>
      <span className="opacity-70">{note}</span>
    </>
  );
}
function TilePrice({ label, price }: { label: string; price: string }) {
  return (
    <>
      <span className="opacity-60">{label}</span>
      <span className="text-[13px] font-semibold">{price}</span>
    </>
  );
}
function TileLabel({ label }: { label: string }) {
  return <span className="mt-auto text-[12px] font-semibold">{label}</span>;
}
function TileQuote({ text }: { text: string }) {
  return <span className="text-[12px] leading-snug">{text}</span>;
}

function PhoneDemo() {
  const { t } = useTranslation();
  const personas = usePersonas();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % personas.length), 4200);
    return () => window.clearInterval(timer);
  }, [personas.length]);
  const p = personas[index];

  return (
    <div className="relative mx-auto flex justify-center py-6" aria-label={t('landing.kx.demo.label', 'Пример страницы на LinkMAX')} role="img">
      <div className="kx-phone">
        <div className="kx-phone-island" />
        <div className="kx-phone-screen" style={{ '--kx-screen': p.screen, color: p.ink, transition: 'background-color .6s' } as CSSProperties}>
          <div key={p.key} className="kx-demo">
            <div className="flex items-center gap-3" style={{ '--i': 0 } as CSSProperties}>
              <span className="grid h-12 w-12 place-items-center rounded-full text-sm font-bold text-white" style={{ background: p.avatar }}>{p.initials}</span>
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-bold leading-tight">{p.name}</span>
                <span className="block truncate text-[11px] opacity-60">{p.role}</span>
              </span>
            </div>
            <div className="kx-demo-grid">
              {p.tiles.map((tile, i) => (
                <div
                  key={i}
                  className="kx-tile"
                  style={{
                    '--i': i,
                    background: tile.bg,
                    color: tile.fg ?? p.ink,
                    gridColumn: tile.span === 2 ? 'span 2' : undefined,
                    gridRow: tile.rows === 2 ? 'span 2' : undefined,
                  } as CSSProperties}
                >
                  {tile.content}
                </div>
              ))}
            </div>
            <div className="mt-auto text-center text-[10px] opacity-40" style={{ '--i': 8 } as CSSProperties}>lnkmx.my/{p.name.toLowerCase().replace(/\s+/g, '')}</div>
          </div>
        </div>
      </div>

      <div className="kx-toast left-0 top-[46%] hidden sm:flex lg:-left-14" style={{ animationDelay: '0s' }}>
        <span className="kx-toast-dot" style={{ background: 'rgb(255 107 0 / .16)', color: 'var(--kx-accent)' }}>●</span>
        <span><b>{t('landing.kx.demo.toastLead', 'Новая заявка')}</b><small>{t('landing.kx.demo.toastLeadNote', 'Айгерим · через WhatsApp')}</small></span>
      </div>
      <div className="kx-toast bottom-16 right-0 hidden sm:flex lg:-right-10" style={{ animationDelay: '-3s' }}>
        <span className="kx-toast-dot" style={{ background: 'rgb(61 220 132 / .16)', color: 'var(--kx-ok)' }}>₸</span>
        <span><b>+12 000 ₸</b><small>{t('landing.kx.demo.toastPay', 'Оплата за запись')}</small></span>
      </div>
    </div>
  );
}
