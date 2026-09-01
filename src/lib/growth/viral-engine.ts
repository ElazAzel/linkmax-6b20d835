import type { Block, PageData } from '@/types/page';

type ViralDimensionKey =
  | 'identity'
  | 'offer'
  | 'conversion'
  | 'communication'
  | 'trust'
  | 'operations'
  | 'analytics';

interface ViralDimension {
  key: ViralDimensionKey;
  score: number;
  weight: number;
  present: boolean;
  matchedBlockTypes: string[];
  recommendedBlockTypes: string[];
}

interface ViralReadinessResult {
  score: number;
  dimensions: ViralDimension[];
  nextActions: ViralDimensionKey[];
}

interface ViralKFactorInput {
  invitesSent: number;
  attributedSignups: number;
  activeUsers: number;
}

interface ViralKFactorResult {
  invitesPerActiveUser: number;
  inviteToSignupRate: number;
  kFactor: number;
}

const DIMENSION_CONFIG: Array<{
  key: ViralDimensionKey;
  weight: number;
  blockTypes: string[];
  recommendedBlockTypes: string[];
}> = [
  { key: 'identity', weight: 20, blockTypes: ['profile', 'socials'], recommendedBlockTypes: ['profile', 'socials'] },
  { key: 'offer', weight: 20, blockTypes: ['product', 'catalog', 'pricing', 'service'], recommendedBlockTypes: ['product', 'pricing', 'catalog'] },
  { key: 'conversion', weight: 20, blockTypes: ['button', 'form', 'booking', 'messenger'], recommendedBlockTypes: ['button', 'form', 'booking'] },
  { key: 'communication', weight: 15, blockTypes: ['socials', 'messenger', 'community', 'newsletter'], recommendedBlockTypes: ['messenger', 'socials'] },
  { key: 'trust', weight: 10, blockTypes: ['testimonial', 'faq', 'before_after'], recommendedBlockTypes: ['testimonial', 'faq'] },
  { key: 'operations', weight: 10, blockTypes: ['booking', 'form', 'event', 'download'], recommendedBlockTypes: ['booking', 'form'] },
  { key: 'analytics', weight: 5, blockTypes: ['analytics'], recommendedBlockTypes: ['button', 'form'] },
];

function getBlockTypes(blocks: Block[]): Set<string> {
  return new Set(blocks.map((block) => block.type));
}

/**
 * Deterministic score used in the editor and in the analytics layer.
 * It intentionally depends only on persisted page structure and settings.
 */
export function calculateViralReadiness(page: Pick<PageData, 'blocks' | 'integrations' | 'isPublished'>): ViralReadinessResult {
  const types = getBlockTypes(page.blocks || []);
  const hasAnalytics = Boolean(
    page.integrations?.ga4_id ||
      page.integrations?.yandex_metrika ||
      page.integrations?.fb_pixel ||
      page.integrations?.tt_pixel ||
      page.isPublished
  );

  const dimensions = DIMENSION_CONFIG.map((config) => {
    const matchedBlockTypes = config.blockTypes.filter((type) => types.has(type));
    const present = config.key === 'analytics' ? hasAnalytics : matchedBlockTypes.length > 0;
    return {
      key: config.key,
      score: present ? config.weight : 0,
      weight: config.weight,
      present,
      matchedBlockTypes,
      recommendedBlockTypes: config.recommendedBlockTypes,
    } satisfies ViralDimension;
  });

  return {
    score: dimensions.reduce((total, dimension) => total + dimension.score, 0),
    dimensions,
    nextActions: dimensions.filter((dimension) => !dimension.present).map((dimension) => dimension.key),
  };
}

export function calculateViralKFactor(input: ViralKFactorInput): ViralKFactorResult {
  const invitesSent = Math.max(0, Number.isFinite(input.invitesSent) ? input.invitesSent : 0);
  const attributedSignups = Math.max(0, Number.isFinite(input.attributedSignups) ? input.attributedSignups : 0);
  const activeUsers = Math.max(0, Number.isFinite(input.activeUsers) ? input.activeUsers : 0);
  const invitesPerActiveUser = activeUsers > 0 ? invitesSent / activeUsers : 0;
  const inviteToSignupRate = invitesSent > 0 ? Math.min(1, attributedSignups / invitesSent) : 0;

  return {
    invitesPerActiveUser,
    inviteToSignupRate,
    kFactor: invitesPerActiveUser * inviteToSignupRate,
  };
}

export function getViralReadinessLabel(score: number): 'starting' | 'ready' | 'strong' {
  if (score >= 80) return 'strong';
  if (score >= 50) return 'ready';
  return 'starting';
}
