import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import Star from 'lucide-react/dist/esm/icons/star';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import { Badge } from '@/components/ui/badge';
import { SectionHeader } from '@/components/blocks/shells/BlockShell';
import { cn } from '@/lib/utils/utils';
import {
  fetchPublicPageReviewSnapshot,
  type PublicReviewRecord,
  type ReviewRating,
} from '@/services/reviews';

interface VerifiedReviewsSectionProps {
  pageId?: string | null;
}

function renderStars(rating: ReviewRating, size: 'sm' | 'md' = 'sm') {
  const iconClass = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  return (
    <div className="flex gap-0.5" aria-label={`${rating}/5`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={cn(iconClass, index < rating ? 'fill-primary text-primary' : 'text-muted-foreground/30')}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function getVerificationLabel(verificationStatus: string) {
  switch (verificationStatus) {
    case 'verified_booking':
      return 'verifiedReviews.verifiedBooking';
    case 'verified_order':
      return 'verifiedReviews.verifiedOrder';
    default:
      return 'verifiedReviews.verified';
  }
}

function ReviewCard({ review }: { review: PublicReviewRecord }) {
  const { t } = useTranslation();
  const verificationKey = getVerificationLabel(review.verificationStatus);

  return (
    <article className="qb-card qb-card-hover flex-shrink-0 w-[85%] min-w-[280px] max-w-[360px] p-5 snap-start">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium text-sm text-foreground truncate">{review.reviewerDisplayName}</div>
          <Badge variant="secondary" className="mt-1 h-5 gap-1 px-1.5 text-[10px] font-medium">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            {t(verificationKey, verificationKey === 'verifiedReviews.verifiedBooking'
              ? 'Verified booking'
              : verificationKey === 'verifiedReviews.verifiedOrder'
                ? 'Verified order'
                : 'Verified')}
          </Badge>
        </div>
        {renderStars(review.rating)}
      </div>

      {review.title && (
        <h3 className="mt-4 text-sm font-semibold text-foreground">
          {review.title}
        </h3>
      )}

      {review.body && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          "{review.body}"
        </p>
      )}
    </article>
  );
}

export const VerifiedReviewsSection = memo(function VerifiedReviewsSection({
  pageId,
}: VerifiedReviewsSectionProps) {
  const { t, i18n } = useTranslation();

  const { data, isLoading, error } = useQuery({
    queryKey: ['reviews', 'public-page', pageId],
    queryFn: () => fetchPublicPageReviewSnapshot(pageId || ''),
    enabled: Boolean(pageId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });

  if (!pageId || isLoading || error || !data) return null;

  const { summary, reviews } = data;
  if (summary.publishedCount === 0 && reviews.length === 0) return null;

  const averageRating = summary.averageRating ?? 0;
  const roundedRating = Math.max(1, Math.min(5, Math.round(averageRating))) as ReviewRating;
  const formattedAverage = new Intl.NumberFormat(i18n.language, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(averageRating);

  return (
    <section className="mt-6 sm:mt-8 [color:hsl(var(--foreground))]" aria-labelledby="verified-reviews-heading">
      <SectionHeader
        icon={<ShieldCheck className="h-4 w-4" />}
        title={t('verifiedReviews.title', 'Verified reviews')}
      />

      <div className="qb-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p id="verified-reviews-heading" className="text-2xl font-semibold leading-none text-foreground">
              {formattedAverage}
            </p>
            <div className="mt-2">{renderStars(roundedRating, 'md')}</div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">
              {t('verifiedReviews.count', '{{count}} published reviews', {
                count: summary.publishedCount,
              })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('verifiedReviews.source', 'Collected after real bookings and orders')}
            </p>
          </div>
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </section>
  );
});
