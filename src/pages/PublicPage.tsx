import { PageThemeProvider } from '@/lib/appearance/page-theme-provider';
import { useEffect, useState, useMemo, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from '@/lib/router-compat';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import QrCode from 'lucide-react/dist/esm/icons/qr-code';
import Copy from 'lucide-react/dist/esm/icons/copy';
// import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
// import Copy from 'lucide-react/dist/esm/icons/copy';
import { GridBlocksRenderer } from '@/components/blocks/GridBlocksRenderer';
import { FreemiumWatermark } from '@/components/billing/FreemiumWatermark';
import { EnhancedSEOHead } from '@/components/seo/EnhancedSEOHead';
import { CrawlerFriendlyContent } from '@/components/seo/CrawlerFriendlyContent';
import { GEOEnhancedContent } from '@/components/seo/GEOEnhancedContent';
import { SEOMetaEnhancer } from '@/components/seo/SEOMetaEnhancer';
import { AISearchOptimizer } from '@/components/seo/AISearchOptimizer';
import { PublicPageSkeleton } from '@/components/public/PublicPageSkeleton';
import { PublicPageError } from '@/components/public/PublicPageError';
import { SiteHeaderNav } from '@/components/public/SiteHeaderNav';
import { SiteFooter } from '@/components/public/SiteFooter';
import { StickyContactCTA } from '@/components/public/StickyContactCTA';
import { VerifiedReviewsSection } from '@/components/public/VerifiedReviewsSection';
import { SectionErrorBoundary } from '@/components/system/SectionErrorBoundary';

import { decompressPageData } from '@/lib/utils/compression';
import { usePublicPage, usePublicPageByDomain } from '@/hooks/page/usePageCache';
import { AnalyticsProvider } from '@/hooks/analytics/useAnalyticsTracking';
import { useHeatmapTracking } from '@/hooks/analytics/useHeatmapTracking';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackShare } from '@/services/analytics';
import { checkPremiumStatus } from '@/services/user';
import { clonePublicPageToUserTemplate } from '@/services/page-cloning';
import { recordGrowthEvent } from '@/services/viral-growth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/utils';
import { getAppDomain, getPublicPageUrl } from '@/lib/utils/url-helpers';
import { getBackgroundStyle, getPageThemeScope, getDividerClass, getThemeBackgroundStyle } from '@/lib/appearance/style-utils';
import { usePageFonts } from '@/hooks/page/usePageFonts';
import type { PageData, Block } from '@/types/page';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';

import { usePageExperiments } from '@/hooks/page/usePageExperiments';
import { getVisitorId } from '@/services/analytics';
import { supabase } from '@/platform/supabase/client';
import { extractPageContacts, PageContactsProvider } from '@/lib/blocks/page-contacts';
import { withPageHeader } from '@/lib/blocks/page-header';

const _ric = typeof requestIdleCallback === 'function' ? requestIdleCallback : (cb: () => void) => setTimeout(cb, 1);

const ChatbotWidget = lazy(() => import('@/components/chat/ChatbotWidget').then(m => ({ default: m.ChatbotWidget })));
const LanguageSwitcher = lazy(() => import('@/components/translation/LanguageSwitcher').then(m => ({ default: m.LanguageSwitcher })));
const TrackingScripts = lazy(() => import('@/components/analytics/TrackingScripts').then(m => ({ default: m.TrackingScripts })));

function getAnimationConfig(animationStyle?: PageData['theme']['animationStyle']) {
  switch (animationStyle) {
    case 'none':
      return { duration: 0, y: 0 };
    case 'energetic':
      return { duration: 0.35, y: 16 };
    default:
      return { duration: 0.6, y: 8 };
  }
}

interface PublicPageProps {
  /** Server snapshot of the page (src/routes/$slug/index.tsx) — rendered during SSR. */
  initialPage?: PageData | null;
  /** The route head already emits title, canonical and JSON-LD; skip the client copies. */
  headManagedByRoute?: boolean;
}

export default function PublicPage({ initialPage = null, headManagedByRoute = false }: PublicPageProps = {}) {
  const { t, i18n } = useTranslation();
  const { compressed, slug, pagePath } = useParams<{ compressed?: string; slug?: string; pagePath?: string }>();
  // Sprint 1: Multi-Page — when /:slug/p/:pagePath is hit, resolve to the sub-page's actual slug.
  const [resolvedSubSlug, setResolvedSubSlug] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (slug && pagePath) {
      import('@/services/sites').then(({ loadSitePageByPath, loadSiteRedirectsByHomeSlug, matchRedirect }) =>
        loadSitePageByPath(slug, pagePath).then((sub) => {
          if (cancelled) return;
          if (sub) {
            import('@/integrations/supabase/client').then(({ supabase }) =>
              supabase.from('pages').select('slug').eq('id', sub.id).maybeSingle().then(({ data }) => {
                if (!cancelled && data?.slug) setResolvedSubSlug(data.slug);
              })
            );
            return;
          }
          // Sub-page not found — try a site-level redirect before showing error.
          loadSiteRedirectsByHomeSlug(slug).then((redirects) => {
            if (cancelled) return;
            const hit = matchRedirect(redirects, pagePath);
            if (!hit) return;
            const dest = hit.to;
            if (/^https?:\/\//i.test(dest)) {
              window.location.replace(dest);
            } else {
              const path = dest.startsWith('/') ? dest : `/${slug}/p/${dest.replace(/^p\//, '')}`;
              window.location.replace(path);
            }
          });
        })
      );
    } else {
      setResolvedSubSlug(null);
    }
    return () => { cancelled = true; };
  }, [slug, pagePath]);
  const effectiveSlug = pagePath ? (resolvedSubSlug ?? undefined) : slug;
  const [compressedPageData, setCompressedPageData] = useState<PageData | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [translatedBlocks, setTranslatedBlocks] = useState<Block[] | null>(null);
  const [enhancementsReady, setEnhancementsReady] = useState(false);
  const [cloningPage, setCloningPage] = useState(false);

  const visitorId = useMemo(() => getVisitorId(), []);

  // Language context for auto-translation
  // ... rest of the component

  // Language context for auto-translation
  const { currentLanguage, translateBlocksToLanguage, isTranslating, autoTranslateEnabled } = useLanguage();

  // Perform custom domain check
  const [customDomain, setCustomDomain] = useState<string | null>(null);

  useEffect(() => {
    const hostname = window.location.hostname;
    // Check if hostname is not a platform domain
    const isPlatformDomain =
      hostname.endsWith('lnkmx.my') ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.vercel.app') ||
      hostname.endsWith('.lovableproject.com') ||
      hostname.endsWith('.lovable.app');

    if (!isPlatformDomain) {
      setCustomDomain(hostname);
    }
  }, []);

  // Progressive hydration for non-critical widgets
  useEffect(() => {
    let active = true;
    const start = () => {
      if (active) setEnhancementsReady(true);
    };

    _ric(start);
    const timer = setTimeout(start, 1500);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  // Use React Query for slug-based pages (with caching)
  // The server snapshot shows real content at once; the client query still runs (and counts the view).
  const { data: slugPageData, isLoading: isLoadingSlug, error: slugError } = usePublicPage(
    effectiveSlug,
    !pagePath && initialPage && initialPage.slug === slug ? initialPage : undefined,
  );

  // Use React Query for custom domain based pages
  const { data: domainPageData, isLoading: isLoadingDomain, error: domainError } = usePublicPageByDomain(customDomain || undefined);

  const cachedPageData = customDomain ? domainPageData : slugPageData;
  const isLoadingCached = customDomain ? isLoadingDomain : isLoadingSlug;
  const error = customDomain ? domainError : slugError;

  // Handle compressed format (old format, no caching)
  useEffect(() => {
    if (compressed) {
      const data = decompressPageData(compressed);
      setCompressedPageData(data);
    }
  }, [compressed]);

  // Determine which data source to use
  const pageData = slug ? cachedPageData : compressedPageData;
  const loading = slug ? (isLoadingCached || (!!pagePath && !resolvedSubSlug)) : false;

  // Check if page owner is premium (for auto-verification badge)
  const { data: ownerPremiumStatus } = useQuery({
    queryKey: ['ownerPremium', pageData?.userId],
    queryFn: async () => {
      if (!pageData?.userId) return { isPremium: false, tier: 'free' as const };
      return checkPremiumStatus(pageData.userId);
    },
    enabled: !!pageData?.userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const isOwnerPremium = ownerPremiumStatus?.isPremium || false;
  const ownerTier = (ownerPremiumStatus?.tier || 'identity') as 'identity' | 'starter' | 'pro' | 'business';
  // Watermark always shows UNLESS premium/business user explicitly enabled hideBranding
  const showWatermark = !(isOwnerPremium && pageData?.hideBranding);

  // Resolve A/B testing variants
  const { blocks: experimentalBlocks, assignments } = usePageExperiments(pageData as PageData | null, visitorId);

  // Enable heatmap tracking for published pages
  useHeatmapTracking(pageData?.id, !!slug && !!pageData?.id);

  // Auto-translate blocks when language changes
  useEffect(() => {
    if (!experimentalBlocks || experimentalBlocks.length === 0 || !autoTranslateEnabled) {
      setTranslatedBlocks(null);
      return;
    }

    // Translate blocks to current language
    translateBlocksToLanguage(experimentalBlocks as any[], currentLanguage).then((translated) => {
      if (translated !== experimentalBlocks as any) {
        setTranslatedBlocks(translated as any);
      }
    });
  }, [experimentalBlocks, currentLanguage, translateBlocksToLanguage, autoTranslateEnabled]);

  // Use translated blocks if available, otherwise original resolved blocks
  const displayBlocks = translatedBlocks || experimentalBlocks || [];
  const pageContacts = useMemo(() => extractPageContacts(displayBlocks as Block[], i18n.language), [displayBlocks, i18n.language]);

  // Build canonical URL for SEO
  const canonicalUrl = useMemo(() => {
    if (slug) {
      return getPublicPageUrl(slug, pagePath);
    }
    return typeof window !== 'undefined' ? window.location.href : getAppDomain();
  }, [slug, pagePath]);
  // Share the clean canonical address (same on server and client, no tracking params).
  const currentUrl = canonicalUrl;

  const handleShare = async () => {
    const canNativeShare = 'share' in navigator;

    // Track share event
    if (pageData?.id) {
      trackShare(pageData.id, canNativeShare ? 'native' : 'clipboard');
    }

    if (canNativeShare) {
      navigator.share({
        title: pageData?.seo?.title || pageData?.seo?.description || t('share.defaultTitle', 'Check out my page'),
        url: currentUrl,
      }).catch(() => {
        navigator.clipboard.writeText(currentUrl);
        toast.success(t('share.linkCopied', 'Ссылка скопирована'));
      });
    } else {
      navigator.clipboard.writeText(currentUrl);
      toast.success(t('share.linkCopied', 'Ссылка скопирована'));
    }
  };

  const handleClonePage = async () => {
    if (!pageData || cloningPage) return;
    setCloningPage(true);
    try {
      const templateId = await clonePublicPageToUserTemplate(pageData);
      if (!templateId) {
        const { data: authData } = await supabase.auth.getUser();
        if (!authData.user) {
          toast.success(t('growth.clone.authRedirect', 'Войдите — после входа копия сохранится в ваших шаблонах.'));
          window.location.assign('/auth?source=page-clone');
        } else {
          toast.error(t('growth.clone.error', 'Не удалось сохранить копию'));
        }
        return;
      }

      const referralCode = new URLSearchParams(window.location.search).get('ref');
      if (referralCode) {
        void recordGrowthEvent({
          code: referralCode,
          eventName: 'template_cloned',
          pageId: pageData.id,
          metadata: { source: 'public-page', templateId },
        });
      }
      toast.success(t('growth.clone.success', 'Копия сохранена в ваших шаблонах'));
    } finally {
      setCloningPage(false);
    }
  };

  // Load the theme's web fonts (only Inter/Manrope ship with index.html)
  usePageFonts(pageData?.theme);

  const customBackground = pageData?.theme?.customBackground;
  const bgResult = getBackgroundStyle(customBackground);
  const pageAnimation = getAnimationConfig(pageData?.theme?.animationStyle);
  // One theme → CSS mapping shared with the editor canvas (WYSIWYG)
  const themeScope = getPageThemeScope(pageData?.theme);
  const dividerClass = getDividerClass(pageData?.theme);
  const themeBackgroundStyle = getThemeBackgroundStyle(pageData?.theme);

  return (
    <PageThemeProvider scope={themeScope}>
    <AnimatePresence mode="wait">
      {(loading || isTranslating) ? (
        <PublicPageSkeleton key="skeleton" />
      ) : !pageData ? (
        <PublicPageError key="error" type="not-found" />
      ) : (
        <motion.div
          key="content"
          className={cn(
            'min-h-screen bg-background text-foreground relative',
            themeScope.className,
          )}
          data-testid="public-page-root"
          style={{
            ...themeScope.style,
            ...themeBackgroundStyle,
          }}
          initial={initialPage ? false : { opacity: 0, y: pageAnimation.y }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: pageAnimation.duration }}
        >
          {/* Background layer — isolated so filter/blur doesn't affect content */}
          <div
            aria-hidden
            className={cn('pointer-events-none fixed inset-0 z-0', bgResult.className)}
            style={bgResult.style}
          />
          {bgResult.overlay && (
            <div aria-hidden style={{ ...bgResult.overlay, position: 'fixed' }} />
          )}
          <div className="relative z-[1]">
          {/* Enhanced Auto-SEO with Schema.org and Quality Gate (client-only routes) */}
          {!headManagedByRoute && <>
          <EnhancedSEOHead
            pageData={pageData}
            pageUrl={canonicalUrl}
            updatedAt={pageData?.updatedAt || new Date().toISOString()}
            isNewAccount={false}
          />
          <SEOMetaEnhancer
            pageUrl={canonicalUrl}
            pageTitle={pageData.seo?.title || pageData.slug || 'Profile'}
            pageDescription={pageData.seo?.description || t('publicPage.defaultDescription', 'View my profile')}
            imageUrl={`${getAppDomain()}/og-default.png`}
            imageAlt={pageData.seo?.title || pageData.slug}
            type="profile"
          />
          <AISearchOptimizer
            pageType="profile"
            primaryQuestion={`Who is ${pageData.seo?.title || pageData.slug}?`}
            primaryAnswer={pageData.seo?.description || `Professional profile of ${pageData.seo?.title || pageData.slug} created with lnkmx`}
            entityName={pageData.seo?.title || pageData.slug || 'User Profile'}
            entityCategory="Personal Profile, Professional Page, Portfolio"
            useCases={[
              'View professional profile',
              'Contact for services',
              'Browse portfolio',
              'Connect on social media',
            ]}
            targetAudience={[
              'Potential clients',
              'Collaborators',
              'Social media followers',
              'Business contacts',
            ]}
            problemStatement="Need a simple professional landing page to showcase work and accept leads"
            solutionStatement="lnkmx profile page with custom blocks, CTAs, and lead capture forms"
            manageRobots={false}
            citationAuthor={pageData.seo?.title || pageData.slug || 'User Profile'}
            citationDate={pageData?.updatedAt || undefined}
          />
          </>}

          {/* Crawler-friendly content for no-JS fallback */}
          <CrawlerFriendlyContent
            blocks={displayBlocks}
            slug={slug || ''}
            updatedAt={pageData?.updatedAt || new Date().toISOString()}
          />

          {/* GEO Enhanced Content — hidden copy for crawlers; not needed once the real page is server-rendered */}
          {!headManagedByRoute && (
            <GEOEnhancedContent
              blocks={displayBlocks}
              slug={slug || ''}
            />
          )}

          <AnalyticsProvider pageId={pageData?.id} enabled={!!slug}>
            <PageContactsProvider value={pageContacts}>
            <div>
              {/* Language switcher: top right of the page, scrolls away with it.
                  As a fixed button it floated over blocks the whole time. */}
              <div className="absolute top-4 right-4 z-50">
                {enhancementsReady ? (
                  <Suspense fallback={<div className="h-9 w-9 rounded-lg bg-background/70 animate-pulse" />}>
                    <LanguageSwitcher />
                  </Suspense>
                ) : (
                  <div className="h-9 w-9 rounded-lg bg-background/70 animate-pulse" />
                )}
              </div>

              <SectionErrorBoundary name="site-header-nav" compact>
                <SiteHeaderNav ownerUserId={pageData?.userId} currentPageId={pageData?.id} />
              </SectionErrorBoundary>

              <div className="lm-page-width py-4">
                {/* Grid Blocks - Same layout as editor */}
                <SectionErrorBoundary name="page-blocks">
                  <GridBlocksRenderer
                    blocks={withPageHeader(displayBlocks as Block[], pageData)}
                    pageOwnerId={pageData?.userId}
                    pageId={pageData?.id}
                    isOwnerPremium={isOwnerPremium}
                    ownerTier={ownerTier}
                    isPreview={false}
                    className={dividerClass}
                    // Server-rendered content must be visible before JS: no entrance fade.
                    animation={initialPage ? 'none' : pageData?.theme?.animationStyle}
                  />
                </SectionErrorBoundary>

                <SectionErrorBoundary name="verified-reviews" compact>
                  <VerifiedReviewsSection pageId={pageData?.id} />
                </SectionErrorBoundary>


                {/* Share: one quiet row, the clone offer as a small link. Readable contrast regardless of page theme. */}
                <div className="mt-8 space-y-3 [color:hsl(var(--foreground))]">
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" onClick={handleShare} className="h-11 rounded-full border-black/10 px-5 font-medium !text-foreground !bg-background shadow-[0_1px_3px_rgb(0_0_0/0.08)] hover:!bg-muted">
                      <Share2 className="mr-2 h-4 w-4" />
                      {t('share.shareLink', 'Поделиться')}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowQR(true)}
                      aria-label={t('share.qrCode', 'QR-код')}
                      title={t('share.qrCode', 'QR-код')}
                      className="h-11 w-11 rounded-full border-black/10 !text-foreground !bg-background shadow-[0_1px_3px_rgb(0_0_0/0.08)] hover:!bg-muted"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                  {pageData.viralSettings?.cloneable !== false && (
                    <button
                      type="button"
                      onClick={() => void handleClonePage()}
                      disabled={cloningPage}
                      className="mx-auto flex min-h-11 items-center gap-1.5 px-3 text-xs text-muted-foreground underline-offset-4 hover:underline disabled:opacity-60"
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      {cloningPage ? t('growth.clone.saving', 'Сохраняем…') : t('growth.clone.button', 'Создать копию')}
                    </button>
                  )}
                </div>


              {/* Branding - hidden when watermark is shown OR if white-label is active (premium only) */}
              {/* Branding handled by FreemiumWatermark */}

                {/* Extra padding for watermark */}
                <FreemiumWatermark show={showWatermark} slug={slug} />
                <div className="h-20 sm:hidden" />
              </div>

              <SectionErrorBoundary name="site-footer" compact>
                <SiteFooter ownerUserId={pageData?.userId} />
              </SectionErrorBoundary>

              {/* Mobile sticky contact capsule — Quiet Bento Sprint E */}
              <SectionErrorBoundary name="sticky-cta" fallback={null}>
                <StickyContactCTA blocks={displayBlocks as Block[]} pageId={pageData?.id} />
              </SectionErrorBoundary>



              {/* QR Dialog */}
              <Dialog open={showQR} onOpenChange={setShowQR}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('share.qrDialogTitle', 'QR Code')}</DialogTitle>
                    <DialogDescription>
                      {t('share.qrDialogDescription', 'Scan this code to share your page')}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-center p-6">
                    <QRCodeSVG value={currentUrl} size={256} level="H" />
                  </div>
                </DialogContent>
              </Dialog>

              {/* AI Chatbot Widget - Deterministic Expert Engine */}
              {enhancementsReady && slug && pageData && (
                <Suspense fallback={null}>
                  <ChatbotWidget 
                    pageId={pageData.id!}
                    userId={pageData.userId!}
                    pageSlug={slug} 
                    blocks={displayBlocks as Block[]} 
                    seo={pageData.seo} 
                    hideOnMobile={pageContacts.length > 0}
                  />
                </Suspense>
              )}

              {/* Analytics Tracking Scripts */}
              {enhancementsReady && pageData?.integrations && (
                <Suspense fallback={null}>
                  <TrackingScripts integrations={pageData.integrations} pageId={pageData.id} />
                </Suspense>
              )}
            </div>
            </PageContactsProvider>
          </AnalyticsProvider>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
    </PageThemeProvider>
  );
}
