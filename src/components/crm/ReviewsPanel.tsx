import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Check from 'lucide-react/dist/esm/icons/check';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import MessageSquareText from 'lucide-react/dist/esm/icons/message-square-text';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Star from 'lucide-react/dist/esm/icons/star';
import X from 'lucide-react/dist/esm/icons/x';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, LoadingState } from '@/components/ui/states';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/user/useAuth';
import { cn } from '@/lib/utils/utils';
import { getPublicPageUrl } from '@/lib/utils/url-helpers';
import {
  calculateOwnerReviewStats,
  fetchOwnerReviews,
  isOwnerReviewActionable,
  moderateReview,
  type OwnerReviewRecord,
  type ReviewStatus,
} from '@/services/reviews';

type ReviewFilter = 'actionable' | 'published' | 'all';

const filterStatuses: Record<ReviewFilter, ReviewStatus[] | undefined> = {
  actionable: ['pending', 'flagged'],
  published: ['published'],
  all: undefined,
};

const statusColors: Record<ReviewStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-600 border-amber-500/25',
  published: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
  hidden: 'bg-slate-500/15 text-slate-600 border-slate-500/25',
  rejected: 'bg-red-500/15 text-red-600 border-red-500/25',
  flagged: 'bg-orange-500/15 text-orange-600 border-orange-500/25',
};

function formatReviewDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function getModerationErrorLabel(t: ReturnType<typeof useTranslation>['t'], error?: string): string {
  if (error === 'authentication_required') {
    return t('reviews.owner.errors.auth', 'Sign in to manage reviews');
  }
  if (error === 'not_allowed') {
    return t('reviews.owner.errors.access', 'You do not have access to this review');
  }
  if (error === 'invalid_status') {
    return t('reviews.owner.errors.status', 'This review status cannot be applied');
  }
  if (error === 'review_not_found') {
    return t('reviews.owner.errors.notFound', 'Review was not found');
  }
  return t('reviews.owner.errors.generic', 'Review update failed');
}

export function ReviewsPanel() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [filter, setFilter] = useState<ReviewFilter>('actionable');
  const [reviews, setReviews] = useState<OwnerReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [moderationReasons, setModerationReasons] = useState<Record<string, string>>({});

  const loadReviews = useCallback(async () => {
    if (!user?.id) {
      setReviews([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const records = await fetchOwnerReviews({
        ownerId: user.id,
        statuses: filterStatuses[filter],
        limit: 80,
      });
      setReviews(records);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error(t('reviews.owner.fetchError', 'Failed to load reviews'));
    } finally {
      setLoading(false);
    }
  }, [filter, t, user?.id]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const stats = useMemo(() => calculateOwnerReviewStats(reviews), [reviews]);

  const updateReviewStatus = async (review: OwnerReviewRecord, status: Exclude<ReviewStatus, 'pending'>) => {
    const key = `${review.id}:${status}`;
    setActionKey(key);

    try {
      const result = await moderateReview({
        reviewId: review.id,
        status,
        reason: moderationReasons[review.id],
      });

      if (!result.success) {
        toast.error(getModerationErrorLabel(t, result.error));
        return;
      }

      toast.success(t('reviews.owner.updateSuccess', 'Review updated'));
      setModerationReasons((current) => {
        const next = { ...current };
        delete next[review.id];
        return next;
      });
      await loadReviews();
    } catch (error) {
      console.error('Error moderating review:', error);
      toast.error(t('reviews.owner.errors.generic', 'Review update failed'));
    } finally {
      setActionKey(null);
    }
  };

  if (loading) {
    return <LoadingState className="p-8" message={t('messages.loading', 'Loading...')} />;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-4 gap-2 p-3 border-b">
        <div className="text-center p-2 rounded-lg bg-primary/10">
          <div className="text-lg font-bold text-primary">{stats.total}</div>
          <div className="text-xs text-muted-foreground">{t('reviews.owner.total', 'Total')}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-amber-500/10">
          <div className="text-lg font-bold text-amber-600">{stats.pending}</div>
          <div className="text-xs text-muted-foreground">{t('reviews.owner.pending', 'Pending')}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-emerald-500/10">
          <div className="text-lg font-bold text-emerald-600">{stats.published}</div>
          <div className="text-xs text-muted-foreground">{t('reviews.owner.published', 'Live')}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-slate-500/10">
          <div className="text-lg font-bold text-slate-600">{stats.hidden + stats.rejected + stats.flagged}</div>
          <div className="text-xs text-muted-foreground">{t('reviews.owner.closed', 'Closed')}</div>
        </div>
      </div>

      <div className="flex gap-2 p-3 border-b overflow-x-auto scrollbar-hide">
        {(['actionable', 'published', 'all'] as const).map((value) => (
          <Button
            key={value}
            type="button"
            variant={filter === value ? 'default' : 'outline'}
            size="sm"
            className="h-9 rounded-full text-xs font-semibold shrink-0"
            onClick={() => setFilter(value)}
          >
            {value === 'actionable' && t('reviews.owner.filters.actionable', 'Needs review')}
            {value === 'published' && t('reviews.owner.filters.published', 'Published')}
            {value === 'all' && t('reviews.owner.filters.all', 'All reviews')}
          </Button>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 rounded-full text-xs shrink-0 ml-auto"
          onClick={loadReviews}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          {t('bookings.refresh', 'Refresh')}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {reviews.length === 0 ? (
          <EmptyState
            icon={MessageSquareText}
            title={t('reviews.owner.emptyTitle', 'No reviews in this view')}
            description={t('reviews.owner.emptyDescription', 'Verified customer reviews will appear here after completed bookings.')}
            className="py-12"
          />
        ) : (
          <div className="divide-y">
            {reviews.map((review) => {
              const publicUrl = review.page?.slug ? getPublicPageUrl(review.page.slug) : null;
              const actionDisabled = actionKey?.startsWith(`${review.id}:`) ?? false;

              return (
                <Card key={review.id} className="m-3 p-3 border rounded-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className={cn('text-xs', statusColors[review.status])}>
                          {t(`reviews.status.${review.status}`, review.status)}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          {t(`reviews.verification.${review.verificationStatus}`, 'Verified')}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatReviewDate(review.createdAt, i18n.language)}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center text-amber-500" aria-label={t('reviews.owner.ratingLabel', '{{rating}} out of 5', { rating: review.rating })}>
                            {Array.from({ length: 5 }, (_, index) => (
                              <Star
                                key={index}
                                className={cn('h-3.5 w-3.5', index < review.rating ? 'fill-current' : 'opacity-25')}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold truncate">{review.reviewerDisplayName}</span>
                        </div>
                        {review.title && (
                          <p className="mt-1 text-sm font-medium text-foreground">{review.title}</p>
                        )}
                        {review.body && (
                          <p className="mt-1 text-sm text-muted-foreground line-clamp-3">{review.body}</p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{review.page?.title || review.page?.slug || review.pageId}</span>
                        {publicUrl && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                            onClick={() => window.open(publicUrl, '_blank', 'noopener,noreferrer')}
                          >
                            {t('reviews.owner.openPage', 'Open page')}
                            <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      {isOwnerReviewActionable(review.status) && (
                        <Textarea
                          aria-label={t('reviews.owner.reasonLabel', 'Moderation note')}
                          value={moderationReasons[review.id] || ''}
                          onChange={(event) => setModerationReasons((current) => ({
                            ...current,
                            [review.id]: event.target.value,
                          }))}
                          rows={2}
                          className="min-h-[64px] text-sm"
                        />
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 shrink-0">
                      {review.status !== 'published' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-emerald-600 hover:bg-emerald-500/10"
                          disabled={actionDisabled}
                          onClick={() => updateReviewStatus(review, 'published')}
                          title={t('reviews.owner.publish', 'Publish')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {review.status === 'published' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-slate-600 hover:bg-slate-500/10"
                          disabled={actionDisabled}
                          onClick={() => updateReviewStatus(review, 'hidden')}
                          title={t('reviews.owner.hide', 'Hide')}
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      )}
                      {review.status !== 'rejected' && review.status !== 'published' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:bg-red-500/10"
                          disabled={actionDisabled}
                          onClick={() => updateReviewStatus(review, 'rejected')}
                          title={t('reviews.owner.reject', 'Reject')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
