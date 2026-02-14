import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Share2, QrCode } from 'lucide-react';
import { BlockRenderer } from '@/components/BlockRenderer';
import { ChatbotWidget } from '@/components/ChatbotWidget';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { FreemiumWatermark } from '@/components/FreemiumWatermark';
import { decompressPageData } from '@/lib/compression';
import { usePublicPage } from '@/hooks/usePageCache';
import { AnalyticsProvider } from '@/hooks/useAnalyticsTracking';
import { trackShare } from '@/services/analytics';
import { toast } from 'sonner';
import type { PageData } from '@/types/page';
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

  // Update document metadata when page data loads
  useEffect(() => {
    if (pageData) {
      document.title = pageData.seo.title;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', pageData.seo.description);
      }
    }
  }, [pageData]);

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

  return (
    <AnalyticsProvider pageId={pageData?.id} enabled={!!slug}>
      <div className="min-h-screen bg-background">
        {/* Language Switcher - Top Right */}
        <div className="fixed top-4 right-4 z-50">
          <LanguageSwitcher />
        </div>

        <div className="container max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          {/* Content - Respects editor mode */}
          {pageData.editorMode === 'grid' ? (
            <>
              <style>{`
                .public-grid-container {
                  display: grid;
                  gap: 0.75rem;
                  grid-template-columns: repeat(${pageData.gridConfig?.columnsMobile || 2}, 1fr);
                }
                @media (min-width: 640px) {
                  .public-grid-container { gap: 1rem; }
                }
                @media (min-width: 768px) {
                  .public-grid-container {
                    grid-template-columns: repeat(${pageData.gridConfig?.columnsDesktop || 3}, 1fr);
                  }
                }
              `}</style>
              <div className="public-grid-container">
                {pageData.blocks.map(block => {
                  const gridLayout = block.gridLayout;
                  const style = gridLayout ? {
                    gridColumn: `${gridLayout.gridColumn} / span ${gridLayout.gridWidth || 1}`,
                    gridRow: `${gridLayout.gridRow} / span ${gridLayout.gridHeight || 1}`,
                  } : {};
                  return (
                    <div key={block.id} style={style}>
                      <BlockRenderer block={block} pageOwnerId={pageData?.userId} />
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {pageData.blocks.map(block => (
                <BlockRenderer key={block.id} block={block} pageOwnerId={pageData?.userId} />
              ))}
            </div>
          )}

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
  );
}
