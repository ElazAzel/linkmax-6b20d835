import { supabase } from '@/platform/supabase/client';
import type { Json, Tables } from '@/platform/supabase/types';

const REVIEW_STATUSES = ['pending', 'published', 'hidden', 'rejected', 'flagged'] as const;
const REVIEW_SOURCES = ['booking', 'order', 'owner_import', 'manual'] as const;
const REVIEW_VERIFICATION_STATUSES = [
  'verified_booking',
  'verified_order',
  'owner_imported',
  'unverified',
] as const;
const REVIEW_REQUEST_STATUSES = ['pending', 'used', 'expired', 'revoked'] as const;

export type ReviewStatus = typeof REVIEW_STATUSES[number];
export type ReviewSource = typeof REVIEW_SOURCES[number];
export type ReviewVerificationStatus = typeof REVIEW_VERIFICATION_STATUSES[number];
export type ReviewRequestStatus = typeof REVIEW_REQUEST_STATUSES[number];
export type ReviewRating = 1 | 2 | 3 | 4 | 5;

export interface ReviewSummaryInput {
  rating: number;
  status: ReviewStatus;
  publishedAt?: string | null;
}

export interface ReviewSummary {
  publishedCount: number;
  averageRating: number | null;
  ratingBreakdown: Record<ReviewRating, number>;
  lastReviewAt: string | null;
}

export interface PublicReviewRecord {
  id: string;
  rating: ReviewRating;
  title: string | null;
  body: string | null;
  reviewerDisplayName: string;
  verificationStatus: string;
  publishedAt: string | null;
  isFeatured: boolean;
}

export interface PublicPageReviewSnapshot {
  summary: ReviewSummary;
  reviews: PublicReviewRecord[];
}

export interface OwnerReviewPageReference {
  id: string;
  title: string | null;
  slug: string | null;
}

export interface OwnerReviewRecord {
  id: string;
  pageId: string;
  page: OwnerReviewPageReference | null;
  bookingId: string | null;
  orderId: string | null;
  rating: ReviewRating;
  title: string | null;
  body: string | null;
  reviewerDisplayName: string;
  status: ReviewStatus;
  source: ReviewSource | string;
  verificationStatus: ReviewVerificationStatus | string;
  isFeatured: boolean;
  moderationReason: string | null;
  createdAt: string;
  publishedAt: string | null;
  hiddenAt: string | null;
}

export interface FetchOwnerReviewsInput {
  ownerId: string;
  statuses?: ReviewStatus[];
  limit?: number;
}

export interface OwnerReviewStats {
  total: number;
  pending: number;
  published: number;
  hidden: number;
  rejected: number;
  flagged: number;
}

export interface CreateReviewForBookingInput {
  bookingId: string;
  rating: ReviewRating;
  body?: string | null;
  title?: string | null;
  reviewerDisplayName?: string | null;
  reviewerContact?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ModerateReviewInput {
  reviewId: string;
  status: Exclude<ReviewStatus, 'pending'>;
  reason?: string | null;
}

export interface CreateBookingReviewRequestInput {
  bookingId: string;
  expiresIn?: string;
  metadata?: Record<string, unknown>;
}

export interface SubmitReviewRequestInput {
  token: string;
  rating: ReviewRating;
  body?: string | null;
  title?: string | null;
  reviewerDisplayName?: string | null;
  reviewerContact?: string | null;
  metadata?: Record<string, unknown>;
}

export interface ReviewRpcResult {
  success: boolean;
  error?: string;
  review?: {
    id: string;
    status: string;
    rating?: number;
    verification_status?: string;
    published_at?: string | null;
    hidden_at?: string | null;
  };
}

export interface ReviewRequestRecord {
  id: string;
  status: string;
  booking_id?: string | null;
  order_id?: string | null;
  review_id?: string | null;
  expires_at?: string | null;
  token?: string;
  path?: string;
  used_at?: string | null;
  default_reviewer_display_name?: string | null;
}

export interface ReviewRequestPageContext {
  id: string;
  slug?: string | null;
  title?: string | null;
  avatar_url?: string | null;
  niche?: string | null;
  city?: string | null;
}

export interface ReviewRequestBookingContext {
  id: string;
  slot_date?: string | null;
  slot_time?: string | null;
  slot_end_time?: string | null;
}

export interface ReviewRequestRpcResult extends ReviewRpcResult {
  already_submitted?: boolean;
  review_request?: ReviewRequestRecord;
  page?: ReviewRequestPageContext;
  booking?: ReviewRequestBookingContext;
}

const REVIEW_STATUS_SET = new Set<string>(REVIEW_STATUSES);
const REVIEW_SOURCE_SET = new Set<string>(REVIEW_SOURCES);
const REVIEW_VERIFICATION_STATUS_SET = new Set<string>(REVIEW_VERIFICATION_STATUSES);
const REVIEW_REQUEST_STATUS_SET = new Set<string>(REVIEW_REQUEST_STATUSES);

export { REVIEW_REQUEST_STATUSES, REVIEW_SOURCES, REVIEW_STATUSES, REVIEW_VERIFICATION_STATUSES };

type ReviewRow = Pick<
  Tables<'reviews'>,
  | 'id'
  | 'page_id'
  | 'booking_id'
  | 'order_id'
  | 'rating'
  | 'title'
  | 'body'
  | 'reviewer_display_name'
  | 'status'
  | 'source'
  | 'verification_status'
  | 'is_featured'
  | 'moderation_reason'
  | 'created_at'
  | 'published_at'
  | 'hidden_at'
>;

type PageReferenceRow = Pick<Tables<'pages'>, 'id' | 'title' | 'slug'>;

const OWNER_REVIEW_SELECT = 'id, page_id, booking_id, order_id, rating, title, body, reviewer_display_name, status, source, verification_status, is_featured, moderation_reason, created_at, published_at, hidden_at' as const;

export function isReviewStatus(value: string): value is ReviewStatus {
  return REVIEW_STATUS_SET.has(value);
}

export function isReviewSource(value: string): value is ReviewSource {
  return REVIEW_SOURCE_SET.has(value);
}

export function isReviewVerificationStatus(value: string): value is ReviewVerificationStatus {
  return REVIEW_VERIFICATION_STATUS_SET.has(value);
}

export function isReviewRequestStatus(value: string): value is ReviewRequestStatus {
  return REVIEW_REQUEST_STATUS_SET.has(value);
}

export function isReviewRating(value: number): value is ReviewRating {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

export function normalizeReviewText(value: string | null | undefined, maxLength: number): string | null {
  const normalized = (value ?? '').replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  return normalized.slice(0, maxLength);
}

export function shouldExposeReview(status: ReviewStatus): boolean {
  return status === 'published';
}

export function isOwnerReviewActionable(status: ReviewStatus): boolean {
  return status === 'pending' || status === 'flagged';
}

export function calculateOwnerReviewStats(reviews: Pick<OwnerReviewRecord, 'status'>[]): OwnerReviewStats {
  const stats: OwnerReviewStats = {
    total: reviews.length,
    pending: 0,
    published: 0,
    hidden: 0,
    rejected: 0,
    flagged: 0,
  };

  for (const review of reviews) {
    stats[review.status] += 1;
  }

  return stats;
}

export function normalizeReviewRequestToken(value: string | null | undefined): string | null {
  const normalized = (value ?? '').trim();
  return normalized ? normalized : null;
}

export function buildReviewRequestPath(token: string): string {
  return `/review/request/${encodeURIComponent(token)}`;
}

export function buildReviewRequestUrl(
  origin: string,
  request: Pick<ReviewRequestRecord, 'path' | 'token'> | null | undefined
): string | null {
  const path = request?.path || (request?.token ? buildReviewRequestPath(request.token) : null);
  if (!path) return null;

  const trimmedOrigin = origin.trim();
  if (!trimmedOrigin) return path;

  try {
    return new URL(path, trimmedOrigin.endsWith('/') ? trimmedOrigin : `${trimmedOrigin}/`).toString();
  } catch {
    return path.startsWith('/') ? path : `/${path}`;
  }
}

export function isReviewRequestActionable(
  status: ReviewRequestStatus,
  expiresAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (status !== 'pending' || !expiresAt) return false;

  const expiresAtMs = Date.parse(expiresAt);
  return Number.isFinite(expiresAtMs) && expiresAtMs > now.getTime();
}

export function getReviewPublicationEvent(
  previousStatus: ReviewStatus,
  nextStatus: ReviewStatus
): 'review.published' | null {
  if (previousStatus !== 'published' && nextStatus === 'published') {
    return 'review.published';
  }

  return null;
}

export function calculateReviewSummary(reviews: ReviewSummaryInput[]): ReviewSummary {
  const published = reviews.filter((review) => review.status === 'published' && isReviewRating(review.rating));
  const ratingBreakdown: Record<ReviewRating, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  let ratingTotal = 0;
  let lastReviewAt: string | null = null;

  for (const review of published) {
    const rating = review.rating as ReviewRating;
    ratingBreakdown[rating] += 1;
    ratingTotal += rating;

    if (review.publishedAt && (!lastReviewAt || review.publishedAt > lastReviewAt)) {
      lastReviewAt = review.publishedAt;
    }
  }

  const publishedCount = published.length;
  const averageRating = publishedCount > 0
    ? Number((ratingTotal / publishedCount).toFixed(2))
    : null;

  return {
    publishedCount,
    averageRating,
    ratingBreakdown,
    lastReviewAt,
  };
}

export function normalizeRatingBreakdown(value: Json | null | undefined): Record<ReviewRating, number> {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

  return {
    1: typeof source['1'] === 'number' ? source['1'] : 0,
    2: typeof source['2'] === 'number' ? source['2'] : 0,
    3: typeof source['3'] === 'number' ? source['3'] : 0,
    4: typeof source['4'] === 'number' ? source['4'] : 0,
    5: typeof source['5'] === 'number' ? source['5'] : 0,
  };
}

function toJson(metadata: Record<string, unknown> | undefined): Json {
  return (metadata ?? {}) as Json;
}

function mapOwnerReviewRow(
  review: ReviewRow,
  pagesById: Map<string, PageReferenceRow>
): OwnerReviewRecord | null {
  if (!isReviewRating(review.rating) || !isReviewStatus(review.status)) {
    return null;
  }

  const page = pagesById.get(review.page_id);

  return {
    id: review.id,
    pageId: review.page_id,
    page: page
      ? {
          id: page.id,
          title: page.title,
          slug: page.slug,
        }
      : null,
    bookingId: review.booking_id,
    orderId: review.order_id,
    rating: review.rating,
    title: review.title,
    body: review.body,
    reviewerDisplayName: review.reviewer_display_name,
    status: review.status,
    source: isReviewSource(review.source) ? review.source : review.source,
    verificationStatus: isReviewVerificationStatus(review.verification_status)
      ? review.verification_status
      : review.verification_status,
    isFeatured: review.is_featured,
    moderationReason: review.moderation_reason,
    createdAt: review.created_at,
    publishedAt: review.published_at,
    hiddenAt: review.hidden_at,
  };
}

function parseReviewRpcResult(data: Json | null): ReviewRpcResult {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { success: false, error: 'invalid_response' };
  }

  const value = data as Record<string, unknown>;
  const rawReview = value.review;
  const review = rawReview && typeof rawReview === 'object' && !Array.isArray(rawReview)
    ? rawReview as Record<string, unknown>
    : null;

  return {
    success: value.success === true,
    error: typeof value.error === 'string' ? value.error : undefined,
    review: review && typeof review.id === 'string' && typeof review.status === 'string'
      ? {
          id: review.id,
          status: review.status,
          rating: typeof review.rating === 'number' ? review.rating : undefined,
          verification_status: typeof review.verification_status === 'string'
            ? review.verification_status
            : undefined,
          published_at: typeof review.published_at === 'string' || review.published_at === null
            ? review.published_at
            : undefined,
          hidden_at: typeof review.hidden_at === 'string' || review.hidden_at === null
            ? review.hidden_at
            : undefined,
        }
      : undefined,
  };
}

function parseObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function parseReviewRequestRecord(value: unknown): ReviewRequestRecord | undefined {
  const record = parseObject(value);
  if (!record || typeof record.id !== 'string' || typeof record.status !== 'string') {
    return undefined;
  }

  return {
    id: record.id,
    status: record.status,
    booking_id: typeof record.booking_id === 'string' || record.booking_id === null
      ? record.booking_id
      : undefined,
    order_id: typeof record.order_id === 'string' || record.order_id === null
      ? record.order_id
      : undefined,
    review_id: typeof record.review_id === 'string' || record.review_id === null
      ? record.review_id
      : undefined,
    expires_at: typeof record.expires_at === 'string' || record.expires_at === null
      ? record.expires_at
      : undefined,
    token: typeof record.token === 'string' ? record.token : undefined,
    path: typeof record.path === 'string' ? record.path : undefined,
    used_at: typeof record.used_at === 'string' || record.used_at === null
      ? record.used_at
      : undefined,
    default_reviewer_display_name:
      typeof record.default_reviewer_display_name === 'string' || record.default_reviewer_display_name === null
        ? record.default_reviewer_display_name
        : undefined,
  };
}

function parseReviewRequestPageContext(value: unknown): ReviewRequestPageContext | undefined {
  const record = parseObject(value);
  if (!record || typeof record.id !== 'string') return undefined;

  return {
    id: record.id,
    slug: typeof record.slug === 'string' || record.slug === null ? record.slug : undefined,
    title: typeof record.title === 'string' || record.title === null ? record.title : undefined,
    avatar_url: typeof record.avatar_url === 'string' || record.avatar_url === null
      ? record.avatar_url
      : undefined,
    niche: typeof record.niche === 'string' || record.niche === null ? record.niche : undefined,
    city: typeof record.city === 'string' || record.city === null ? record.city : undefined,
  };
}

function parseReviewRequestBookingContext(value: unknown): ReviewRequestBookingContext | undefined {
  const record = parseObject(value);
  if (!record || typeof record.id !== 'string') return undefined;

  return {
    id: record.id,
    slot_date: typeof record.slot_date === 'string' || record.slot_date === null
      ? record.slot_date
      : undefined,
    slot_time: typeof record.slot_time === 'string' || record.slot_time === null
      ? record.slot_time
      : undefined,
    slot_end_time: typeof record.slot_end_time === 'string' || record.slot_end_time === null
      ? record.slot_end_time
      : undefined,
  };
}

export function parseReviewRequestRpcResult(data: Json | null): ReviewRequestRpcResult {
  const base = parseReviewRpcResult(data);
  const value = parseObject(data);
  if (!value) return base;

  return {
    ...base,
    already_submitted: value.already_submitted === true ? true : undefined,
    review_request: parseReviewRequestRecord(value.review_request),
    page: parseReviewRequestPageContext(value.page),
    booking: parseReviewRequestBookingContext(value.booking),
  };
}

export async function createReviewForBooking(input: CreateReviewForBookingInput): Promise<ReviewRpcResult> {
  const body = normalizeReviewText(input.body, 2000);
  const title = normalizeReviewText(input.title, 160);
  const reviewerDisplayName = normalizeReviewText(input.reviewerDisplayName, 120);

  const { data, error } = await supabase.rpc('create_review_for_booking', {
    p_booking_id: input.bookingId,
    p_rating: input.rating,
    p_body: body,
    p_reviewer_display_name: reviewerDisplayName,
    p_reviewer_contact: input.reviewerContact ?? null,
    p_title: title,
    p_metadata: toJson(input.metadata),
  });

  if (error) throw error;
  return parseReviewRpcResult(data);
}

export async function createBookingReviewRequest(
  input: CreateBookingReviewRequestInput
): Promise<ReviewRequestRpcResult> {
  const { data, error } = await supabase.rpc('create_booking_review_request', {
    p_booking_id: input.bookingId,
    p_expires_in: input.expiresIn ?? '14 days',
    p_metadata: toJson(input.metadata),
  });

  if (error) throw error;
  return parseReviewRequestRpcResult(data);
}

export async function getReviewRequestByToken(token: string): Promise<ReviewRequestRpcResult> {
  const normalizedToken = normalizeReviewRequestToken(token);
  if (!normalizedToken) {
    return { success: false, error: 'invalid_token' };
  }

  const { data, error } = await supabase.rpc('get_review_request_by_token', {
    p_token: normalizedToken,
  });

  if (error) throw error;
  return parseReviewRequestRpcResult(data);
}

export async function submitReviewRequest(input: SubmitReviewRequestInput): Promise<ReviewRequestRpcResult> {
  const normalizedToken = normalizeReviewRequestToken(input.token);
  if (!normalizedToken) {
    return { success: false, error: 'invalid_token' };
  }

  if (!isReviewRating(input.rating)) {
    return { success: false, error: 'invalid_rating' };
  }

  const body = normalizeReviewText(input.body, 2000);
  const title = normalizeReviewText(input.title, 160);
  const reviewerDisplayName = normalizeReviewText(input.reviewerDisplayName, 120);

  const { data, error } = await supabase.rpc('submit_review_request', {
    p_token: normalizedToken,
    p_rating: input.rating,
    p_body: body,
    p_reviewer_display_name: reviewerDisplayName,
    p_reviewer_contact: input.reviewerContact ?? null,
    p_title: title,
    p_metadata: toJson(input.metadata),
  });

  if (error) throw error;
  return parseReviewRequestRpcResult(data);
}

export async function moderateReview(input: ModerateReviewInput): Promise<ReviewRpcResult> {
  const { data, error } = await supabase.rpc('moderate_review', {
    p_review_id: input.reviewId,
    p_status: input.status,
    p_reason: normalizeReviewText(input.reason, 500),
  });

  if (error) throw error;
  return parseReviewRpcResult(data);
}

export function isMissingTableError(err: any): boolean {
  if (!err) return false;
  const code = String(err.code || '');
  const message = String(err.message || '').toLowerCase();
  const hint = String(err.hint || '').toLowerCase();
  return (
    code === '42P01' || // relation does not exist
    code === 'PGRST204' || // PostgREST table/view not found
    message.includes('does not exist') ||
    hint.includes('does not exist') ||
    message.includes('not found') ||
    hint.includes('not found')
  );
}

export async function fetchOwnerReviews(input: FetchOwnerReviewsInput): Promise<OwnerReviewRecord[]> {
  const safeLimit = Math.min(Math.max(Math.floor(input.limit ?? 60), 1), 100);
  const statuses = (input.statuses || []).filter(isReviewStatus);

  let query = supabase
    .from('reviews')
    .select(OWNER_REVIEW_SELECT)
    .eq('owner_id', input.ownerId)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  if (statuses.length > 0) {
    query = query.in('status', statuses);
  }

  let reviewRows = null;
  let reviewError = null;

  try {
    const result = await query;
    reviewRows = result.data;
    reviewError = result.error;
  } catch (err) {
    reviewError = err;
  }

  if (reviewError) {
    if (isMissingTableError(reviewError)) {
      console.warn('reviews table not found. Falling back to empty review list.');
      return [];
    }
    throw reviewError;
  }

  const reviews = (reviewRows || []) as ReviewRow[];
  const pageIds = Array.from(new Set(reviews.map((review) => review.page_id)));
  const pagesById = new Map<string, PageReferenceRow>();

  if (pageIds.length > 0) {
    const { data: pageRows, error: pageError } = await supabase
      .from('pages')
      .select('id, title, slug')
      .in('id', pageIds);

    if (pageError) throw pageError;

    for (const page of (pageRows || []) as PageReferenceRow[]) {
      pagesById.set(page.id, page);
    }
  }

  return reviews
    .map((review) => mapOwnerReviewRow(review, pagesById))
    .filter((review): review is OwnerReviewRecord => Boolean(review));
}

export async function fetchPublicPageReviewSnapshot(
  pageId: string,
  limit = 6
): Promise<PublicPageReviewSnapshot> {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 12);

  const fetchSummary = async () => {
    try {
      return await supabase
        .from('page_review_summaries')
        .select('published_count, average_rating, rating_breakdown, last_review_at')
        .eq('page_id', pageId)
        .maybeSingle();
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const fetchReviews = async () => {
    try {
      return await supabase
        .from('reviews')
        .select('id, rating, title, body, reviewer_display_name, verification_status, published_at, is_featured')
        .eq('page_id', pageId)
        .eq('status', 'published')
        .order('is_featured', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(safeLimit);
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const [summaryResult, reviewsResult] = await Promise.all([
    fetchSummary(),
    fetchReviews(),
  ]);

  if (summaryResult.error) {
    if (isMissingTableError(summaryResult.error)) {
      console.warn('page_review_summaries table not found. Falling back to empty summary.');
    } else {
      throw summaryResult.error;
    }
  }

  if (reviewsResult.error) {
    if (isMissingTableError(reviewsResult.error)) {
      console.warn('reviews table not found. Falling back to empty reviews.');
    } else {
      throw reviewsResult.error;
    }
  }

  const summaryRow = summaryResult.data;
  const reviews = (reviewsResult.data || [])
    .filter((review): review is NonNullable<typeof review> => Boolean(review))
    .filter((review) => isReviewRating(review.rating))
    .map((review) => ({
      id: review.id,
      rating: review.rating as ReviewRating,
      title: review.title,
      body: review.body,
      reviewerDisplayName: review.reviewer_display_name,
      verificationStatus: review.verification_status,
      publishedAt: review.published_at,
      isFeatured: review.is_featured,
    }));

  return {
    summary: {
      publishedCount: summaryRow?.published_count ?? reviews.length,
      averageRating: summaryRow?.average_rating ?? (reviews.length
        ? Number((reviews.reduce((total, review) => total + review.rating, 0) / reviews.length).toFixed(2))
        : null),
      ratingBreakdown: normalizeRatingBreakdown(summaryRow?.rating_breakdown),
      lastReviewAt: summaryRow?.last_review_at ?? reviews[0]?.publishedAt ?? null,
    },
    reviews,
  };
}
