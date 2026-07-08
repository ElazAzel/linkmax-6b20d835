import { describe, expect, it } from 'vitest';
import {
  REVIEW_REQUEST_STATUSES,
  REVIEW_SOURCES,
  REVIEW_STATUSES,
  REVIEW_VERIFICATION_STATUSES,
  buildReviewRequestPath,
  buildReviewRequestUrl,
  calculateOwnerReviewStats,
  calculateReviewSummary,
  getReviewPublicationEvent,
  isOwnerReviewActionable,
  isReviewRequestActionable,
  isReviewRequestStatus,
  isReviewRating,
  isReviewSource,
  isReviewStatus,
  isReviewVerificationStatus,
  normalizeRatingBreakdown,
  normalizeReviewRequestToken,
  normalizeReviewText,
  parseReviewRequestRpcResult,
  shouldExposeReview,
} from '../reviews';
import type { Json } from '@/platform/supabase/types';

describe('reviews service contract', () => {
  it('defines the review lifecycle catalogs', () => {
    expect(REVIEW_STATUSES).toEqual(['pending', 'published', 'hidden', 'rejected', 'flagged']);
    expect(REVIEW_SOURCES).toEqual(['booking', 'order', 'owner_import', 'manual']);
    expect(REVIEW_VERIFICATION_STATUSES).toEqual([
      'verified_booking',
      'verified_order',
      'owner_imported',
      'unverified',
    ]);

    expect(isReviewStatus('published')).toBe(true);
    expect(isReviewStatus('deleted')).toBe(false);
    expect(isReviewSource('booking')).toBe(true);
    expect(isReviewSource('feed')).toBe(false);
    expect(isReviewVerificationStatus('verified_booking')).toBe(true);
    expect(isReviewVerificationStatus('fake')).toBe(false);
  });

  it('defines the review request lifecycle catalog', () => {
    expect(REVIEW_REQUEST_STATUSES).toEqual(['pending', 'used', 'expired', 'revoked']);
    expect(isReviewRequestStatus('pending')).toBe(true);
    expect(isReviewRequestStatus('sent')).toBe(false);
  });

  it('validates review ratings', () => {
    expect(isReviewRating(1)).toBe(true);
    expect(isReviewRating(5)).toBe(true);
    expect(isReviewRating(0)).toBe(false);
    expect(isReviewRating(6)).toBe(false);
    expect(isReviewRating(4.5)).toBe(false);
  });

  it('normalizes public review text defensively', () => {
    expect(normalizeReviewText('  Great   service\nagain  ', 2000)).toBe('Great service again');
    expect(normalizeReviewText('   ', 2000)).toBeNull();
    expect(normalizeReviewText('abcdef', 3)).toBe('abc');
  });

  it('exposes only published reviews publicly', () => {
    expect(shouldExposeReview('published')).toBe(true);
    expect(shouldExposeReview('pending')).toBe(false);
    expect(shouldExposeReview('hidden')).toBe(false);
  });

  it('detects owner-actionable review statuses', () => {
    expect(isOwnerReviewActionable('pending')).toBe(true);
    expect(isOwnerReviewActionable('flagged')).toBe(true);
    expect(isOwnerReviewActionable('published')).toBe(false);
    expect(isOwnerReviewActionable('hidden')).toBe(false);
  });

  it('normalizes review request tokens and paths', () => {
    expect(normalizeReviewRequestToken('  rv_token  ')).toBe('rv_token');
    expect(normalizeReviewRequestToken('   ')).toBeNull();
    expect(buildReviewRequestPath('rv_token')).toBe('/review/request/rv_token');
    expect(buildReviewRequestPath('rv_token/with slash')).toBe('/review/request/rv_token%2Fwith%20slash');
  });

  it('builds owner-copy review request urls from returned request data', () => {
    expect(buildReviewRequestUrl('https://lnkmx.my', {
      path: '/review/request/rv_token',
    })).toBe('https://lnkmx.my/review/request/rv_token');

    expect(buildReviewRequestUrl('https://lnkmx.my/app', {
      token: 'rv_token/with slash',
    })).toBe('https://lnkmx.my/review/request/rv_token%2Fwith%20slash');

    expect(buildReviewRequestUrl('', {
      path: '/review/request/rv_token',
    })).toBe('/review/request/rv_token');
  });

  it('detects actionable review requests by status and expiry', () => {
    const now = new Date('2026-07-02T12:00:00.000Z');

    expect(isReviewRequestActionable('pending', '2026-07-02T12:01:00.000Z', now)).toBe(true);
    expect(isReviewRequestActionable('pending', '2026-07-02T11:59:59.000Z', now)).toBe(false);
    expect(isReviewRequestActionable('used', '2026-07-02T12:01:00.000Z', now)).toBe(false);
    expect(isReviewRequestActionable('pending', 'not-a-date', now)).toBe(false);
  });

  it('emits publication event only on first publish transition', () => {
    expect(getReviewPublicationEvent('pending', 'published')).toBe('review.published');
    expect(getReviewPublicationEvent('hidden', 'published')).toBe('review.published');
    expect(getReviewPublicationEvent('published', 'published')).toBeNull();
    expect(getReviewPublicationEvent('pending', 'hidden')).toBeNull();
  });

  it('calculates public review summary from published reviews only', () => {
    const summary = calculateReviewSummary([
      { rating: 5, status: 'published', publishedAt: '2026-07-01T10:00:00.000Z' },
      { rating: 4, status: 'published', publishedAt: '2026-07-02T10:00:00.000Z' },
      { rating: 1, status: 'pending', publishedAt: null },
      { rating: 6, status: 'published', publishedAt: '2026-07-03T10:00:00.000Z' },
    ]);

    expect(summary.publishedCount).toBe(2);
    expect(summary.averageRating).toBe(4.5);
    expect(summary.ratingBreakdown).toEqual({
      1: 0,
      2: 0,
      3: 0,
      4: 1,
      5: 1,
    });
    expect(summary.lastReviewAt).toBe('2026-07-02T10:00:00.000Z');
  });

  it('normalizes stored rating breakdowns defensively', () => {
    expect(normalizeRatingBreakdown({
      1: 2,
      2: null,
      3: 0,
      4: 7,
      5: 12,
    } as Json)).toEqual({
      1: 2,
      2: 0,
      3: 0,
      4: 7,
      5: 12,
    });

    expect(normalizeRatingBreakdown(null)).toEqual({
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    });
  });

  it('calculates owner review moderation stats', () => {
    expect(calculateOwnerReviewStats([
      { status: 'pending' },
      { status: 'pending' },
      { status: 'published' },
      { status: 'hidden' },
      { status: 'rejected' },
      { status: 'flagged' },
    ])).toEqual({
      total: 6,
      pending: 2,
      published: 1,
      hidden: 1,
      rejected: 1,
      flagged: 1,
    });
  });

  it('parses review request RPC payloads defensively', () => {
    const result = parseReviewRequestRpcResult({
      success: true,
      review_request: {
        id: 'request-id',
        status: 'pending',
        booking_id: 'booking-id',
        expires_at: '2026-07-16T00:00:00.000Z',
        token: 'rv_token',
        path: '/review/request/rv_token',
      },
      page: {
        id: 'page-id',
        slug: 'expert',
        title: 'Expert Page',
      },
      booking: {
        id: 'booking-id',
        slot_date: '2026-07-01',
        slot_time: '10:00',
      },
    } as Json);

    expect(result.success).toBe(true);
    expect(result.review_request).toMatchObject({
      id: 'request-id',
      status: 'pending',
      booking_id: 'booking-id',
      token: 'rv_token',
    });
    expect(result.page).toMatchObject({ id: 'page-id', slug: 'expert' });
    expect(result.booking).toMatchObject({ id: 'booking-id', slot_date: '2026-07-01' });

    expect(parseReviewRequestRpcResult(null)).toEqual({
      success: false,
      error: 'invalid_response',
    });
  });
});
