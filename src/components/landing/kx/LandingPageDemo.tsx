import { useEffect, useMemo, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';
import { CardBlock } from '@/components/blocks/CardBlock';
import { TilesBlock } from '@/components/blocks/TilesBlock';
import { CarouselBlock } from '@/components/blocks/CarouselBlock';
import { RenderContextProvider } from '@/contexts/RenderContext';
import { DEMO_MEDIA } from '@/lib/demo-media';
import type { CardBlock as CardData, TilesBlock as TilesData } from '@/types/page';

function demoPages(t: TFunction) {
  return [
    {
      id: 'beauty', name: 'Aruzhan Nails', avatar: DEMO_MEDIA.beautyPortrait,
      role: t('landing.kx.demo.nailsRole', 'Маникюр и брови · Алматы'),
      cover: DEMO_MEDIA.studio, background: '#f4efe9', ink: '#28231f', muted: '#766c62', card: '#fffdf9',
      feature: { id: 'demo-booking', type: 'card', image: DEMO_MEDIA.nails,
        title: t('landing.kx.demo.manicure', 'Маникюр'), text: '8 000 ₸',
        buttonText: t('landing.kx.demo.book', 'Записаться онлайн') } satisfies CardData,
      gallery: { id: 'demo-beauty-gallery', type: 'tiles', columns: 2, aspect: 'portrait', items: [
        { id: 'nails', image: DEMO_MEDIA.nails, title: t('landing.kx.demo.manicure', 'Маникюр') },
        { id: 'studio', image: DEMO_MEDIA.studio, title: t('landing.kx.demo.brows', 'Брови') },
      ] } satisfies TilesData,
    },
    {
      id: 'education', name: 'Dana English', avatar: DEMO_MEDIA.teacher,
      role: t('landing.kx.demo.englishRole', 'Английский для взрослых · онлайн'),
      cover: DEMO_MEDIA.study, background: '#eff2ed', ink: '#26362a', muted: '#647266', card: '#fcfdf9',
      feature: { id: 'demo-lesson', type: 'card', image: DEMO_MEDIA.study,
        title: t('landing.kx.demo.trial', 'Пробный урок бесплатно'),
        text: t('landing.kx.demo.trialNote', '30 минут, без оплаты'),
        buttonText: t('landing.kx.demo.book', 'Записаться онлайн') } satisfies CardData,
      gallery: { id: 'demo-education-gallery', type: 'tiles', columns: 2, aspect: 'square', items: [
        { id: 'ielts', image: DEMO_MEDIA.study, title: 'IELTS' },
        { id: 'group', image: DEMO_MEDIA.coffee, title: t('landing.kx.demo.group', 'Группа') },
      ] } satisfies TilesData,
    },
    {
      id: 'photo', name: 'Timur Shot', avatar: DEMO_MEDIA.photographer,
      role: t('landing.kx.demo.photoRole', 'Фотограф · свадьбы и портреты'),
      cover: DEMO_MEDIA.wedding, background: '#191c1c', ink: '#f4f2eb', muted: '#adafa7', card: '#252929',
      feature: { id: 'demo-shoot', type: 'card', title: t('landing.kx.demo.date', 'Забронировать дату'),
        text: t('landing.kx.demo.datePrice', 'Съёмка от 25 000 ₸'), buttonText: 'Instagram' } satisfies CardData,
      gallery: { id: 'demo-photo-gallery', type: 'tiles', columns: 2, aspect: 'portrait', items: [
        { id: 'wedding', image: DEMO_MEDIA.wedding }, { id: 'portrait', image: DEMO_MEDIA.portrait },
      ] } satisfies TilesData,
    },
  ];
}

/** Actual public block components, isolated with the example page's theme. */
export function LandingPageDemo() {
  const { t } = useTranslation();
  const pages = useMemo(() => demoPages(t), [t]);
  const [selected, setSelected] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(media.matches);
    const update = () => setReducedMotion(media.matches);
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (interacted || paused || reducedMotion) return;
    const timer = window.setInterval(() => setSelected((index) => (index + 1) % pages.length), 6500);
    return () => window.clearInterval(timer);
  }, [interacted, paused, reducedMotion, pages.length]);

  const choose = (index: number) => { setInteracted(true); setSelected(index); };
  const keyboardSelect = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = event.key === 'ArrowRight' ? (index + 1) % pages.length
      : event.key === 'ArrowLeft' ? (index + pages.length - 1) % pages.length
        : event.key === 'Home' ? 0 : event.key === 'End' ? pages.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    choose(next);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  };
  const page = pages[selected];
  const theme = {
    '--kx-screen': page.background, '--background': page.background, '--foreground': page.ink,
    '--card': page.card, '--card-foreground': page.ink, '--muted-foreground': page.muted,
    '--primary': page.ink, '--primary-foreground': page.background, '--border': `${page.muted}33`,
    '--lm-block-radius': '22px', color: page.ink,
  } as CSSProperties;

  return (
    <div className="kx-example" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setInteracted(true)}>
      <div className="kx-example-switcher" role="tablist" aria-label={t('landing.kx.demo.label', 'Пример страницы на LinkMAX')}>
        {pages.map((item, index) => (
          <button key={item.id} id={`kx-example-${item.id}`} type="button" role="tab"
            aria-selected={selected === index} aria-controls={`kx-page-${item.id}`}
            tabIndex={selected === index ? 0 : -1}
            onClick={() => choose(index)} onKeyDown={(event) => keyboardSelect(event, index)}>
            <img src={item.avatar} alt="" width={24} height={24} loading="lazy" />
            <span>{item.name}</span>
          </button>
        ))}
      </div>
      <div className="relative mx-auto flex justify-center py-5">
        <div className="kx-phone">
          <div className="kx-phone-island" aria-hidden="true" />
          <div className="kx-phone-screen" style={theme}>
            <div key={page.id} id={`kx-page-${page.id}`} role="tabpanel" aria-labelledby={`kx-example-${page.id}`}
              tabIndex={0} className="kx-live-page" onScroll={() => setInteracted(true)}>
              <RenderContextProvider value="public-preview">
                <div className="kx-live-cover"><img src={page.cover} alt="" width={720} height={480} loading="lazy" /></div>
                <header className="kx-live-profile">
                  <img src={page.avatar} alt={page.name} width={64} height={64} loading="lazy" />
                  <h2>{page.name}</h2>
                  <p>{page.role}</p>
                </header>
                <div className="kx-live-blocks">
                  {page.id === 'photo' && <CarouselBlock block={{ id: 'demo-slides', type: 'carousel',
                    images: [{ url: DEMO_MEDIA.wedding, alt: page.role }, { url: DEMO_MEDIA.portrait, alt: page.role }],
                    autoPlay: !reducedMotion && !interacted && !paused, interval: 3400 }} />}
                  <div className="kx-live-card"><CardBlock block={page.feature} /></div>
                  <TilesBlock block={page.gallery} />
                  <div className="kx-live-address">lnkmx.my/{page.name.toLowerCase().replace(/\s+/g, '')}</div>
                </div>
              </RenderContextProvider>
            </div>
          </div>
        </div>
        <span className="kx-example-note" aria-hidden="true">{t('landing.kx.chips.c2', 'Портфолио')}<ArrowUpRight className="h-4 w-4" /></span>
      </div>
      <a className="kx-example-gallery" href="/gallery">{t('landing.kx.nav.examples', 'Примеры')}<ArrowUpRight className="h-4 w-4" /></a>
    </div>
  );
}
