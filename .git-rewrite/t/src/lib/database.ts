/**
 * Database module - re-exports from services for backward compatibility
 * @deprecated Use services/pages.ts and services/user.ts directly
 */

// Page operations
export {
  savePage,
  loadPageBySlug,
  loadUserPage,
  publishPage,
} from '@/services/pages';

// Analytics
export { trackEvent, trackPageView, trackBlockClick, trackShare } from '@/services/analytics';

// Re-export types
export type { DbPage, DbBlock, SavePageResult, LoadPageResult, LoadUserPageResult } from '@/services/pages';

// User operations
export {
  loadUserProfile,
  updateUsername,
  checkPremiumStatus,
  checkUsernameAvailability,
  validateUsername,
} from '@/services/user';

export type { UserProfile, UpdateUsernameResult } from '@/services/user';

// Default data factory
export { createDefaultPageData, createDefaultProfileBlock, DEFAULT_THEME, DEFAULT_SEO } from '@/lib/constants';
