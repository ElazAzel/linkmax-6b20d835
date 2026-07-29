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
  schemaVersion: 2,
  appearanceMode: 'v2',
  backgroundColor: 'hsl(var(--background))',
  textColor: 'hsl(var(--foreground))',
  buttonStyle: 'rounded',
  fontFamily: 'sans',
  colors: {
    canvas: '#F4F5F0',
    surface: '#FFFFFF',
    text: '#16131A',
    mutedText: '#68636D',
    primary: '#C93618',
    primaryText: '#FFFFFF',
    secondary: '#2F52E0',
    border: '#C8C9C2',
    focus: '#2F52E0',
    success: '#087A54',
    warning: '#FFD84A',
    danger: '#B42318',
  },
  typography: {
    headingFamily: 'Onest',
    bodyFamily: 'Onest',
    monoFamily: 'JetBrains Mono',
    headingWeight: 700,
    bodyWeight: 400,
    scale: 'balanced',
  },
  radii: { control: 8, card: 8, block: 8, image: 6 },
  spacing: { density: 'comfortable', sectionGap: 48, blockGap: 16, pagePadding: 20 },
  imageTreatment: 'natural',
  buttonWeight: 600,
  motionLevel: 'standard',
};

// Default SEO settings
export const DEFAULT_SEO = {
  title: 'My LinkMAX.my Page',
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
export { PREMIUM_BLOCK_TYPES } from '@/lib/blocks/block-registry';

// App config
export const APP_CONFIG = {
  name: 'LinkMAX.my',
  whatsappNumber: '77051097664',
  whatsappMessage: 'Hi, I want to purchase a premium LinkMAX.my',
  autoSaveDebounce: 2000,
  undoTimeout: 5000,
  maxFileSize: 20 * 1024 * 1024, // 20MB
} as const;
