import type { RevenueKitDraft } from '@/domain/revenue-kits/beauty-v1';

export interface RevenueKitStepProps {
  draft: RevenueKitDraft;
  onChange: (draft: RevenueKitDraft) => void;
}
