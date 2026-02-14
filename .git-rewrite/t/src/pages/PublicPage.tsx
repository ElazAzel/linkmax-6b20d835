import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Share2, QrCode } from 'lucide-react';
import { GridBlocksRenderer } from '@/components/blocks/GridBlocksRenderer';
import { ChatbotWidget } from '@/components/ChatbotWidget';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { FreemiumWatermark } from '@/components/FreemiumWatermark';
import { SEOHead } from '@/components/SEOHead';
import { decompressPageData } from '@/lib/compression';
import { usePublicPage } from '@/hooks/usePageCache';
import { AnalyticsProvider } from '@/hooks/useAnalyticsTracking';
import { useHeatmapTracking } from '@/hooks/useHeatmapTracking';
import { trackShare } from '@/services/analytics';
import { checkPremiumStatus } from '@/services/user';
import { toast } from 'sonner';
import type { PageData, PageBackground } from '@/types/page';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';

export default function PublicPage() {
  const { compressed, slug } = useParams<{ compressed?: string; slug?: string }>();
  const [compressedPageData, setCompressedPageData] = useState<PageData | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showWatermark, setShowWatermark] = useState(true);
  const currentUrl = window.location.href;

  // Use React Query for slug-based pages (with caching)
  const { data: cachedPageData, isLoading: isLoadingCached, error } = usePublicPage(slug);

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

  // Enable heatmap tracking for published pages
  useHeatmapTracking(pageData?.id, !!slug && !!pageData?.id);

  // Build canonical URL for SEO
  const canonicalUrl = useMemo(() => {
    if (slug) {
      return `https://lnkmx.my/${slug}`;
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
        title: pageData?.seo.title || 'Check out my LinkMAX',
        url: currentUrl,
      }).catch(() => {
        navigator.clipboard.writeText(currentUrl);
        toast.success('Link copied to clipboard');
      });
    } else {
      navigator.clipboard.writeText(currentUrl);
      toast.success('Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading page...</p>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Page not found</h1>
          <p className="text-muted-foreground">Invalid or corrupted link</p>
        </div>
      </div>
    );
  }

  // Get background style from theme
  const getPageBackgroundStyle = (background?: PageBackground): React.CSSProperties => {
    if (!background) return {};
    
    switch (background.type) {
      case 'solid':
        return { backgroundColor: background.value };
      case 'gradient':
        const colors = background.value.split(',').map(c => c.trim());
        return { 
          background: `linear-gradient(${background.gradientAngle || 135}deg, ${colors.join(', ')})` 
        };
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

  const customBackground = pageData.theme?.customBackground;
  const backgroundStyle = getPageBackgroundStyle(customBackground);

  return (
    <>
      {/* Dynamic SEO meta tags */}
      <SEOHead pageData={pageData} pageUrl={canonicalUrl} />
    <AnalyticsProvider pageId={pageData?.id} enabled={!!slug}>
      <div 
        className="min-h-screen bg-background"
        style={backgroundStyle}
      >
        {/* Language Switcher - Top Right */}
        <div className="fixed top-4 right-4 z-50">
          <LanguageSwitcher />
        </div>

        <div className="container max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {/* Grid Blocks - Same layout as editor */}
          <GridBlocksRenderer
            blocks={pageData.blocks}
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
              Share Link
            </Button>
            <Button variant="outline" onClick={() => setShowQR(true)} className="w-full sm:w-auto">
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </Button>
          </div>

          {/* Branding - hidden when watermark is shown */}
          {!showWatermark && (
            <div className="mt-8 sm:mt-12 text-center pb-4">
              <a
                href="/"
                className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Create your own LinkMAX
              </a>
            </div>
          )}
          
          {/* Extra padding for watermark */}
          {showWatermark && <div className="h-16" />}
        </div>
      
      {/* Freemium Watermark */}
      <FreemiumWatermark show={showWatermark && !pageData?.isPremium} />

      {/* QR Dialog */}
      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>QR Code</DialogTitle>
            <DialogDescription>
              Scan this code to share your page
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-6">
            <QRCodeSVG value={currentUrl} size={256} level="H" />
          </div>
        </DialogContent>
      </Dialog>

        {/* AI Chatbot Widget */}
        {slug && <ChatbotWidget pageSlug={slug} />}
      </div>
    </AnalyticsProvider>
    </>
  );
}
