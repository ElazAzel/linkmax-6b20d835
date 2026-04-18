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

vi.mock('react-router-dom', () => ({
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

vi.mock('@/components/landing/v2/HeroSectionExpert', () => ({
  HeroSectionExpert: ({ onStart, onExamples }: { onStart: () => void; onExamples: () => void }) => (
    <div>
      <button onClick={onStart}>hero-start</button>
      <button onClick={onExamples}>hero-examples</button>
    </div>
  ),
}));

vi.mock('@/components/landing/v2/DynamicIslandNav', () => ({
  DynamicIslandNav: ({ onLogin, onSignup }: { onLogin: () => void; onSignup: () => void }) => (
    <div>
      <button onClick={onLogin}>nav-login</button>
      <button onClick={onSignup}>nav-signup</button>
    </div>
  ),
}));

vi.mock('@/components/seo/SEOMetaEnhancer', () => ({ SEOMetaEnhancer: () => <div /> }));
vi.mock('@/components/seo/GEOTagging', () => ({ GEOTagging: () => <div /> }));
vi.mock('@/components/seo/AEOOptimizer', () => ({ AEOOptimizer: () => <div /> }));
vi.mock('@/components/seo/AISearchOptimizer', () => ({ AISearchOptimizer: () => <div /> }));
vi.mock('@/components/landing/v2/LogoTicker', () => ({ LogoTicker: () => <div /> }));
vi.mock('@/components/landing/v2/BentoGridSection', () => ({ BentoGridSection: () => <div /> }));
vi.mock('@/components/landing/v2/InteractiveDemo', () => ({ InteractiveDemo: () => <div /> }));
vi.mock('@/components/landing/v2/Testimonials', () => ({ Testimonials: () => <div /> }));
vi.mock('@/components/landing/v2/PricingAurora', () => ({ PricingAurora: () => <div /> }));
vi.mock('@/components/landing/v2/PremiumFooter', () => ({ PremiumFooter: () => <div /> }));
vi.mock('@/components/landing/v2/BottomCTA', () => ({ BottomCTA: () => <div /> }));
vi.mock('@/components/landing/v2/GrainOverlay', () => ({ GrainOverlay: () => <div /> }));
vi.mock('@/components/landing/v2/LiquidCursor', () => ({ LiquidCursor: () => <div /> }));
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

  it('tracks signup and gallery CTA clicks with explicit event typing', () => {
    render(<Index />);

    fireEvent.click(screen.getByText('hero-start'));
    fireEvent.click(screen.getByText('hero-examples'));

    expect(trackCtaClickMock).toHaveBeenCalledWith('signup', 'hero_cta');
    expect(trackCtaClickMock).toHaveBeenCalledWith('gallery', 'hero_examples');
    expect(navigateMock).toHaveBeenCalledWith('/auth');
    expect(navigateMock).toHaveBeenCalledWith('/gallery');
  });

  it('tracks login CTA separately from signup CTA', () => {
    render(<Index />);

    fireEvent.click(screen.getByText('nav-login'));
    fireEvent.click(screen.getByText('nav-signup'));

    expect(trackCtaClickMock).toHaveBeenCalledWith('login', 'nav_login');
    expect(trackCtaClickMock).toHaveBeenCalledWith('signup', 'nav_signup');
  });

  it('attaches section observer refs to rendered DOM wrappers', () => {
    render(<Index />);

    expect(observerRefs).toHaveLength(4);
    observerRefs.forEach((ref) => {
      expect(ref.current).not.toBeNull();
    });
  });
});
