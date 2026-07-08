import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Send from 'lucide-react/dist/esm/icons/send';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Star from 'lucide-react/dist/esm/icons/star';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/ui/loading-state';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/utils';
import {
  getReviewRequestByToken,
  isReviewRating,
  isReviewRequestActionable,
  isReviewRequestStatus,
  submitReviewRequest,
  type ReviewRating,
  type ReviewRequestRpcResult,
} from '@/services/reviews';

type ReviewRequestErrorCopy = {
  title: string;
  description: string;
  variant: 'error' | 'info';
};

const ERROR_COPY: Record<string, ReviewRequestErrorCopy> = {
  invalid_token: {
    title: 'Ссылка на отзыв недействительна',
    description: 'Проверьте, что ссылка скопирована полностью, или запросите новую ссылку у мастера.',
    variant: 'error',
  },
  review_request_not_found: {
    title: 'Ссылка на отзыв не найдена',
    description: 'Возможно, она была заменена новой ссылкой или удалена владельцем страницы.',
    variant: 'error',
  },
  review_request_expired: {
    title: 'Срок действия ссылки истек',
    description: 'Чтобы оставить отзыв, запросите у мастера новую ссылку.',
    variant: 'info',
  },
  review_request_used: {
    title: 'Отзыв уже отправлен',
    description: 'Эта ссылка уже была использована. Спасибо, что поделились обратной связью.',
    variant: 'info',
  },
  review_request_revoked: {
    title: 'Ссылка отозвана',
    description: 'Владелец страницы отключил эту ссылку для сбора отзыва.',
    variant: 'info',
  },
};

function getErrorCopy(error?: string): ReviewRequestErrorCopy {
  if (error && ERROR_COPY[error]) return ERROR_COPY[error];

  return {
    title: 'Не удалось открыть форму отзыва',
    description: 'Обновите страницу или запросите новую ссылку у мастера.',
    variant: 'error',
  };
}

function getInitials(value?: string | null): string {
  const normalized = (value ?? 'LinkMAX').trim();
  return normalized.slice(0, 2).toUpperCase();
}

function formatBookingDate(date?: string | null, time?: string | null): string | null {
  if (!date && !time) return null;

  if (!date) return time ?? null;

  const parsed = new Date(`${date}T${time || '00:00'}:00`);
  if (Number.isNaN(parsed.getTime())) {
    return time ? `${date}, ${time}` : date;
  }

  const formattedDate = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);

  return time ? `${formattedDate}, ${time}` : formattedDate;
}

function getActionableState(result?: ReviewRequestRpcResult): boolean {
  const request = result?.review_request;
  if (!request || !isReviewRequestStatus(request.status)) return false;
  return isReviewRequestActionable(request.status, request.expires_at);
}

function ReviewRequestShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:px-6">
      <Helmet>
        <title>Оставить отзыв | LinkMAX</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <main className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl items-center justify-center">
        {children}
      </main>
    </div>
  );
}

function ReviewRequestStatusCard({
  title,
  description,
  variant,
}: ReviewRequestErrorCopy) {
  const Icon = variant === 'error' ? AlertCircle : CheckCircle2;

  return (
    <ReviewRequestShell>
      <Card className="w-full border-border/40 bg-card/85 shadow-glass">
        <CardHeader className="items-center text-center">
          <div
            className={cn(
              'mb-3 flex h-16 w-16 items-center justify-center rounded-full',
              variant === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary',
            )}
          >
            <Icon className="h-8 w-8" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl">{title}</CardTitle>
          <p className="max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild variant="outline">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              На главную
            </Link>
          </Button>
        </CardContent>
      </Card>
    </ReviewRequestShell>
  );
}

function SubmittedCard({ pageTitle }: { pageTitle?: string | null }) {
  return (
    <ReviewRequestStatusCard
      title="Спасибо, отзыв отправлен"
      description={`Мы передали отзыв владельцу страницы${pageTitle ? ` «${pageTitle}»` : ''}. После проверки он сможет появиться в публичном профиле.`}
      variant="info"
    />
  );
}

export default function ReviewRequest() {
  const { token } = useParams<{ token: string }>();
  const [rating, setRating] = useState<ReviewRating | 0>(0);
  const [reviewerName, setReviewerName] = useState('');
  const [nameInitialized, setNameInitialized] = useState(false);
  const [body, setBody] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const requestQuery = useQuery({
    queryKey: ['review-request', token],
    queryFn: () => getReviewRequestByToken(token || ''),
    enabled: Boolean(token),
    retry: 1,
  });

  const defaultName = requestQuery.data?.review_request?.default_reviewer_display_name ?? '';
  const pageTitle = requestQuery.data?.page?.title || requestQuery.data?.page?.slug || 'страницы LinkMAX';
  const bookingLabel = formatBookingDate(
    requestQuery.data?.booking?.slot_date,
    requestQuery.data?.booking?.slot_time,
  );

  const actionable = useMemo(() => getActionableState(requestQuery.data), [requestQuery.data]);

  useEffect(() => {
    if (defaultName && !nameInitialized) {
      setReviewerName(defaultName);
      setNameInitialized(true);
    }
  }, [defaultName, nameInitialized]);

  const submitMutation = useMutation({
    mutationFn: () => {
      if (!isReviewRating(rating)) {
        return Promise.resolve({ success: false, error: 'invalid_rating' });
      }

      return submitReviewRequest({
        token: token || '',
        rating,
        body,
        reviewerDisplayName: reviewerName,
        metadata: {
          source: 'review_request_page',
          path: window.location.pathname,
        },
      });
    },
    onSuccess: (result) => {
      if (result.success) {
        setSubmitted(true);
        setFormError(null);
        return;
      }

      if (result.error === 'invalid_rating') {
        setFormError('Выберите оценку от 1 до 5.');
        return;
      }

      const copy = getErrorCopy(result.error);
      setFormError(copy.description);
    },
    onError: () => {
      setFormError('Не удалось отправить отзыв. Проверьте соединение и попробуйте еще раз.');
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!isReviewRating(rating)) {
      setFormError('Выберите оценку от 1 до 5.');
      return;
    }

    submitMutation.mutate();
  };

  if (!token) {
    return <ReviewRequestStatusCard {...getErrorCopy('invalid_token')} />;
  }

  if (submitted) {
    return <SubmittedCard pageTitle={pageTitle} />;
  }

  if (requestQuery.isLoading) {
    return (
      <ReviewRequestShell>
        <Card className="w-full border-border/40 bg-card/85 shadow-glass">
          <CardContent className="p-8">
            <LoadingState message="Загружаем форму отзыва..." />
          </CardContent>
        </Card>
      </ReviewRequestShell>
    );
  }

  if (requestQuery.error || !requestQuery.data?.success || !actionable) {
    const statusError = requestQuery.data?.review_request?.status
      ? `review_request_${requestQuery.data.review_request.status}`
      : undefined;
    return <ReviewRequestStatusCard {...getErrorCopy(requestQuery.data?.error || statusError)} />;
  }

  return (
    <ReviewRequestShell>
      <Card className="w-full border-border/40 bg-card/85 shadow-glass">
        <CardHeader className="space-y-5 pb-5">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
            <Avatar className="h-16 w-16 border border-border/40 shadow-sm">
              <AvatarImage src={requestQuery.data.page?.avatar_url || undefined} alt={pageTitle} />
              <AvatarFallback>{getInitials(pageTitle)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <Badge variant="secondary" className="gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Проверенный отзыв
                </Badge>
                {requestQuery.data.page?.city ? (
                  <Badge variant="outline">{requestQuery.data.page.city}</Badge>
                ) : null}
              </div>
              <CardTitle className="text-2xl leading-tight">Как прошла услуга?</CardTitle>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Оставьте отзыв для {pageTitle}. Он связан с реальной записью и помогает будущим клиентам выбрать специалиста.
              </p>
            </div>
          </div>

          {bookingLabel ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-muted/40 px-4 py-3 text-sm text-muted-foreground sm:justify-start">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              <span>Запись: {bookingLabel}</span>
            </div>
          ) : null}
        </CardHeader>

        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-3">
              <Label>Оценка</Label>
              <div className="flex gap-2" role="radiogroup" aria-label="Оценка услуги">
                {[1, 2, 3, 4, 5].map((value) => {
                  const selected = rating >= value;
                  return (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={rating === value}
                      aria-label={`Оценка ${value} из 5`}
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-xl border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        selected
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-border/60 bg-background/70 text-muted-foreground hover:border-primary/30 hover:text-primary',
                      )}
                      onClick={() => setRating(value as ReviewRating)}
                    >
                      <Star className={cn('h-6 w-6', selected && 'fill-current')} aria-hidden="true" />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewer-name">Имя для отзыва</Label>
              <Input
                id="reviewer-name"
                value={reviewerName}
                onChange={(event) => setReviewerName(event.target.value)}
                maxLength={120}
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-body">Что понравилось или что можно улучшить</Label>
              <Textarea
                id="review-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                maxLength={2000}
                rows={5}
              />
              <p className="text-xs text-muted-foreground">{body.length}/2000</p>
            </div>

            {formError ? (
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {formError}
              </div>
            ) : null}

            <Button type="submit" className="w-full" loading={submitMutation.isPending}>
              <Send className="h-4 w-4" aria-hidden="true" />
              Отправить отзыв
            </Button>
          </form>
        </CardContent>
      </Card>
    </ReviewRequestShell>
  );
}
