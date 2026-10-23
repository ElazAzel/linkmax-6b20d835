import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Index from '../Index';

const navigateMock = vi.fn();
const trackCtaClickMock = vi.fn();
const trackSectionViewMock = vi.fn();
const trackMarketingEventMock = vi.fn();
const trackOnceMock = vi.fn();
const observerRefs: Array<React.RefObject<HTMLDivElement | null>> = [];

vi.mock('@/lib/router-compat', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'ru' },
  }),
}));

vi.mock('@/hooks/ui/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/hooks/analytics/useLandingAnalytics', () => ({
  useLandingAnalytics: () => ({
    trackCtaClick: trackCtaClickMock,
    trackSectionView: trackSectionViewMock,
  }),
  useSectionObserver: () => {
    const ref = React.createRef<HTMLDivElement>();
    observerRefs.push(ref);
    return ref;
  },
}));

vi.mock('@/hooks/analytics/useMarketingAnalytics', () => ({
  useMarketingAnalytics: () => ({
    trackMarketingEvent: trackMarketingEventMock,
    trackOnce: trackOnceMock,
  }),
}));

vi.mock('@/components/landing/SEOLandingHead', () => ({
  SEOLandingHead: () => <div data-testid="seo-head" />,
}));

vi.mock('@/components/landing/kx/KxHero', () => ({
  KxHero: ({ onStart }: { onStart: (slug?: string) => void }) => (
    <div>
      <button onClick={() => onStart()}>hero-start</button>
      <button onClick={() => onStart('aruzhan')}>hero-start-slug</button>
    </div>
  ),
}));

vi.mock('@/components/landing/kx/KxHeader', () => ({
  KxHeader: ({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) => (
    <div>
      <button onClick={onLogin}>nav-login</button>
      <button onClick={onSignup}>nav-signup</button>
    </div>
  ),
}));

vi.mock('@/components/landing/kx/KxSections', () => ({
  KxBuild: () => <div />,
  KxSteps: () => <div />,
  KxFaq: () => <div />,
  KxFooter: () => <div />,
  KxPricing: ({ onStart, onPricing }: { onStart: () => void; onPricing: () => void }) => (
    <div>
      <button onClick={onStart}>pricing-start</button>
      <button onClick={onPricing}>pricing-all</button>
    </div>
  ),
  KxCta: ({ onStart }: { onStart: (slug?: string) => void }) => <button onClick={() => onStart('dana')}>cta-start</button>,
}));

vi.mock('@/components/seo/SEOMetaEnhancer', () => ({ SEOMetaEnhancer: () => <div /> }));
vi.mock('@/components/seo/GEOTagging', () => ({ GEOTagging: () => <div /> }));
vi.mock('@/components/seo/AISearchOptimizer', () => ({ AISearchOptimizer: () => <div /> }));
vi.mock('@/components/landing/v2/PremiumFooter', () => ({ PremiumFooter: () => <div /> }));
vi.mock('@/components/ui/CanvasBackground', () => ({ CanvasBackground: () => <div /> }));

describe('Index (Landing Page)', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    trackCtaClickMock.mockReset();
    trackSectionViewMock.mockReset();
    trackMarketingEventMock.mockReset();
    trackOnceMock.mockReset();
    observerRefs.length = 0;
  });

  it('sends the claimed address from hero and final CTA into signup', () => {
    render(<Index />);

    fireEvent.click(screen.getByText('hero-start'));
    fireEvent.click(screen.getByText('hero-start-slug'));
    fireEvent.click(screen.getByText('cta-start'));

    expect(trackCtaClickMock).toHaveBeenCalledWith('signup', 'hero_cta');
    expect(trackCtaClickMock).toHaveBeenCalledWith('signup', 'final_cta');
    expect(navigateMock).toHaveBeenCalledWith('/auth');
    expect(navigateMock).toHaveBeenCalledWith('/auth?mode=signup&from=landing&slug=aruzhan');
    expect(navigateMock).toHaveBeenCalledWith('/auth?mode=signup&from=landing&slug=dana');
  });

  it('tracks login CTA separately from signup CTA', () => {
    render(<Index />);

    fireEvent.click(screen.getByText('nav-login'));
    fireEvent.click(screen.getByText('nav-signup'));

    expect(trackCtaClickMock).toHaveBeenCalledWith('login', 'nav_login');
    expect(trackCtaClickMock).toHaveBeenCalledWith('signup', 'nav_signup');
  });

  it('connects pricing actions to tracked routes', () => {
    render(<Index />);

    fireEvent.click(screen.getByText('pricing-start'));
    fireEvent.click(screen.getByText('pricing-all'));

    expect(trackCtaClickMock).toHaveBeenCalledWith('signup', 'pricing_free_cta');
    expect(trackCtaClickMock).toHaveBeenCalledWith('pricing', 'landing_pricing_cta');
    expect(navigateMock).toHaveBeenCalledWith('/pricing');
  });

  it('attaches section observer refs to rendered DOM wrappers', () => {
    render(<Index />);

    expect(observerRefs).toHaveLength(3);
    observerRefs.forEach((ref) => {
      expect(ref.current).not.toBeNull();
    });
  });
});
