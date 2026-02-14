import { lazy, Suspense, useCallback } from 'react';
import type { Block } from '@/types/page';
import { Skeleton } from '@/components/ui/skeleton';
import { getAnimationClass, getAnimationStyle } from '@/lib/animation-utils';
import { useAnalytics } from '@/hooks/useAnalyticsTracking';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import { useTranslation } from 'react-i18next';

// Helper function to check if block should be visible based on schedule
function isBlockVisible(block: Block): boolean {
  if (!block.schedule) return true;
  
  const now = new Date();
  const { startDate, endDate } = block.schedule;
  
  if (startDate) {
    const start = new Date(startDate);
    if (now < start) return false;
  }
  
  if (endDate) {
    const end = new Date(endDate);
    if (now > end) return false;
  }
  
  return true;
}

// Lazy load all block components for optimal code splitting
const ProfileBlock = lazy(() => import('./blocks/ProfileBlock').then(m => ({ default: m.ProfileBlock })));
const LinkBlock = lazy(() => import('./blocks/LinkBlock').then(m => ({ default: m.LinkBlock })));
const ButtonBlock = lazy(() => import('./blocks/ButtonBlock').then(m => ({ default: m.ButtonBlock })));
const SocialsBlock = lazy(() => import('./blocks/SocialsBlock').then(m => ({ default: m.SocialsBlock })));
const TextBlock = lazy(() => import('./blocks/TextBlock').then(m => ({ default: m.TextBlock })));
const ImageBlock = lazy(() => import('./blocks/ImageBlock').then(m => ({ default: m.ImageBlock })));
const ProductBlock = lazy(() => import('./blocks/ProductBlock').then(m => ({ default: m.ProductBlock })));
const VideoBlock = lazy(() => import('./blocks/VideoBlock').then(m => ({ default: m.VideoBlock })));
const CarouselBlock = lazy(() => import('./blocks/CarouselBlock').then(m => ({ default: m.CarouselBlock })));
const SearchBlock = lazy(() => import('./blocks/SearchBlock').then(m => ({ default: m.SearchBlock })));
const CustomCodeBlock = lazy(() => import('./blocks/CustomCodeBlock').then(m => ({ default: m.CustomCodeBlock })));
const MessengerBlock = lazy(() => import('./blocks/MessengerBlock').then(m => ({ default: m.MessengerBlock })));
const FormBlock = lazy(() => import('./blocks/FormBlock').then(m => ({ default: m.FormBlock })));
const DownloadBlock = lazy(() => import('./blocks/DownloadBlock').then(m => ({ default: m.DownloadBlock })));
const NewsletterBlock = lazy(() => import('./blocks/NewsletterBlock').then(m => ({ default: m.NewsletterBlock })));
const TestimonialBlock = lazy(() => import('./blocks/TestimonialBlock').then(m => ({ default: m.TestimonialBlock })));
const ScratchBlock = lazy(() => import('./blocks/ScratchBlock').then(m => ({ default: m.ScratchBlock })));
const MapBlock = lazy(() => import('./blocks/MapBlock').then(m => ({ default: m.MapBlock })));
const AvatarBlock = lazy(() => import('./blocks/AvatarBlock').then(m => ({ default: m.AvatarBlock })));
const SeparatorBlock = lazy(() => import('./blocks/SeparatorBlock').then(m => ({ default: m.SeparatorBlock })));
const CatalogBlock = lazy(() => import('./blocks/CatalogBlock').then(m => ({ default: m.CatalogBlock })));
const BeforeAfterBlock = lazy(() => import('./blocks/BeforeAfterBlock').then(m => ({ default: m.BeforeAfterBlock })));
const FAQBlock = lazy(() => import('./blocks/FAQBlock').then(m => ({ default: m.FAQBlock })));
const CountdownBlock = lazy(() => import('./blocks/CountdownBlock').then(m => ({ default: m.CountdownBlock })));
const PricingBlock = lazy(() => import('./blocks/PricingBlock').then(m => ({ default: m.PricingBlock })));
const ShoutoutBlock = lazy(() => import('./blocks/ShoutoutBlock').then(m => ({ default: m.ShoutoutBlock })));
const BookingBlock = lazy(() => import('./blocks/BookingBlock').then(m => ({ default: m.BookingBlock })));

interface BlockRendererProps {
  block: Block;
  isPreview?: boolean;
  pageOwnerId?: string;
}

// Loading skeleton for blocks
const BlockSkeleton = () => (
  <div className="w-full">
    <Skeleton className="h-24 w-full rounded-lg" />
  </div>
);

/**
 * Get block title for analytics
 */
function getBlockTitle(block: Block, lang: SupportedLanguage): string {
  const content = block as any;
  const rawTitle = content.title || content.name || content.content?.title || content.content?.name || block.type;
  return typeof rawTitle === 'object' ? getTranslatedString(rawTitle, lang) : String(rawTitle || block.type);
}

export function BlockRenderer({ block, isPreview, pageOwnerId }: BlockRendererProps) {
  const { onBlockClick } = useAnalytics();
  const { i18n } = useTranslation();
  
  // Check if block should be visible based on schedule
  // In preview mode, always show blocks
  if (!isPreview && !isBlockVisible(block)) {
    return null;
  }

  const animationClass = getAnimationClass(block.blockStyle);
  const animationStyle = getAnimationStyle(block.blockStyle);

  // Click handler for tracking
  const handleClick = useCallback(() => {
    if (!isPreview) {
      const title = getBlockTitle(block, i18n.language as SupportedLanguage);
      onBlockClick(block.id, block.type, title);
    }
  }, [block, isPreview, onBlockClick, i18n.language]);

  // Wrapper component for all blocks - tracks clicks for interactive ones
  const TrackableWrapper = ({ children, trackClicks = false }: { children: React.ReactNode; trackClicks?: boolean }) => (
    <div className={animationClass} style={animationStyle} onClick={trackClicks ? handleClick : undefined}>
      {children}
    </div>
  );

  // For blocks that need click tracking passed as prop
  const handleTrackClick = handleClick;

  switch (block.type) {
    case 'profile':
      return (
        <Suspense fallback={<BlockSkeleton />}>
          <ProfileBlock block={block} isPreview={isPreview} />
        </Suspense>
      );
    case 'link':
      return (
        <TrackableWrapper trackClicks>
          <Suspense fallback={<BlockSkeleton />}>
            <LinkBlock block={block} onClick={handleTrackClick} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'button':
      return (
        <TrackableWrapper trackClicks>
          <Suspense fallback={<BlockSkeleton />}>
            <ButtonBlock block={block} onClick={handleTrackClick} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'socials':
      return (
        <TrackableWrapper trackClicks>
          <Suspense fallback={<BlockSkeleton />}>
            <SocialsBlock block={block} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'text':
      return (
        <div className={animationClass} style={animationStyle}>
          <Suspense fallback={<BlockSkeleton />}>
            <TextBlock block={block} />
          </Suspense>
        </div>
      );
    case 'image':
      return (
        <div className={animationClass} style={animationStyle}>
          <Suspense fallback={<BlockSkeleton />}>
            <ImageBlock block={block} />
          </Suspense>
        </div>
      );
    case 'product':
      return (
        <TrackableWrapper trackClicks>
          <Suspense fallback={<BlockSkeleton />}>
            <ProductBlock block={block} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'video':
      return (
        <TrackableWrapper trackClicks>
          <Suspense fallback={<BlockSkeleton />}>
            <VideoBlock block={block} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'carousel':
      return (
        <TrackableWrapper trackClicks>
          <Suspense fallback={<BlockSkeleton />}>
            <CarouselBlock block={block} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'search':
      return (
        <div className={animationClass} style={animationStyle}>
          <Suspense fallback={<BlockSkeleton />}>
            <SearchBlock block={block} />
          </Suspense>
        </div>
      );
    case 'custom_code':
      return (
        <div className={animationClass} style={animationStyle}>
          <Suspense fallback={<BlockSkeleton />}>
            <CustomCodeBlock block={block} />
          </Suspense>
        </div>
      );
    case 'messenger':
      return (
        <TrackableWrapper trackClicks>
          <Suspense fallback={<BlockSkeleton />}>
            <MessengerBlock block={block} pageOwnerId={pageOwnerId} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'form':
      return (
        <TrackableWrapper>
          <Suspense fallback={<BlockSkeleton />}>
            <FormBlock block={block} pageOwnerId={pageOwnerId} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'download':
      return (
        <TrackableWrapper trackClicks>
          <Suspense fallback={<BlockSkeleton />}>
            <DownloadBlock block={block} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'newsletter':
      return (
        <div className={animationClass} style={animationStyle}>
          <Suspense fallback={<BlockSkeleton />}>
            <NewsletterBlock block={block} />
          </Suspense>
        </div>
      );
    case 'testimonial':
      return (
        <div className={animationClass} style={animationStyle}>
          <Suspense fallback={<BlockSkeleton />}>
            <TestimonialBlock block={block} />
          </Suspense>
        </div>
      );
    case 'scratch':
      return (
        <div className={animationClass} style={animationStyle}>
          <Suspense fallback={<BlockSkeleton />}>
            <ScratchBlock block={block} />
          </Suspense>
        </div>
      );
    case 'map':
      return (
        <div className={animationClass} style={animationStyle}>
          <Suspense fallback={<BlockSkeleton />}>
            <MapBlock block={block} />
          </Suspense>
        </div>
      );
    case 'avatar':
      return (
        <div className={animationClass} style={animationStyle}>
          <Suspense fallback={<BlockSkeleton />}>
            <AvatarBlock block={block} />
          </Suspense>
        </div>
      );
    case 'separator':
      return (
        <div className={animationClass} style={animationStyle}>
          <Suspense fallback={<BlockSkeleton />}>
            <SeparatorBlock block={block} />
          </Suspense>
        </div>
      );
    case 'catalog':
      return (
        <TrackableWrapper trackClicks>
          <Suspense fallback={<BlockSkeleton />}>
            <CatalogBlock block={block} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'before_after':
      return (
        <TrackableWrapper trackClicks>
          <Suspense fallback={<BlockSkeleton />}>
            <BeforeAfterBlock block={block} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'faq':
      return (
        <TrackableWrapper trackClicks>
          <Suspense fallback={<BlockSkeleton />}>
            <FAQBlock block={block} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'countdown':
      return (
        <TrackableWrapper>
          <Suspense fallback={<BlockSkeleton />}>
            <CountdownBlock block={block} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'pricing':
      return (
        <TrackableWrapper trackClicks>
          <Suspense fallback={<BlockSkeleton />}>
            <PricingBlock block={block} />
          </Suspense>
        </TrackableWrapper>
      );
      case 'shoutout':
      return (
        <TrackableWrapper trackClicks>
          <Suspense fallback={<BlockSkeleton />}>
            <ShoutoutBlock 
              userId={(block as any).userId} 
              message={(block as any).message}
            />
          </Suspense>
        </TrackableWrapper>
      );
    case 'booking':
      return (
        <TrackableWrapper trackClicks>
          <Suspense fallback={<BlockSkeleton />}>
            <BookingBlock 
              block={block as any}
              pageOwnerId={pageOwnerId}
              pageId={undefined}
            />
          </Suspense>
        </TrackableWrapper>
      );
    default:
      return null;
  }
}
