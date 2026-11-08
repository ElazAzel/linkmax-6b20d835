import { supabase } from '@/platform/supabase/client';
import type { AppDatabase } from '@/platform/supabase/extended-types';
import type { Json } from '@/platform/supabase/types';
import { logger } from '@/lib/utils/logger';

export const FEATURE_FLAG_KEYS = [
  'booking_v2_enabled',
  'form_builder_v2_enabled',
  'automation_builder_enabled',
  'developer_portal_v2_enabled',
  'marketplace_enabled',
  'native_push_enabled',
  'ai_copilot_enabled',
  'revenue_core_v1',
  'beauty_revenue_kit_v1',
  'outcome_home_v1',
  'booking_self_service_v1',
] as const;

type FeatureFlagKey = typeof FEATURE_FLAG_KEYS[number];
type FeatureFlagRuleType =
  | 'user_id'
  | 'tier'
  | 'niche'
  | 'country'
  | 'language'
  | 'role'
  | 'percentage'
  | 'beta_list';
type FeatureFlagOperator = 'in' | 'not_in' | 'equals' | 'not_equals';
type FeatureFlagRow = AppDatabase['public']['Tables']['feature_flags']['Row'];
type FeatureFlagRuleRow = AppDatabase['public']['Tables']['feature_flag_rules']['Row'];

interface FeatureFlagContext {
  userId?: string | null;
  tier?: string | null;
  niche?: string | null;
  country?: string | null;
  language?: string | null;
  role?: string | null;
  roles?: string[];
  betaList?: string[];
  now?: string | Date;
}

interface FeatureFlagRuleDefinition {
  ruleType: FeatureFlagRuleType;
  operator: FeatureFlagOperator;
  values: Json;
  rolloutPercentage?: number | null;
  priority: number;
  isEnabled: boolean;
}

interface FeatureFlagDefinition {
  key: string;
  isEnabled: boolean;
  defaultEnabled: boolean;
  rolloutPercentage: number;
  startsAt?: string | null;
  endsAt?: string | null;
  rules: FeatureFlagRuleDefinition[];
}

const KNOWN_FEATURE_FLAG_KEYS = new Set<string>(FEATURE_FLAG_KEYS);

export function isKnownFeatureFlagKey(key: string): key is FeatureFlagKey {
  return KNOWN_FEATURE_FLAG_KEYS.has(key);
}

function normalizeToken(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function normalizeList(values: Array<string | null | undefined>): string[] {
  return values
    .map(normalizeToken)
    .filter((value): value is string => value !== null);
}

function jsonToStringArray(values: Json): string[] {
  if (Array.isArray(values)) {
    return values
      .filter((value): value is string | number | boolean => (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ))
      .map((value) => String(value));
  }

  if (values && typeof values === 'object' && 'values' in values) {
    return jsonToStringArray(values.values ?? []);
  }

  if (
    typeof values === 'string' ||
    typeof values === 'number' ||
    typeof values === 'boolean'
  ) {
    return [String(values)];
  }

  return [];
}

function jsonToPercentage(values: Json): number | null {
  if (typeof values === 'number') return values;
  if (typeof values === 'string') {
    const parsed = Number(values);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (values && typeof values === 'object' && !Array.isArray(values) && typeof values.percentage === 'number') {
    return values.percentage;
  }
  const [firstValue] = jsonToStringArray(values);
  if (!firstValue) return null;
  const parsed = Number(firstValue);
  return Number.isFinite(parsed) ? parsed : null;
}

function hashToBucket(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 100;
}

function isInRollout(flagKey: string, userId: string | null | undefined, percentage: number | null | undefined): boolean {
  const safePercentage = Math.max(0, Math.min(100, percentage ?? 0));
  if (safePercentage <= 0) return false;
  if (safePercentage >= 100) return true;
  if (!userId) return false;
  return hashToBucket(`${flagKey}:${userId}`) < safePercentage;
}

function isInsideWindow(flag: FeatureFlagDefinition, nowValue: string | Date | undefined): boolean {
  const now = nowValue instanceof Date
    ? nowValue
    : new Date(nowValue ?? Date.now());

  if (flag.startsAt && now < new Date(flag.startsAt)) return false;
  if (flag.endsAt && now >= new Date(flag.endsAt)) return false;
  return true;
}

function contextValuesForRule(
  flagKey: string,
  ruleType: FeatureFlagRuleType,
  context: FeatureFlagContext
): string[] {
  switch (ruleType) {
    case 'user_id':
      return normalizeList([context.userId]);
    case 'tier':
      return normalizeList([context.tier]);
    case 'niche':
      return normalizeList([context.niche]);
    case 'country':
      return normalizeList([context.country]);
    case 'language':
      return normalizeList([context.language]);
    case 'role':
      return normalizeList([context.role, ...(context.roles ?? [])]);
    case 'beta_list':
      return normalizeList([context.userId, ...(context.betaList ?? []), flagKey]);
    case 'percentage':
      return normalizeList([context.userId]);
    default:
      return [];
  }
}

function stringRuleMatches(ruleValues: string[], contextValues: string[], operator: FeatureFlagOperator): boolean {
  if (contextValues.length === 0) return false;

  const normalizedRuleValues = new Set(normalizeList(ruleValues));
  if (normalizedRuleValues.size === 0) return false;

  const hasIntersection = contextValues.some((value) => normalizedRuleValues.has(value));

  switch (operator) {
    case 'equals':
    case 'in':
      return hasIntersection;
    case 'not_equals':
    case 'not_in':
      return !hasIntersection;
    default:
      return false;
  }
}

function ruleMatches(flagKey: string, rule: FeatureFlagRuleDefinition, context: FeatureFlagContext): boolean {
  if (!rule.isEnabled) return false;

  if (rule.ruleType === 'percentage') {
    return isInRollout(
      flagKey,
      context.userId,
      rule.rolloutPercentage ?? jsonToPercentage(rule.values)
    );
  }

  return stringRuleMatches(
    jsonToStringArray(rule.values),
    contextValuesForRule(flagKey, rule.ruleType, context),
    rule.operator
  );
}

export function evaluateFeatureFlag(
  flag: FeatureFlagDefinition,
  context: FeatureFlagContext = {}
): boolean {
  if (!flag.isEnabled) return false;
  if (!isInsideWindow(flag, context.now)) return false;
  if (isInRollout(flag.key, context.userId, flag.rolloutPercentage)) return true;

  const sortedRules = [...flag.rules]
    .filter((rule) => rule.isEnabled)
    .sort((left, right) => left.priority - right.priority);

  if (sortedRules.some((rule) => ruleMatches(flag.key, rule, context))) {
    return true;
  }

  return flag.defaultEnabled;
}

function mapFeatureFlag(row: FeatureFlagRow, rules: FeatureFlagRuleRow[]): FeatureFlagDefinition {
  return {
    key: row.key,
    isEnabled: row.is_enabled,
    defaultEnabled: row.default_enabled,
    rolloutPercentage: row.rollout_percentage,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    rules: rules.map((rule) => ({
      ruleType: rule.rule_type as FeatureFlagRuleType,
      operator: rule.operator as FeatureFlagOperator,
      values: rule.values,
      rolloutPercentage: rule.rollout_percentage,
      priority: rule.priority,
      isEnabled: rule.is_enabled,
    })),
  };
}

async function fetchFeatureFlags(keys?: string[]): Promise<FeatureFlagDefinition[]> {
  try {
    let flagsQuery = supabase
      .from('feature_flags')
      .select('*');

    if (keys && keys.length > 0) {
      flagsQuery = flagsQuery.in('key', keys);
    }

    const { data: flags, error: flagsError } = await flagsQuery;
    if (flagsError) throw flagsError;
    if (!flags || flags.length === 0) return [];

    const flagIds = flags.map((flag) => flag.id);
    const { data: rules, error: rulesError } = await supabase
      .from('feature_flag_rules')
      .select('*')
      .in('flag_id', flagIds)
      .eq('is_enabled', true)
      .order('priority', { ascending: true });

    if (rulesError) throw rulesError;

    return flags.map((flag) => mapFeatureFlag(
      flag,
      (rules ?? []).filter((rule) => rule.flag_id === flag.id)
    ));
  } catch (error) {
    logger.debug('Feature flags fetch failed', { data: error });
    return [];
  }
}

// Flags and the user's flag context barely change within a session, while
// the dashboard asks for several flags on every mount. Cache both briefly so a
// visit costs one round of requests instead of one per flag and per mount.
const FLAG_CACHE_MS = 60 * 1000;
const flagCache = new Map<string, { at: number; promise: Promise<FeatureFlagDefinition | undefined> }>();
let userContextCache: { userId: string; at: number; promise: Promise<{ tier: string | null; language: string | null; roles: string[] }> } | null = null;

function cachedFlag(key: string): Promise<FeatureFlagDefinition | undefined> {
  const hit = flagCache.get(key);
  if (hit && Date.now() - hit.at < FLAG_CACHE_MS) return hit.promise;
  const promise = fetchFeatureFlags([key]).then(([flag]) => flag);
  flagCache.set(key, { at: Date.now(), promise });
  return promise;
}

function cachedUserContext(userId: string) {
  if (userContextCache?.userId === userId && Date.now() - userContextCache.at < FLAG_CACHE_MS) return userContextCache.promise;
  const promise = Promise.all([
    supabase
      .from('user_profiles')
      .select('premium_tier, telegram_language')
      .eq('id', userId)
      .maybeSingle(),
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId),
  ]).then(([profileResult, rolesResult]) => ({
    tier: profileResult.data?.premium_tier ?? null,
    language: profileResult.data?.telegram_language ?? null,
    roles: rolesResult.data?.map((role) => role.role) ?? [],
  }));
  userContextCache = { userId, at: Date.now(), promise };
  return promise;
}

export async function isCurrentUserFeatureFlagEnabled(
  key: string,
  context: Omit<FeatureFlagContext, 'userId'> = {}
): Promise<boolean> {
  // The local session is enough to evaluate rollout rules; getUser() would add
  // a network round trip to the auth server for every flag.
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user?.id;
  if (!userId) return false;

  const [flag, userContext] = await Promise.all([cachedFlag(key), cachedUserContext(userId)]);
  if (!flag) return false;

  return evaluateFeatureFlag(flag, {
    ...context,
    userId,
    tier: context.tier ?? userContext.tier,
    language: context.language ?? userContext.language,
    roles: context.roles ?? userContext.roles,
  });
}
