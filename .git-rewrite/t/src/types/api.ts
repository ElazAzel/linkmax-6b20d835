/**
 * API-related types for Supabase operations
 */
import type { PageData, Block, PageTheme } from './page';

// ============= Database Types =============

/**
 * Page record from database
 */
export interface DbPage {
  id: string;
  user_id: string;
  slug: string;
  title: string | null;
  description: string | null;
  avatar_url: string | null;
  avatar_style: Record<string, unknown> | null;
  theme_settings: PageTheme | null;
  seo_meta: PageSeoMeta | null;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Block record from database
 */
export interface DbBlock {
  id: string;
  page_id: string;
  type: string;
  position: number;
  title: string | null;
  content: Block;
  style: Record<string, unknown> | null;
  is_premium: boolean;
  click_count: number;
  created_at: string;
  schedule?: Record<string, unknown> | null;
}

/**
 * User profile record from database
 */
export interface DbUserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_premium: boolean | null;
  trial_ends_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Analytics event record from database
 */
export interface DbAnalyticsEvent {
  id: string;
  page_id: string | null;
  block_id: string | null;
  event_type: 'view' | 'click' | 'share';
  metadata: Record<string, unknown> | null;
  created_at: string | null;
}

/**
 * SEO metadata structure
 */
export interface PageSeoMeta {
  title: string;
  description: string;
  keywords: string[];
}

// ============= API Result Types =============

/**
 * Standard API result wrapper
 */
export interface ApiResult<T> {
  data: T | null;
  error: Error | null;
}

/**
 * Save page operation result
 */
export interface SavePageResult extends ApiResult<DbPage> {}

/**
 * Load page operation result
 */
export interface LoadPageResult extends ApiResult<PageData> {}

/**
 * Load user page result with chatbot context
 */
export interface LoadUserPageResult {
  data: PageData | null;
  chatbotContext: string | null;
  error: Error | null;
}

/**
 * Publish page result
 */
export interface PublishPageResult {
  slug: string | null;
  error: Error | null;
}

/**
 * Premium status result
 */
export interface PremiumStatusResult {
  isPremium: boolean;
  tier: 'free' | 'pro' | 'business';
  trialEndsAt: string | null;
  inTrial: boolean;
}

// ============= RPC Function Types =============

/**
 * Input for upsert_user_page RPC function
 */
export interface UpsertUserPageInput {
  p_user_id: string;
  p_slug: string;
  p_title: string;
  p_description: string | null;
  p_avatar_url: string | null;
  p_avatar_style: Record<string, unknown>;
  p_theme_settings: PageTheme;
  p_seo_meta: PageSeoMeta;
}

/**
 * Input for save_page_blocks RPC function
 */
export interface SavePageBlocksInput {
  p_page_id: string;
  p_blocks: Array<{
    type: string;
    position: number;
    title: string | null;
    content: Block;
    style: Record<string, unknown>;
    schedule: Record<string, unknown> | null;
  }>;
  p_is_premium: boolean;
}

/**
 * Input for generate_unique_slug RPC function
 */
export interface GenerateUniqueSlugInput {
  base_slug: string;
}

// ============= Helper Functions =============

/**
 * Wrap any error into a standard Error object
 */
export function normalizeError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'string') {
    return new Error(error);
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String((error as { message: unknown }).message));
  }
  return new Error('Unknown error occurred');
}

/**
 * Create a successful API result
 */
export function createSuccessResult<T>(data: T): ApiResult<T> {
  return { data, error: null };
}

/**
 * Create an error API result
 */
export function createErrorResult<T>(error: unknown): ApiResult<T> {
  return { data: null, error: normalizeError(error) };
}
