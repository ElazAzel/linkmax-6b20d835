export const DATABASE_PREMIUM_TIERS = ['free', 'starter', 'pro', 'business'] as const;
export type DatabasePremiumTier = (typeof DATABASE_PREMIUM_TIERS)[number];

export const APP_PREMIUM_TIERS = ['identity', 'starter', 'pro', 'business'] as const;
export type AppPremiumTier = (typeof APP_PREMIUM_TIERS)[number];

type TierKey = AppPremiumTier | DatabasePremiumTier;

export const TIER_LEVELS = {
  free: 0,
  identity: 0,
  starter: 1,
  pro: 2,
  business: 3,
} as const satisfies Record<TierKey, number>;

export const TIER_LABELS = {
  free: 'Identity',
  identity: 'Identity',
  starter: 'Starter',
  pro: 'Pro',
  business: 'Business',
} as const satisfies Record<TierKey, string>;

export const TIER_COMMISSION_RATES = {
  free: 0,
  identity: 0,
  starter: 0.07,
  pro: 0.01,
  business: 0,
} as const satisfies Record<TierKey, number>;

export function isDatabasePremiumTier(tier: unknown): tier is DatabasePremiumTier {
  return typeof tier === 'string' && DATABASE_PREMIUM_TIERS.includes(tier as DatabasePremiumTier);
}

export function isAppPremiumTier(tier: unknown): tier is AppPremiumTier {
  return typeof tier === 'string' && APP_PREMIUM_TIERS.includes(tier as AppPremiumTier);
}

export function normalizeDatabasePremiumTier(tier: unknown): DatabasePremiumTier {
  return isDatabasePremiumTier(tier) ? tier : 'free';
}

export function normalizeAppPremiumTier(tier: unknown): AppPremiumTier {
  if (tier === 'free' || tier == null) {
    return 'identity';
  }

  return isAppPremiumTier(tier) ? tier : 'identity';
}

export function toDatabasePremiumTier(tier: AppPremiumTier | DatabasePremiumTier): DatabasePremiumTier {
  return tier === 'identity' ? 'free' : tier;
}

export function hasTierAccess(currentTier: AppPremiumTier, requiredTier: AppPremiumTier): boolean {
  return TIER_LEVELS[currentTier] >= TIER_LEVELS[requiredTier];
}

export function getTierDisplayName(tier: AppPremiumTier): string {
  return TIER_LABELS[tier].toUpperCase();
}

export function getTierCommissionRate(tier: AppPremiumTier | DatabasePremiumTier): number {
  return TIER_COMMISSION_RATES[tier];
}
