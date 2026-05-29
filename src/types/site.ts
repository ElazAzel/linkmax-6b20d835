/**
 * Site = container for one user's pages.
 * Sprint 1: Multi-Page Foundation.
 */
import type { Block } from './blocks';

export interface SiteSettings {
  // Reserved for future site-wide overrides (fonts, primary color, etc.)
  [key: string]: unknown;
}

export interface Site {
  id: string;
  user_id: string;
  name: string;
  primary_page_id: string | null;
  settings: SiteSettings;
  header_blocks: Block[];
  footer_blocks: Block[];
  created_at: string;
  updated_at: string;
}

export interface SitePageSummary {
  id: string;
  slug: string;
  page_path: string | null;
  is_home: boolean;
  title: string | null;
  is_published: boolean;
  updated_at: string | null;
}
