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

export interface BlockVariation {
  id: string;
  experiment_id: string;
  variant_key: string;
  block_data: Partial<Block>;
  traffic_weight: number | null;
  created_at: string;
}

export interface PageExperiment {
  id: string;
  page_id: string;
  block_id: string; // The base block being tested
  name: string;
  status: 'draft' | 'running' | 'paused' | 'ended';
  started_at?: string;
  ended_at?: string;
  winning_variant_id?: string;
  variants: BlockVariation[];
}

export interface PageData {
  updatedAt?: string | null;
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
  webhook_url?: string;
  webhook_secret?: string;
  integrations?: PageIntegrations;
  editorMode?: EditorMode;
  gridConfig?: GridConfig;
  niche?: string;
  previewUrl?: string; // Custom preview image for gallery
  organization_id?: string;
  experiments?: PageExperiment[];
  // Entity fields for search visibility
  city?: string;
  profession?: string;
  entity_type?: 'person' | 'organization';
  contact_email?: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  quality_score?: number;
  /** Server-side diagnostics (not for manual editing) */
  _diagnostics?: {
    quality_breakdown: Record<string, { passed: boolean; points: number; count?: number }>;
    index_exclusion_reasons: string[];
    last_indexnow_at: string | null;
    service_slugs: Record<string, string>;
  };
}
