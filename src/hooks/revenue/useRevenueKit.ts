import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  createBeautyPreset,
  type BeautyNiche,
  type RevenueKitDraft,
  type RevenueKitStep,
} from '@/domain/revenue-kits/beauty-v1';
import {
  applyRevenueKit,
  loadRevenueKitDraft,
  saveRevenueKitDraft,
  type RevenueKitApplyResult,
  type RevenueKitDraftRecord,
} from '@/services/revenue-kit';

interface UseRevenueKitOptions {
  pageId: string;
  initialNiche?: BeautyNiche;
}

interface SaveStepVariables {
  step: RevenueKitStep;
  draft: RevenueKitDraft;
}

interface ApplyVariables {
  draft: RevenueKitDraft;
  mutationId: string;
}

export function serializeRevenueKitDraft(draft: RevenueKitDraft): RevenueKitDraft {
  return {
    version: 1,
    kitId: 'beauty-v1',
    niche: draft.niche,
    identity: {
      displayName: draft.identity.displayName,
      city: draft.identity.city,
      specialization: draft.identity.specialization,
      avatarUrl: draft.identity.avatarUrl,
      contactChannel: draft.identity.contactChannel,
      contactValue: draft.identity.contactValue,
    },
    services: draft.services.map((service) => ({
      presetId: service.presetId,
      name: { ...service.name },
      description: { ...service.description },
      durationMinutes: service.durationMinutes,
      priceAmount: service.priceAmount,
      currency: 'KZT',
      active: service.active,
      displayOrder: service.displayOrder,
    })),
    availability: {
      weekdays: [...draft.availability.weekdays],
      startTime: draft.availability.startTime,
      endTime: draft.availability.endTime,
      breakStart: draft.availability.breakStart,
      breakEnd: draft.availability.breakEnd,
      timezone: 'Asia/Almaty',
      bookingHorizonDays: draft.availability.bookingHorizonDays,
    },
    depositPolicy: {
      deposit: { ...draft.depositPolicy.deposit },
      cancellationWindowHours: draft.depositPolicy.cancellationWindowHours,
      paymentInstructions: { ...draft.depositPolicy.paymentInstructions },
    },
    trust: {
      portfolioUrls: [...draft.trust.portfolioUrls],
      policyAccepted: draft.trust.policyAccepted,
    },
    distribution: {
      publish: draft.distribution.publish,
      channels: [...draft.distribution.channels],
    },
  };
}

export function useRevenueKit({
  pageId,
  initialNiche = 'nails',
}: UseRevenueKitOptions) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ['revenue-kit', pageId, 'beauty-v1'] as const,
    [pageId],
  );
  const initialDraft = useMemo(() => createBeautyPreset(initialNiche), [initialNiche]);

  const draftQuery = useQuery({
    queryKey,
    enabled: pageId.length > 0,
    queryFn: async (): Promise<RevenueKitDraftRecord | null> => {
      const result = await loadRevenueKitDraft(pageId);
      if (!result.ok) throw new Error(result.error);
      return result.value;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ step, draft }: SaveStepVariables): Promise<RevenueKitDraftRecord> => {
      const serialized = serializeRevenueKitDraft(draft);
      const result = await saveRevenueKitDraft(pageId, step, serialized);
      if (!result.ok) throw new Error(result.error);
      return result.value;
    },
    onSuccess: (record) => {
      queryClient.setQueryData(queryKey, record);
    },
  });

  const applyMutation = useMutation({
    mutationFn: async ({ draft, mutationId }: ApplyVariables): Promise<RevenueKitApplyResult> => {
      const result = await applyRevenueKit(pageId, serializeRevenueKitDraft(draft), mutationId);
      if (!result.ok) throw new Error(result.error);
      return result.value;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        queryClient.invalidateQueries({ queryKey: ['page', pageId] }),
        queryClient.invalidateQueries({ queryKey: ['service-offerings', pageId] }),
      ]);
    },
  });

  const draft = draftQuery.data?.draft ?? initialDraft;
  const step = draftQuery.data?.step ?? 'identity';
  const error = draftQuery.error ?? saveMutation.error ?? applyMutation.error ?? null;

  return {
    draft,
    step,
    isLoading: draftQuery.isLoading,
    isSaving: saveMutation.isPending,
    isApplying: applyMutation.isPending,
    error,
    saveStep: (nextStep: RevenueKitStep, nextDraft: RevenueKitDraft) => (
      saveMutation.mutateAsync({ step: nextStep, draft: nextDraft })
    ),
    apply: (mutationId = `revenue-kit:${crypto.randomUUID()}`) => (
      applyMutation.mutateAsync({ draft, mutationId })
    ),
  };
}
