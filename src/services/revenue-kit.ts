import type {
  RevenueKitDraft,
  RevenueKitStep,
} from '@/domain/revenue-kits/beauty-v1';
import { supabase } from '@/platform/supabase/client';
import type { Json } from '@/platform/supabase/types';

export interface RevenueKitDraftRecord {
  step: RevenueKitStep;
  draft: RevenueKitDraft;
  updatedAt: string;
}

export interface RevenueKitApplyResult {
  pageId: string;
  offeringIds: string[];
  blockIds: {
    profile: string;
    pricing: string;
    booking: string;
    messenger: string;
  };
  idempotentReplay: boolean;
}

type RevenueKitServiceResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isOkResponse(value: unknown): value is Record<string, unknown> & { ok: true } {
  return Boolean(value)
    && typeof value === 'object'
    && !Array.isArray(value)
    && (value as Record<string, unknown>).ok === true;
}

function isDraft(value: unknown): value is RevenueKitDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<RevenueKitDraft>;
  return draft.version === 1
    && draft.kitId === 'beauty-v1'
    && ['nails', 'lashes', 'brows'].includes(draft.niche ?? '')
    && Array.isArray(draft.services)
    && Boolean(draft.identity)
    && Boolean(draft.availability)
    && Boolean(draft.depositPolicy);
}

function isDraftRecord(value: unknown): value is RevenueKitDraftRecord {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return isString(record.step)
    && isDraft(record.draft)
    && isString(record.updatedAt);
}

function isApplyResult(value: unknown): value is RevenueKitApplyResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Record<string, unknown>;
  const blockIds = result.blockIds;
  if (!blockIds || typeof blockIds !== 'object') return false;
  const blocks = blockIds as Record<string, unknown>;

  return isString(result.pageId)
    && Array.isArray(result.offeringIds)
    && result.offeringIds.every(isString)
    && ['profile', 'pricing', 'booking', 'messenger'].every((role) => isString(blocks[role]))
    && typeof result.idempotentReplay === 'boolean';
}

function rpcError(error: { message?: string; code?: string } | null): string {
  return error?.code || error?.message || 'request_failed';
}

export async function loadRevenueKitDraft(
  pageId: string,
): Promise<RevenueKitServiceResult<RevenueKitDraftRecord | null>> {
  const { data, error } = await supabase.rpc('get_revenue_kit_draft', {
    p_page_id: pageId,
    p_kit_id: 'beauty-v1',
  });

  if (error) return { ok: false, error: rpcError(error) };
  if (data === null) return { ok: true, value: null };
  if (!isOkResponse(data) || !isDraftRecord(data)) {
    return { ok: false, error: 'invalid_response' };
  }

  return {
    ok: true,
    value: { step: data.step, draft: data.draft, updatedAt: data.updatedAt },
  };
}

export async function saveRevenueKitDraft(
  pageId: string,
  step: RevenueKitStep,
  draft: RevenueKitDraft,
): Promise<RevenueKitServiceResult<RevenueKitDraftRecord>> {
  const { data, error } = await supabase.rpc('save_revenue_kit_draft', {
    p_page_id: pageId,
    p_kit_id: 'beauty-v1',
    p_step: step,
    p_draft: draft as unknown as Json,
  });

  if (error) return { ok: false, error: rpcError(error) };
  if (!isOkResponse(data) || !isDraftRecord(data)) {
    return { ok: false, error: 'invalid_response' };
  }

  return {
    ok: true,
    value: { step: data.step, draft: data.draft, updatedAt: data.updatedAt },
  };
}

export async function applyRevenueKit(
  pageId: string,
  draft: RevenueKitDraft,
  mutationId: string,
): Promise<RevenueKitServiceResult<RevenueKitApplyResult>> {
  const { data, error } = await supabase.rpc('apply_revenue_kit_v1', {
    p_page_id: pageId,
    p_draft: draft as unknown as Json,
    p_mutation_id: mutationId,
  });

  if (error) return { ok: false, error: rpcError(error) };
  if (!isOkResponse(data) || !isApplyResult(data)) {
    return { ok: false, error: 'invalid_response' };
  }

  return {
    ok: true,
    value: {
      pageId: data.pageId,
      offeringIds: data.offeringIds,
      blockIds: data.blockIds,
      idempotentReplay: data.idempotentReplay,
    },
  };
}
