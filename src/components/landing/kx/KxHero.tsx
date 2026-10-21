import { useTranslation } from 'react-i18next';
import { ClaimForm, Marquee, RotatingWord } from './primitives';
import { LandingPageDemo } from './LandingPageDemo';

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

      <div className="kx-wrap relative grid items-center gap-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)] lg:gap-10">
        <div>
          <h1 id="kx-hero-title" className="kx-display text-[40px] min-[400px]:text-[44px] sm:text-[64px] lg:text-[76px]">
            {t('landing.kx.hero.before', 'Собери')}{' '}
            <RotatingWord words={words} />
            <br />
            <span>{t('landing.kx.hero.after', 'за пару минут')}</span>
          </h1>
          <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-[var(--kx-muted)] md:text-xl">
            {t('landing.kx.hero.sub', 'Одна ссылка вместо десяти. Покажи, что делаешь, принимай заявки и оплату прямо со страницы. Займи короткий адрес, пока он свободен.')}
          </p>
          <div className="mt-8 max-w-[36rem]">
            <ClaimForm id="kx-claim-hero" onSubmit={onStart} />
          </div>
        </div>

        <LandingPageDemo />
      </div>

      <div className="mt-16 grid gap-3 md:mt-24" aria-label={t('landing.kx.chips.label', 'Что можно собрать')}>
        <Marquee items={chips.slice(0, half)} direction="left" speed={52} />
        <Marquee items={chips.slice(half)} direction="right" speed={60} />
      </div>
    </section>
  );
}
