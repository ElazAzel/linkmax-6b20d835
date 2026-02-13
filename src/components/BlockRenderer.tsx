import { lazy, Suspense, useCallback } from 'react';
import type { Block, ShoutoutBlock as ShoutoutBlockType, BookingBlock as BookingBlockType, CommunityBlock as CommunityBlockType, EventBlock as EventBlockType } from '@/types/page';
import type { PremiumTier } from '@/hooks/usePremiumStatus';
import { Skeleton } from '@/components/ui/skeleton';
import { getAnimationClass, getAnimationStyle } from '@/lib/animation-utils';
import { useAnalytics } from '@/hooks/useAnalyticsTracking';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { useTranslation } from 'react-i18next';
import { PaidBlockWrapper } from '@/components/blocks/PaidBlockWrapper';

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
const CommunityBlock = lazy(() => import('./blocks/CommunityBlock').then(m => ({ default: m.CommunityBlock })));
const EventBlock = lazy(() => import('./blocks/EventBlock').then(m => ({ default: m.EventBlock })));

interface BlockRendererProps {
  block: Block;
  isPreview?: boolean;
  pageOwnerId?: string;
  pageId?: string;
  isOwnerPremium?: boolean;
  ownerTier?: PremiumTier;
}

// Loading skeleton for blocks
const BlockSkeleton = () => (
  <div className="w-full">
    <Skeleton className="h-24 w-full rounded-lg" />
  </div>
);

/**
 * Get block title for analytics - type-safe extraction
 */
function getBlockTitle(block: Block, lang: SupportedLanguage): string {
  // Guard against undefined block
  if (!block || typeof block !== 'object' || !('type' in block)) {
    return 'unknown';
  }

  // Type-safe title extraction using discriminated union
  let rawTitle: string | { ru?: string; en?: string; kk?: string } | undefined;

  switch (block.type) {
    case 'profile':
    case 'product':
    case 'avatar':
      // @ts-ignore - safe access for mixed block types
      rawTitle = block?.name;
      break;
    case 'link':
    case 'button':
    case 'video':
    case 'carousel':
    case 'custom_code':
    case 'messenger':
    case 'form':
    case 'download':
    case 'newsletter':
    case 'testimonial':
    case 'scratch':
    case 'catalog':
    case 'before_after':
    case 'faq':
    case 'countdown':
    case 'pricing':
    case 'booking':
    case 'community':
    case 'socials':
      // @ts-ignore - safe access for mixed block types
      rawTitle = block?.title;
      break;
    case 'text':
      // @ts-ignore - safe access for mixed block types
      rawTitle = block?.content;
      break;
    case 'event':
      // @ts-ignore - safe access for mixed block types
      rawTitle = block?.title;
      break;
    case 'shoutout':
      // @ts-ignore - safe access for mixed block types
      rawTitle = block?.displayName || block?.username;
      break;
    case 'image':
      // @ts-ignore - safe access for mixed block types
      rawTitle = block?.alt;
      break;
    case 'map':
      // @ts-ignore - safe access for mixed block types
      rawTitle = block?.address;
      break;
    case 'separator':
      rawTitle = 'separator';
      break;
  }

  if (!rawTitle) return block.type;
  return typeof rawTitle === 'object' ? getI18nText(rawTitle, lang) : String(rawTitle);
}

export function BlockRenderer({ block, isPreview, pageOwnerId, pageId, isOwnerPremium, ownerTier }: BlockRendererProps) {
  const { onBlockClick } = useAnalytics();
  const { i18n } = useTranslation();

  // Click handler for tracking - must be before any conditional returns
  const handleClick = useCallback(() => {
    if (!isPreview) {
      const title = getBlockTitle(block, i18n.language as SupportedLanguage);
      onBlockClick(block.id, block.type, title);
    }
  }, [block, isPreview, onBlockClick, i18n.language]);

  // Check if block should be visible based on schedule
  // In preview mode, always show blocks
  if (!isPreview && !isBlockVisible(block)) {
    return null;
  }

  const animationClass = getAnimationClass(block.blockStyle);
  const animationStyle = getAnimationStyle(block.blockStyle);

  // Wrapper component for all blocks - NO onClick here, blocks handle their own tracking
  const TrackableWrapper = ({ children }: { children: React.ReactNode }) => (
    <PaidBlockWrapper
      blockId={block.id}
      blockStyle={block.blockStyle}
      pageOwnerId={pageOwnerId}
      isPreview={isPreview}
    >
      <div className={animationClass} style={animationStyle}>
        {children}
      </div>
    </PaidBlockWrapper>
  );

  // For blocks that need click tracking passed as prop
  const handleTrackClick = handleClick;

  switch (block.type) {
    case 'profile':
      return (
        <Suspense fallback={<BlockSkeleton />}>
          <ProfileBlock block={block} isPreview={isPreview} isOwnerPremium={isOwnerPremium} ownerTier={ownerTier} />
        </Suspense>
      );
    case 'link':
      return (
        <TrackableWrapper>
          <Suspense fallback={<BlockSkeleton />}>
            <LinkBlock block={block} onClick={handleTrackClick} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'button':
      return (
        <TrackableWrapper>
          <Suspense fallback={<BlockSkeleton />}>
            <ButtonBlock block={block} onClick={handleTrackClick} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'socials':
      return (
        <TrackableWrapper>
          <Suspense fallback={<BlockSkeleton />}>
            <SocialsBlock block={block} onPlatformClick={handleTrackClick} />
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
        <TrackableWrapper>
          <Suspense fallback={<BlockSkeleton />}>
            <ImageBlock block={block} onClick={handleTrackClick} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'product':
      return (
        <TrackableWrapper>
          <Suspense fallback={<BlockSkeleton />}>
            <ProductBlock block={block} onClick={handleTrackClick} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'video':
      return (
        <TrackableWrapper>
          <Suspense fallback={<BlockSkeleton />}>
            <VideoBlock block={block} onClick={handleTrackClick} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'carousel':
      return (
        <TrackableWrapper>
          <Suspense fallback={<BlockSkeleton />}>
            <CarouselBlock block={block} onClick={handleTrackClick} />
          </Suspense>
        </TrackableWrapper>
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
        <TrackableWrapper>
          <Suspense fallback={<BlockSkeleton />}>
            <MessengerBlock block={block} pageOwnerId={pageOwnerId} onClick={handleTrackClick} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'form':
      return (
        <TrackableWrapper>
          <Suspense fallback={<BlockSkeleton />}>
            <FormBlock block={block} pageOwnerId={pageOwnerId} pageId={pageId} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'download':
      return (
        <TrackableWrapper>
          <Suspense fallback={<BlockSkeleton />}>
            <DownloadBlock block={block} onClick={handleTrackClick} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'newsletter':
      return (
        <div className={animationClass} style={animationStyle}>
          <Suspense fallback={<BlockSkeleton />}>
            <NewsletterBlock block={block} pageOwnerId={pageOwnerId} pageId={pageId} />
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
        <TrackableWrapper>
          <Suspense fallback={<BlockSkeleton />}>
            <CatalogBlock block={block} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'before_after':
      return (
        <TrackableWrapper>
          <Suspense fallback={<BlockSkeleton />}>
            <BeforeAfterBlock block={block} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'faq':
      return (
        <TrackableWrapper>
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
        <TrackableWrapper>
          <Suspense fallback={<BlockSkeleton />}>
            <PricingBlock block={block} />
          </Suspense>
        </TrackableWrapper>
      );
    case 'shoutout': {
      const shoutoutBlock = block as ShoutoutBlockType;
      return (
        <TrackableWrapper>
          <Suspense fallback={<BlockSkeleton />}>
            <ShoutoutBlock
              userId={shoutoutBlock.userId}
              message={shoutoutBlock.message}
            />
          </Suspense>
        </TrackableWrapper>
      );
    }
    case 'booking': {
      const bookingBlock = block as BookingBlockType;
      return (
        <TrackableWrapper>
          <Suspense fallback={<BlockSkeleton />}>
            <BookingBlock
              block={bookingBlock}
              pageOwnerId={pageOwnerId}
              pageId={pageId}
            />
          </Suspense>
        </TrackableWrapper>
      );
    }
    case 'community': {
      const communityBlock = block as CommunityBlockType;
      return (
        <TrackableWrapper>
          <Suspense fallback={<BlockSkeleton />}>
            <CommunityBlock block={communityBlock} />
          </Suspense>
        </TrackableWrapper>
      );
    }
    case 'event': {
      const eventBlock = block as EventBlockType;
      return (
        <TrackableWrapper>
          <Suspense fallback={<BlockSkeleton />}>
            <EventBlock
              block={eventBlock}
              pageOwnerId={pageOwnerId}
              pageId={pageId}
              isOwnerPremium={isOwnerPremium}
            />
          </Suspense>
        </TrackableWrapper>
      );
    }
    default:
      return null;
  }
}
