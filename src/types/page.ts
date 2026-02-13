// Re-export all block types
export * from './blocks';

// Import for local use in PageData
import type { Block, EditorMode } from './blocks';

// Page background configuration
export interface PageBackground {
  type: 'solid' | 'gradient' | 'image';
  value: string; // color hex, gradient css, or image url
  gradientAngle?: number;
}

export interface PageTheme {
  backgroundColor: string;
  backgroundGradient?: string;
  textColor: string;
  buttonStyle: 'default' | 'rounded' | 'pill' | 'gradient';
  fontFamily: 'sans' | 'serif' | 'mono';
  darkMode?: boolean;
  // Custom page background (business only)
  customBackground?: PageBackground;
}

export interface PageMetrics {
  googleAnalytics?: string;
  facebookPixel?: string;
  yandexMetrika?: string;
  tiktokPixel?: string;
}

// Grid configuration for pages
export interface GridConfig {
  columnsDesktop: number;   // 3-4 for desktop
  columnsMobile: number;    // 2 for mobile
  gapSize: number;          // gap between blocks in px
  cellHeight: number;       // cell height in px
}

export interface PageIntegrations {
  fb_pixel?: string;
  tt_pixel?: string;
  ga4_id?: string;
  webhook_url?: string;
}

export interface PageData {
  id: string;
  userId?: string;
  slug?: string;
  blocks: Block[];
  theme: PageTheme;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  isPremium?: boolean;
  isPublished?: boolean;
  isIndexable?: boolean;
  viewCount?: number;
  metrics?: PageMetrics;
  integrations?: PageIntegrations;
  editorMode?: EditorMode;
  gridConfig?: GridConfig;
  niche?: string;
  previewUrl?: string; // Custom preview image for gallery
}
