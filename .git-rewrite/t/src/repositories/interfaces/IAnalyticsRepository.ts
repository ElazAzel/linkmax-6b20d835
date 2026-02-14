/**
 * Analytics Repository Interface - Contract for analytics data operations
 * Part of the Repository pattern (Clean Architecture)
 */

import type { Result } from '@/domain/value-objects/Result';

// ============= Types =============

export type AnalyticsEventType = 'view' | 'click' | 'share';

export interface AnalyticsEvent {
  id: string;
  pageId: string;
  blockId: string | null;
  eventType: AnalyticsEventType;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface TrackEventDTO {
  pageId: string;
  eventType: AnalyticsEventType;
  blockId?: string;
  metadata?: Record<string, unknown>;
}

export interface FetchAnalyticsDTO {
  pageId: string;
  startDate: Date;
  endDate: Date;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalClicks: number;
  totalShares: number;
  uniqueVisitors: number;
}

// ============= Repository Interface =============

/**
 * Analytics Repository Interface
 * Defines the contract for analytics data access
 */
export interface IAnalyticsRepository {
  /**
   * Track an analytics event
   */
  trackEvent(dto: TrackEventDTO): Promise<Result<void, Error>>;

  /**
   * Track a page view
   */
  trackPageView(pageId: string): Promise<Result<void, Error>>;

  /**
   * Track a block click
   */
  trackBlockClick(
    pageId: string,
    blockId: string,
    blockType?: string,
    blockTitle?: string
  ): Promise<Result<void, Error>>;

  /**
   * Track a share event
   */
  trackShare(pageId: string, method?: string): Promise<Result<void, Error>>;

  /**
   * Fetch analytics events for a page
   */
  fetchEvents(dto: FetchAnalyticsDTO): Promise<Result<AnalyticsEvent[], Error>>;

  /**
   * Get analytics summary for a page
   */
  getSummary(dto: FetchAnalyticsDTO): Promise<Result<AnalyticsSummary, Error>>;
}
