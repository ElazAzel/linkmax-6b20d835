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
  yandex_metrika?: string;
  webhook_url?: string;
}

// Experiment types
export interface BlockVariation {
  id: string;
  experiment_id: string;
  base_block_id: string;
  variant_label: string;
  block_data: Partial<Block>;
  traffic_weight: number;
}

export interface PageExperiment {
  id: string;
  page_id: string;
  name: string;
  status: 'draft' | 'running' | 'paused' | 'ended';
  started_at?: string;
  ended_at?: string;
  winning_variant_id?: string;
  variants: BlockVariation[];
}

export interface PageData {
  id: string;
  userId?: string;
  slug?: string;
  custom_domain?: string;
  blocks: Block[];
  theme: PageTheme;
  seo: {
    title: string;
    description: string;
    keywords: string[];
    image?: string;
  };
  isPremium?: boolean;
  isPublished?: boolean;
  isIndexable?: boolean;
  viewCount?: number;
  favicon_url?: string;
  hideBranding?: boolean;
  integrations?: PageIntegrations;
  editorMode?: EditorMode;
  gridConfig?: GridConfig;
  niche?: string;
  previewUrl?: string; // Custom preview image for gallery
  experiments?: PageExperiment[];
}
