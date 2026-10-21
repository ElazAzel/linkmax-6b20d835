import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';
import { GridBlocksRenderer } from '@/components/blocks/GridBlocksRenderer';
import { PageThemeProvider } from '@/lib/appearance/page-theme-provider';
import { getThemePreset } from '@/lib/appearance/presets';
import { getDividerClass, getPageThemeScope, getThemeBackgroundStyle } from '@/lib/appearance/style-utils';
import { usePageFonts } from '@/hooks/page/usePageFonts';
import { RenderContextProvider } from '@/contexts/RenderContext';
import { LANDING_DEMO_MEDIA as DEMO_MEDIA } from '@/lib/demo-media';
import type { Block, CardBlock as CardData, TilesBlock as TilesData } from '@/types/page';

function demoPages(t: TFunction) {
  return [
    {
      id: 'beauty', name: 'Aruzhan Nails', avatar: DEMO_MEDIA.beautyPortrait,
      role: t('landing.kx.demo.nailsRole', 'Маникюр и брови · Алматы'),
      cover: DEMO_MEDIA.studio, theme: getThemePreset('blush-lavender')!.theme,
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
      cover: DEMO_MEDIA.study, theme: getThemePreset('matcha')!.theme,
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
      cover: DEMO_MEDIA.wedding, theme: getThemePreset('graphite')!.theme,
      feature: { id: 'demo-shoot', type: 'card', image: DEMO_MEDIA.portrait, title: t('landing.kx.demo.date', 'Забронировать дату'),
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
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    setInteractive(true);
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
  const scope = getPageThemeScope(page.theme);
  usePageFonts(page.theme);
  const blocks: Block[] = [
    { id: `demo-profile-${page.id}`, type: 'profile', name: page.name, bio: page.role,
      avatar: page.avatar, coverImage: page.cover, coverHeight: 'small',
      coverPosition: { x: 50, y: page.id === 'photo' ? 20 : page.id === 'education' ? 10 : 50 } },
    ...(page.id === 'photo' ? [{ id: 'demo-slides', type: 'carousel' as const,
      images: [{ url: DEMO_MEDIA.wedding, alt: page.role }, { url: DEMO_MEDIA.portrait, alt: page.role }],
      autoPlay: !reducedMotion && !interacted && !paused, interval: 3400, blockSize: 'full' as const }] : []),
    { ...page.feature, blockSize: 'full' },
    { ...page.gallery, blockSize: 'full' },
  ];

  return (
    <div className="kx-example" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setInteracted(true)}>
      <div className="kx-example-switcher" role="tablist" aria-label={t('landing.kx.demo.label', 'Пример страницы на LinkMAX')}>
        {pages.map((item, index) => (
          <button key={item.id} id={`kx-example-${item.id}`} type="button" role="tab"
            aria-selected={selected === index} aria-controls={`kx-page-${item.id}`}
            disabled={!interactive}
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
          <div className="kx-phone-screen">
            <PageThemeProvider scope={scope}>
            <div key={page.id} id={`kx-page-${page.id}`} role="tabpanel" aria-labelledby={`kx-example-${page.id}`}
              tabIndex={0} className={`kx-live-page ${scope.className}`}
              style={{ ...scope.style, ...getThemeBackgroundStyle(page.theme) }} onScroll={() => setInteracted(true)}>
              <RenderContextProvider value="public-preview">
                <div className="lm-page-width py-4">
                  <GridBlocksRenderer blocks={blocks} isPreview animation="none" className={getDividerClass(page.theme)} />
                  <div className="kx-live-address">lnkmx.my/{page.name.toLowerCase().replace(/\s+/g, '')}</div>
                </div>
              </RenderContextProvider>
            </div>
            </PageThemeProvider>
          </div>
        </div>
        <span className="kx-example-note" aria-hidden="true">{t('landing.kx.chips.c2', 'Портфолио')}<ArrowUpRight className="h-4 w-4" /></span>
      </div>
      <a className="kx-example-gallery" href="/gallery">{t('landing.kx.nav.examples', 'Примеры')}<ArrowUpRight className="h-4 w-4" /></a>
    </div>
  );
}
