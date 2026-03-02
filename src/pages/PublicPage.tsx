import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import QrCode from 'lucide-react/dist/esm/icons/qr-code';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import Copy from 'lucide-react/dist/esm/icons/copy';
import { GridBlocksRenderer } from '@/components/blocks/GridBlocksRenderer';
import { ChatbotWidget } from '@/components/chat/ChatbotWidget';
import { LanguageSwitcher } from '@/components/translation/LanguageSwitcher';
import { FreemiumWatermark } from '@/components/billing/FreemiumWatermark';
import { EnhancedSEOHead } from '@/components/seo/EnhancedSEOHead';
import { CrawlerFriendlyContent } from '@/components/seo/CrawlerFriendlyContent';
import { GEOEnhancedContent } from '@/components/seo/GEOEnhancedContent';
import { SEOMetaEnhancer } from '@/components/seo/SEOMetaEnhancer';
import { AISearchOptimizer } from '@/components/seo/AISearchOptimizer';
import { PublicPageSkeleton } from '@/components/public/PublicPageSkeleton';
import { PublicPageError } from '@/components/public/PublicPageError';
import { TrackingScripts } from '@/components/analytics/TrackingScripts';
import { decompressPageData } from '@/lib/utils/compression';
import { usePublicPage, usePublicPageByDomain } from '@/hooks/page/usePageCache';
import { AnalyticsProvider } from '@/hooks/analytics/useAnalyticsTracking';
import { useHeatmapTracking } from '@/hooks/analytics/useHeatmapTracking';
import { useLanguage } from '@/contexts/LanguageContext';
import { trackShare } from '@/services/analytics';
import { checkPremiumStatus } from '@/services/user';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/utils';
import { getAppDomain, getPublicPageUrl } from '@/lib/utils/url-helpers';
import type { PageData, PageBackground, Block } from '@/types/page';
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

export default function PublicPage() {
  const { t } = useTranslation();
  const { compressed, slug } = useParams<{ compressed?: string; slug?: string }>();
  const [compressedPageData, setCompressedPageData] = useState<PageData | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [translatedBlocks, setTranslatedBlocks] = useState<Block[] | null>(null);
  const currentUrl = window.location.href;

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

  // Use React Query for slug-based pages (with caching)
  const { data: slugPageData, isLoading: isLoadingSlug, error: slugError } = usePublicPage(slug);

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
  const loading = slug ? isLoadingCached : false;

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
  const ownerTier = ownerPremiumStatus?.tier || 'free';
  // Watermark always shows UNLESS premium/business user explicitly enabled hideBranding
  const showWatermark = !(isOwnerPremium && pageData?.hideBranding);

  // Resolve A/B testing variants
  const { blocks: experimentalBlocks, assignments } = usePageExperiments(pageData, visitorId);

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

  // Build canonical URL for SEO
  const canonicalUrl = useMemo(() => {
    if (slug) {
      return getPublicPageUrl(slug);
    }
    return window.location.href;
  }, [slug]);

  const handleShare = async () => {
    // Track share event
    if (pageData?.id) {
      trackShare(pageData.id, navigator.share ? 'native' : 'clipboard');
    }

    if (navigator.share) {
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

  const getPageBackgroundStyle = (background?: PageBackground): React.CSSProperties => {
    if (!background) return {};

    switch (background.type) {
      case 'solid':
        return { backgroundColor: background.value };
      case 'gradient': {
        const colors = background.value.split(',').map(c => c.trim());
        return {
          background: `linear-gradient(${background.gradientAngle || 135}deg, ${colors.join(', ')})`
        };
      }
      case 'image':
        return {
          backgroundImage: `url(${background.value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        };
      default:
        return {};
    }
  };

  const customBackground = pageData?.theme?.customBackground;
  const backgroundStyle = getPageBackgroundStyle(customBackground);

  return (
    <AnimatePresence mode="wait">
      {(loading || isTranslating) ? (
        <PublicPageSkeleton key="skeleton" />
      ) : !pageData ? (
        <PublicPageError key="error" type="not-found" />
      ) : (
        <motion.div
          key="content"
          className="min-h-screen bg-background"
          style={backgroundStyle}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Enhanced Auto-SEO with Schema.org and Quality Gate */}
          <EnhancedSEOHead
            pageData={pageData}
            pageUrl={canonicalUrl}
            updatedAt={new Date().toISOString()}
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
          />

          {/* Crawler-friendly content for no-JS fallback */}
          <CrawlerFriendlyContent
            blocks={displayBlocks}
            slug={slug || ''}
            updatedAt={new Date().toISOString()}
          />

          {/* GEO Enhanced Content - visible to crawlers even with JS enabled */}
          <GEOEnhancedContent
            blocks={displayBlocks}
            slug={slug || ''}
          />

          <AnalyticsProvider pageId={pageData?.id} enabled={!!slug}>
            <div>
              {/* Language Switcher - Top Right */}
              <div className="fixed top-4 right-4 z-50">
                <LanguageSwitcher />
              </div>

              <div className="container max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
                {/* Grid Blocks - Same layout as editor */}
                <GridBlocksRenderer
                  blocks={displayBlocks}
                  pageOwnerId={pageData?.userId}
                  pageId={pageData?.id}
                  isOwnerPremium={isOwnerPremium}
                  ownerTier={ownerTier}
                  isPreview={false}
                />

                {/* Share Section - Mobile Optimized */}
                <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-2 justify-center">
                  <Button variant="outline" onClick={handleShare} className="w-full sm:w-auto">
                    <Share2 className="h-4 w-4 mr-2" />
                    {t('share.shareLink', 'Поделиться')}
                  </Button>
                  <Button variant="outline" onClick={() => setShowQR(true)} className="w-full sm:w-auto">
                    <QrCode className="h-4 w-4 mr-2" />
                    {t('share.qrCode', 'QR-код')}
                  </Button>
                </div>

              {/* Branding - hidden when watermark is shown OR if white-label is active (premium only) */}
              {/* Branding handled by FreemiumWatermark */}

                {/* Extra padding for watermark */}
                {showWatermark && <div className="h-16" />}
              </div>

              {/* Freemium Watermark - always show for non-premium, ignore hideBranding for free users */}
              <FreemiumWatermark show={showWatermark} />

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

              {/* AI Chatbot Widget */}
              {slug && <ChatbotWidget pageSlug={slug} />}

              {/* Analytics Tracking Scripts */}
              {pageData?.integrations && (
                <TrackingScripts integrations={pageData.integrations} pageId={pageData.id} />
              )}
            </div>
          </AnalyticsProvider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
