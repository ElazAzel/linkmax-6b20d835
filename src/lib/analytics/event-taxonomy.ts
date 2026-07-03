/**
 * Unified Event Taxonomy (P0 — OSS Benchmark Strategy 2026)
 *
 * Единый канонический список продуктовых событий LinkMAX.
 * На этой таксономии растут ОБА измерительных слоя:
 *   - creator-facing (Plausible/Umami-style, простые goals)
 *   - internal (PostHog-style funnels/replay/flags)
 *
 * Storage-контракт:
 *   - Каноническое имя события всегда пишется в `metadata.event`.
 *   - `metadata.source_object` описывает объект-источник (page/block/link/form/...).
 *   - Legacy колонка `analytics.event_type` остаётся 'view' | 'click' | 'share'
 *     и заполняется через `TAXONOMY_STORAGE_MAP` — это сохраняет обратную
 *     совместимость с существующими графиками и репозиторием.
 */

import type {
  AnalyticsEventType,
  IAnalyticsRepository,
} from '@/repositories/interfaces/IAnalyticsRepository';

// ============= Canonical events =============

export const CANONICAL_EVENTS = {
  page_view: 'page_view',
  link_click: 'link_click',
  cta_opened: 'cta_opened',
  form_started: 'form_started',
  form_submitted: 'form_submitted',
  survey_completed: 'survey_completed',
  booking_started: 'booking_started',
  booking_confirmed: 'booking_confirmed',
  deal_created: 'deal_created',
  checkout_started: 'checkout_started',
  payment_succeeded: 'payment_succeeded',
  document_sent: 'document_sent',
  document_signed: 'document_signed',
  support_conversation_started: 'support_conversation_started',
  share: 'share',
} as const;

export type CanonicalEvent = keyof typeof CANONICAL_EVENTS;

/**
 * Каждое каноническое событие маппится в один из legacy типов колонки
 * `analytics.event_type` — иначе INSERT упадёт на CHECK-constraint.
 */
export const TAXONOMY_STORAGE_MAP: Record<CanonicalEvent, AnalyticsEventType> = {
  page_view: 'view',
  link_click: 'click',
  cta_opened: 'click',
  form_started: 'click',
  form_submitted: 'click',
  survey_completed: 'click',
  booking_started: 'click',
  booking_confirmed: 'click',
  deal_created: 'click',
  checkout_started: 'click',
  payment_succeeded: 'click',
  document_sent: 'click',
  document_signed: 'click',
  support_conversation_started: 'click',
  share: 'share',
};

// ============= Object graph reference =============

/**
 * `source_object` унифицирует привязку события к бизнес-объекту любого слоя
 * (Presentation/Growth/Ops/Money/Trust). Позволяет джойнить события с
 * `leads`, `zone_contacts`, `zone_deals`, `bookings`, `orders`, `zone_documents`.
 */
export type SourceObjectType =
  | 'page'
  | 'block'
  | 'link'
  | 'form'
  | 'survey'
  | 'booking'
  | 'lead'
  | 'contact'
  | 'deal'
  | 'order'
  | 'invoice'
  | 'document'
  | 'conversation';

export interface SourceObjectRef {
  type: SourceObjectType;
  id: string;
}

export interface CanonicalTrackDTO {
  event: CanonicalEvent;
  pageId: string;
  blockId?: string;
  sourceObject?: SourceObjectRef;
  metadata?: Record<string, unknown>;
}

// ============= Helper =============

/**
 * Единая точка трекинга канонических событий. Использует существующий
 * репозиторий, но обогащает payload унифицированной таксономией.
 */
export async function trackCanonicalEvent(
  repo: IAnalyticsRepository,
  dto: CanonicalTrackDTO
): Promise<void> {
  const legacyType = TAXONOMY_STORAGE_MAP[dto.event] ?? 'click';
  await repo.trackEvent({
    pageId: dto.pageId,
    eventType: legacyType,
    blockId: dto.blockId,
    metadata: {
      ...(dto.metadata ?? {}),
      event: dto.event,
      taxonomy_version: 1,
      ...(dto.sourceObject
        ? {
            source_object: dto.sourceObject,
            source_object_type: dto.sourceObject.type,
            source_object_id: dto.sourceObject.id,
          }
        : {}),
    },
  });
}
