import { render, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { i18nReady, loadLazyLocale } from '@/i18n/config';
import { SEOLandingHead } from './SEOLandingHead';

vi.mock('@tanstack/react-router', () => ({ useRouter: () => ({ state: { matches: [{ id: '/', pathname: '/' }] } }) }));
afterEach(() => { cleanup(); document.head.innerHTML = ''; });
it('supports the hosted router without updateMatch and keeps language metadata unique', async () => {
  await i18nReady; await loadLazyLocale('en');
  document.head.innerHTML = '<title>Old</title><meta name="description" content="old"><link rel="canonical" href="https://lnkmx.my/"><script type="application/ld+json">{"@graph":[{"@id":"https://lnkmx.my/#application"}]}</script>';
  const view = render(<SEOLandingHead currentLanguage="en" />);
  expect(document.title).toContain('Service');
  expect(document.documentElement.lang).toBe('en');
  expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1);
  expect(document.head.querySelectorAll('link[rel="canonical"]')).toHaveLength(1);
  expect(document.head.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
  view.rerender(<SEOLandingHead currentLanguage="ru" />);
  expect(document.title).toContain('сайт');
});

it('removes only newly created tags when leaving the landing page', async () => {
  await i18nReady;
  document.head.innerHTML = '<meta name="publisher" content="Keep me">';
  const view = render(<SEOLandingHead currentLanguage="ru" />);
  expect(document.head.querySelector('script[type="application/ld+json"]')).not.toBeNull();
  view.unmount();
  expect(document.head.querySelector('link[rel="alternate"]')).toBeNull();
  expect(document.head.querySelector('script[type="application/ld+json"]')).toBeNull();
  expect(document.head.querySelector('meta[name="description"]')).toBeNull();
  expect(document.head.querySelector('meta[name="publisher"]')).not.toBeNull();
});
