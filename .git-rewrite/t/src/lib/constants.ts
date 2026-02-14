import type { ProfileBlock, PageTheme, PageData } from '@/types/page';

// Default profile block
export const createDefaultProfileBlock = (): ProfileBlock => ({
  id: 'profile-1',
  type: 'profile',
  name: 'Your Name',
  bio: 'Your bio goes here',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
  verified: false,
  avatarFrame: 'default',
  coverImage: '',
  coverGradient: 'none',
  coverHeight: 'medium',
  avatarSize: 'large',
  avatarPosition: 'center',
  shadowStyle: 'soft',
});

// Default theme settings
export const DEFAULT_THEME: PageTheme = {
  backgroundColor: 'hsl(var(--background))',
  textColor: 'hsl(var(--foreground))',
  buttonStyle: 'rounded',
  fontFamily: 'sans',
};

// Default SEO settings
export const DEFAULT_SEO = {
  title: 'My LinkMAX Page',
  description: 'Check out my links',
  keywords: [] as string[],
};

// Create default page data
export const createDefaultPageData = (id: string): PageData => ({
  id,
  blocks: [createDefaultProfileBlock()],
  theme: DEFAULT_THEME,
  seo: DEFAULT_SEO,
});

// Premium block types - re-export from registry for backward compatibility
export { PREMIUM_BLOCK_TYPES } from './block-registry';

// App config
export const APP_CONFIG = {
  name: 'LinkMAX',
  whatsappNumber: '77051097664',
  whatsappMessage: 'Hi, I want to purchase a premium LinkMax',
  autoSaveDebounce: 2000,
  undoTimeout: 5000,
  maxFileSize: 15 * 1024 * 1024, // 15MB
} as const;
