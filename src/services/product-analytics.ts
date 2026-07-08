import { supabase } from '@/platform/supabase/client';
import type { Json } from '@/platform/supabase/types';
import { logger } from '@/lib/utils/logger';

export const PRODUCT_EVENT_NAMES = [
  'signup_completed',
  'onboarding_started',
  'onboarding_step_completed',
  'onboarding_completed',
  'ai_page_generated',
  'block_added',
  'block_edited',
  'page_published',
  'telegram_connected',
  'first_lead_received',
  'lead_viewed',
  'lead_status_changed',
  'booking_created',
  'invoice_created',
  'payment_completed',
  'review_request_created',
  'review_request_used',
  'review_created',
  'review_published',
  'upgrade_clicked',
  'upgrade_completed',
  'billing_payment_failed',
  'billing_recovery_scheduled',
  'billing_recovered',
  'billing_recovery_exhausted',
  'promo_code_applied',
  'dashboard_returned',
] as const;

type ProductEventName = typeof PRODUCT_EVENT_NAMES[number];
type ProductEventSource = 'client' | 'edge' | 'system';

interface TrackProductEventInput {
  userId: string;
  eventName: ProductEventName;
  pageId?: string | null;
  source?: ProductEventSource;
  metadata?: Record<string, unknown>;
  occurredAt?: string;
}

interface CreatorActivationStateInput {
  signupCompletedAt?: string | null;
  onboardingStartedAt?: string | null;
  onboardingCompletedAt?: string | null;
  pageGeneratedAt?: string | null;
  firstEditAt?: string | null;
  pagePublishedAt?: string | null;
  conversionBlockAddedAt?: string | null;
  telegramConnectedAt?: string | null;
  firstLeadReceivedAt?: string | null;
  firstLeadProcessedAt?: string | null;
  firstBookingCreatedAt?: string | null;
  firstInvoiceCreatedAt?: string | null;
  firstPaymentCompletedAt?: string | null;
  upgradeClickedAt?: string | null;
  upgradeCompletedAt?: string | null;
  dashboardReturnedAt?: string | null;
}

interface CreatorHealthScoreBreakdown {
  score: number;
  pagePublishedPoints: number;
  conversionBlockPoints: number;
  telegramPoints: number;
  firstLeadPoints: number;
  leadProcessedPoints: number;
  dashboardReturnPoints: number;
  reasons: string[];
}

const PRODUCT_EVENT_TO_STATE_FIELD: Partial<Record<ProductEventName, keyof CreatorActivationStateInput>> = {
  signup_completed: 'signupCompletedAt',
  onboarding_started: 'onboardingStartedAt',
  onboarding_completed: 'onboardingCompletedAt',
  ai_page_generated: 'pageGeneratedAt',
  block_added: 'firstEditAt',
  block_edited: 'firstEditAt',
  page_published: 'pagePublishedAt',
  telegram_connected: 'telegramConnectedAt',
  first_lead_received: 'firstLeadReceivedAt',
  booking_created: 'firstBookingCreatedAt',
  invoice_created: 'firstInvoiceCreatedAt',
  payment_completed: 'firstPaymentCompletedAt',
  upgrade_clicked: 'upgradeClickedAt',
  upgrade_completed: 'upgradeCompletedAt',
  dashboard_returned: 'dashboardReturnedAt',
};

function toJsonObject(metadata: Record<string, unknown> | undefined): Json {
  return (metadata ?? {}) as Json;
}

function hasValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.length > 0;
}

function firstDefined<T>(current: T | null | undefined, next: T | null | undefined): T | null | undefined {
  return current ?? next;
}

export function calculateCreatorHealthScore(
  state: CreatorActivationStateInput
): CreatorHealthScoreBreakdown {
  const pagePublishedPoints = hasValue(state.pagePublishedAt) ? 20 : 0;
  const conversionBlockPoints = hasValue(state.conversionBlockAddedAt) ? 20 : 0;
  const telegramPoints = hasValue(state.telegramConnectedAt) ? 15 : 0;
  const firstLeadPoints = hasValue(state.firstLeadReceivedAt) ? 20 : 0;
  const leadProcessedPoints = hasValue(state.firstLeadProcessedAt) ? 15 : 0;
  const dashboardReturnPoints = hasValue(state.dashboardReturnedAt) ? 10 : 0;

  const reasons: string[] = [];
  if (pagePublishedPoints) reasons.push('page_published');
  if (conversionBlockPoints) reasons.push('conversion_block_added');
  if (telegramPoints) reasons.push('telegram_connected');
  if (firstLeadPoints) reasons.push('first_lead_received');
  if (leadProcessedPoints) reasons.push('lead_processed');
  if (dashboardReturnPoints) reasons.push('dashboard_returned');

  return {
    score: Math.min(
      100,
      pagePublishedPoints +
        conversionBlockPoints +
        telegramPoints +
        firstLeadPoints +
        leadProcessedPoints +
        dashboardReturnPoints
    ),
    pagePublishedPoints,
    conversionBlockPoints,
    telegramPoints,
    firstLeadPoints,
    leadProcessedPoints,
    dashboardReturnPoints,
    reasons,
  };
}

async function getAuthenticatedUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) return null;
  return data.user.id;
}

async function updateCreatorActivationState(
  input: TrackProductEventInput
): Promise<CreatorActivationStateInput | null> {
  const now = input.occurredAt ?? new Date().toISOString();
  const milestoneField = PRODUCT_EVENT_TO_STATE_FIELD[input.eventName];

  const { data: current, error: fetchError } = await supabase
    .from('creator_activation_state')
    .select('*')
    .eq('user_id', input.userId)
    .maybeSingle();

  if (fetchError) {
    logger.debug('Creator activation state fetch failed', { data: fetchError });
  }

  const nextState: DatabaseActivationStateUpsert = {
    user_id: input.userId,
    primary_page_id: input.pageId ?? current?.primary_page_id ?? null,
    signup_completed_at: current?.signup_completed_at ?? null,
    onboarding_started_at: current?.onboarding_started_at ?? null,
    onboarding_completed_at: current?.onboarding_completed_at ?? null,
    page_generated_at: current?.page_generated_at ?? null,
    first_edit_at: current?.first_edit_at ?? null,
    page_published_at: current?.page_published_at ?? null,
    conversion_block_added_at: current?.conversion_block_added_at ?? null,
    telegram_connected_at: current?.telegram_connected_at ?? null,
    first_lead_received_at: current?.first_lead_received_at ?? null,
    first_lead_processed_at: current?.first_lead_processed_at ?? null,
    first_booking_created_at: current?.first_booking_created_at ?? null,
    first_invoice_created_at: current?.first_invoice_created_at ?? null,
    first_payment_completed_at: current?.first_payment_completed_at ?? null,
    upgrade_clicked_at: current?.upgrade_clicked_at ?? null,
    upgrade_completed_at: current?.upgrade_completed_at ?? null,
    dashboard_returned_at: current?.dashboard_returned_at ?? null,
    updated_at: now,
  };

  if (milestoneField) {
    const column = toActivationStateColumn(milestoneField);
    nextState[column] = firstDefined(nextState[column], now) ?? null;
  }

  if (input.eventName === 'onboarding_step_completed' && input.metadata?.step === 'completed') {
    nextState.onboarding_completed_at = nextState.onboarding_completed_at ?? now;
  }

  if (
    input.eventName === 'block_added' &&
    typeof input.metadata?.blockType === 'string' &&
    ['pricing', 'booking', 'form'].includes(input.metadata.blockType)
  ) {
    nextState.conversion_block_added_at = nextState.conversion_block_added_at ?? now;
  }

  if (
    input.eventName === 'lead_status_changed' &&
    typeof input.metadata?.to === 'string' &&
    ['contacted', 'won', 'lost', 'converted'].includes(input.metadata.to)
  ) {
    nextState.first_lead_processed_at = nextState.first_lead_processed_at ?? now;
  }

  const { error: upsertError } = await supabase
    .from('creator_activation_state')
    .upsert(nextState, { onConflict: 'user_id' });

  if (upsertError) {
    logger.debug('Creator activation state upsert failed', { data: upsertError });
    return null;
  }

  return {
    signupCompletedAt: nextState.signup_completed_at,
    onboardingStartedAt: nextState.onboarding_started_at,
    onboardingCompletedAt: nextState.onboarding_completed_at,
    pageGeneratedAt: nextState.page_generated_at,
    firstEditAt: nextState.first_edit_at,
    pagePublishedAt: nextState.page_published_at,
    conversionBlockAddedAt: nextState.conversion_block_added_at,
    telegramConnectedAt: nextState.telegram_connected_at,
    firstLeadReceivedAt: nextState.first_lead_received_at,
    firstLeadProcessedAt: nextState.first_lead_processed_at,
    firstBookingCreatedAt: nextState.first_booking_created_at,
    firstInvoiceCreatedAt: nextState.first_invoice_created_at,
    firstPaymentCompletedAt: nextState.first_payment_completed_at,
    upgradeClickedAt: nextState.upgrade_clicked_at,
    upgradeCompletedAt: nextState.upgrade_completed_at,
    dashboardReturnedAt: nextState.dashboard_returned_at,
  };
}

function toActivationStateColumn(
  field: keyof CreatorActivationStateInput
): ActivationTimestampColumn {
  const map: Record<keyof CreatorActivationStateInput, ActivationTimestampColumn> = {
    signupCompletedAt: 'signup_completed_at',
    onboardingStartedAt: 'onboarding_started_at',
    onboardingCompletedAt: 'onboarding_completed_at',
    pageGeneratedAt: 'page_generated_at',
    firstEditAt: 'first_edit_at',
    pagePublishedAt: 'page_published_at',
    conversionBlockAddedAt: 'conversion_block_added_at',
    telegramConnectedAt: 'telegram_connected_at',
    firstLeadReceivedAt: 'first_lead_received_at',
    firstLeadProcessedAt: 'first_lead_processed_at',
    firstBookingCreatedAt: 'first_booking_created_at',
    firstInvoiceCreatedAt: 'first_invoice_created_at',
    firstPaymentCompletedAt: 'first_payment_completed_at',
    upgradeClickedAt: 'upgrade_clicked_at',
    upgradeCompletedAt: 'upgrade_completed_at',
    dashboardReturnedAt: 'dashboard_returned_at',
  };
  return map[field];
}

type DatabaseActivationStateUpsert = {
  user_id: string;
  primary_page_id: string | null;
  signup_completed_at: string | null;
  onboarding_started_at: string | null;
  onboarding_completed_at: string | null;
  page_generated_at: string | null;
  first_edit_at: string | null;
  page_published_at: string | null;
  conversion_block_added_at: string | null;
  telegram_connected_at: string | null;
  first_lead_received_at: string | null;
  first_lead_processed_at: string | null;
  first_booking_created_at: string | null;
  first_invoice_created_at: string | null;
  first_payment_completed_at: string | null;
  upgrade_clicked_at: string | null;
  upgrade_completed_at: string | null;
  dashboard_returned_at: string | null;
  updated_at: string;
};

type ActivationTimestampColumn = Exclude<
  keyof DatabaseActivationStateUpsert,
  'primary_page_id' | 'updated_at' | 'user_id'
>;

async function upsertCreatorHealthScore(
  userId: string,
  state: CreatorActivationStateInput
): Promise<CreatorHealthScoreBreakdown | null> {
  const score = calculateCreatorHealthScore(state);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('creator_health_scores')
    .upsert({
      user_id: userId,
      score: score.score,
      page_published_points: score.pagePublishedPoints,
      conversion_block_points: score.conversionBlockPoints,
      telegram_points: score.telegramPoints,
      first_lead_points: score.firstLeadPoints,
      lead_processed_points: score.leadProcessedPoints,
      dashboard_return_points: score.dashboardReturnPoints,
      reasons: score.reasons as Json,
      calculated_at: now,
      updated_at: now,
    }, { onConflict: 'user_id' });

  if (error) {
    logger.debug('Creator health score upsert failed', { data: error });
    return null;
  }

  return score;
}

async function trackProductEvent(input: TrackProductEventInput): Promise<void> {
  try {
    const occurredAt = input.occurredAt ?? new Date().toISOString();

    const { error } = await supabase
      .from('product_events')
      .insert({
        user_id: input.userId,
        page_id: input.pageId ?? null,
        event_name: input.eventName,
        source: input.source ?? 'client',
        metadata: toJsonObject(input.metadata),
        occurred_at: occurredAt,
      });

    if (error) {
      logger.debug('Product analytics event insert failed', { data: error });
      return;
    }

    const state = await updateCreatorActivationState({ ...input, occurredAt });
    if (state) {
      await upsertCreatorHealthScore(input.userId, state);
    }
  } catch (error) {
    logger.debug('Product analytics tracking failed', { data: error });
  }
}

export async function trackCurrentUserProductEvent(
  eventName: ProductEventName,
  options: Omit<TrackProductEventInput, 'eventName' | 'userId'> = {}
): Promise<void> {
  const userId = await getAuthenticatedUserId();
  if (!userId) return;

  await trackProductEvent({
    ...options,
    userId,
    eventName,
  });
}

export function mapActivationEventToProductEvent(
  eventType: string,
  metadata: Record<string, unknown> = {}
): ProductEventName | null {
  switch (eventType) {
    case 'wizard_started':
      return 'onboarding_started';
    case 'wizard_completed':
      return 'onboarding_step_completed';
    case 'page_published':
      return 'page_published';
    case 'funnel_step_connect_telegram_completed':
      return 'telegram_connected';
    case 'first_lead_captured':
      return 'first_lead_received';
    case 'lead_seen':
      return 'lead_viewed';
    case 'lead_status_changed':
      return 'lead_status_changed';
    case 'booking_confirmed':
    case 'booking_submitted':
      return 'booking_created';
    case 'creator_returned_after_gap':
      return 'dashboard_returned';
    case 'upgrade_from_limit':
      return 'upgrade_clicked';
    case 'activation_checklist_step_completed':
      if (metadata.stepId === 'publish') return 'page_published';
      if (metadata.stepId === 'connect-telegram') return 'telegram_connected';
      if (metadata.stepId === 'first-lead') return 'first_lead_received';
      return null;
    default:
      return null;
  }
}

export async function trackProductEventFromActivation(
  pageId: string,
  activationEventType: string,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const eventName = mapActivationEventToProductEvent(activationEventType, metadata);
  if (!eventName) return;

  const userId = await getAuthenticatedUserId();
  if (!userId) return;

  await trackProductEvent({
    userId,
    pageId,
    eventName,
    metadata: activationEventType === 'wizard_completed'
      ? { ...metadata, step: 'completed' }
      : metadata,
  });
}
