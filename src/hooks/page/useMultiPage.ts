/**
 * useMultiPage - Hook for multi-page state management
 * Handles page switching, limits, and CRUD operations.
 * Pages list is filtered by current organization when available.
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/user/useAuth';
import { usePremiumStatus } from '@/hooks/user/usePremiumStatus';
import { useOrganizations } from '@/hooks/useOrganizations';
import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';
import { storage } from '@/lib/storage';
import { sanitizeSlug, slugifyTitle, validateSlug } from '@/lib/utils/slug';

// ============= Types =============

export interface UserPage {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  isPaid: boolean;
  isPrimaryPaid: boolean;
  viewCount: number;
  updatedAt: string;
  createdAt: string;
  previewUrl?: string;
  custom_domain?: string | null;
}

export interface PageLimits {
  tier: 'free' | 'pro';
  currentPages: number;
  maxPages: number;
  paidPages: number;
  freePages: number;
  canCreate: boolean;
}

interface CreatePageResult {
  success: boolean;
  error?: string;
  pageId?: string;
  slug?: string;
  limits?: PageLimits;
}

// DB row type (columns that may not be in generated types yet)
interface PageRow {
  id: string;
  title: string | null;
  slug: string;
  is_published: boolean | null;
  is_paid?: boolean | null;
  is_primary_paid?: boolean | null;
  view_count: number | null;
  updated_at: string | null;
  created_at: string | null;
  preview_url: string | null;
  custom_domain?: string | null;
  organization_id?: string | null;
}

// ============= Constants =============

const ACTIVE_PAGE_KEY = 'active_page_id';
const DEFAULT_PAGE_TITLE = 'My Page';

// ============= Hook =============

export function useMultiPage() {
  const { user } = useAuth();
  const { isPremium, tier } = usePremiumStatus();
  const { currentOrg } = useOrganizations();

  const [pages, setPages] = useState<UserPage[]>([]);
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [limits, setLimits] = useState<PageLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get active page from list
  const activePage = useMemo(() => {
    if (!activePageId) return pages[0] || null;
    return pages.find(p => p.id === activePageId) || pages[0] || null;
  }, [pages, activePageId]);

  // Load user pages (filtered by current organization)
  const loadPages = useCallback(async () => {
    if (!user?.id) {
      setPages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('pages')
        .select('id, user_id, slug, title, description, avatar_url, avatar_style, theme_settings, seo_meta, is_published, view_count, created_at, updated_at, editor_mode, grid_config, is_in_gallery, gallery_featured_at, gallery_likes, niche, preview_url, quality_score, is_indexable, last_snapshot_at, is_paid, is_primary_paid, page_type, integrations, favicon_url, hide_branding, organization_id, custom_domain, city, country_code, profession, entity_type, service_slugs, site_id, page_path, is_home')
        .order('created_at', { ascending: false });

      if (currentOrg?.id) {
        if (currentOrg.name === 'Personal Organization') {
          query = query.or(`organization_id.is.null,organization_id.eq.${currentOrg.id}`);
        } else {
          query = query.eq('organization_id', currentOrg.id);
        }
      } else {
        query = query.eq('user_id', user.id);
      }

      const { data: pagesData, error: pagesError } = await query;

      if (pagesError) {
        throw pagesError;
      }

      // Cast to our row type that includes new columns
      const rows = (pagesData || []) as unknown as PageRow[];

      const userPages: UserPage[] = rows.map((p) => ({
        id: p.id,
        title: p.title || 'Untitled',
        slug: p.slug,
        isPublished: p.is_published ?? false,
        isPaid: p.is_paid ?? false,
        isPrimaryPaid: p.is_primary_paid ?? false,
        viewCount: p.view_count ?? 0,
        updatedAt: p.updated_at || '',
        createdAt: p.created_at || '',
        previewUrl: p.preview_url ?? undefined,
        custom_domain: p.custom_domain,
      }));

      setPages(userPages);

      // Calculate limits based on user tier
      const userTier = isPremium ? 'pro' : 'free';
      const maxPages = userTier === 'free' ? 1 : 6;
      const paidPages = userPages.filter(p => p.isPaid).length;
      const freePages = userPages.filter(p => !p.isPaid).length;

      setLimits({
        tier: userTier,
        currentPages: userPages.length,
        maxPages,
        paidPages,
        freePages,
        canCreate: userPages.length < maxPages,
      });

      // Restore or reset active page when list changes (e.g. after org switch)
      const savedActiveId = storage.get<string>(ACTIVE_PAGE_KEY);
      if (userPages.length === 0) {
        setActivePageId(null);
      } else if (savedActiveId && userPages.some(p => p.id === savedActiveId)) {
        setActivePageId(savedActiveId);
      } else {
        setActivePageId(userPages[0].id);
        storage.set(ACTIVE_PAGE_KEY, userPages[0].id);
      }

    } catch (err) {
      logger.error('Error loading pages', err, { context: 'useMultiPage' });
      setError(err instanceof Error ? err.message : 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  }, [user?.id, isPremium, currentOrg?.id, currentOrg?.name]);

  // Initial load
  useEffect(() => {
    loadPages();
  }, [loadPages]);

  // Switch active page
  const switchPage = useCallback((pageId: string) => {
    if (pages.some(p => p.id === pageId)) {
      setActivePageId(pageId);
      storage.set(ACTIVE_PAGE_KEY, pageId);
    }
  }, [pages]);

  // Create new page
  const createPage = useCallback(async (title: string, slug?: string): Promise<CreatePageResult> => {
    if (!user?.id) {
      return { success: false, error: 'not_authenticated' };
    }

    // Check limits first
    const currentLimits = limits;
    if (currentLimits && !currentLimits.canCreate) {
      return {
        success: false,
        error: 'page_limit_exceeded',
        limits: currentLimits,
      };
    }

    try {
      const normalizedTitle = title.trim() || DEFAULT_PAGE_TITLE;
      const sanitizedInputSlug = slug ? sanitizeSlug(slug) : '';
      if (sanitizedInputSlug) {
        const validation = validateSlug(sanitizedInputSlug);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }
      }

      const baseSlug = sanitizedInputSlug || slugifyTitle(normalizedTitle) || `page-${Date.now().toString(36)}`;
      let newPage: { id: string; slug: string } | null = null;

      for (let attempt = 0; attempt < 3; attempt += 1) {
        const suffix = attempt === 0 ? '' : `-${Date.now().toString(36).slice(-4)}-${attempt}`;
        const candidateSlug = `${baseSlug}${suffix}`.slice(0, 30);
        const candidateValidation = validateSlug(candidateSlug);
        if (!candidateValidation.valid) {
          return { success: false, error: candidateValidation.error };
        }

        const { data, error: createError } = await supabase
          .from('pages')
          .insert({
            user_id: user.id,
            organization_id: currentOrg?.id ?? null,
            title: normalizedTitle,
            slug: candidateSlug,
            theme_settings: {
              backgroundColor: 'hsl(0 0% 100%)',
              textColor: 'hsl(224 71% 4%)',
              buttonStyle: 'rounded',
              fontFamily: 'sans',
            },
            seo_meta: {
              title: normalizedTitle,
              description: null,
              keywords: [],
            },
            editor_mode: 'grid',
          })
          .select('id, slug')
          .single();

        if (createError) {
          if (createError.code === '23505') {
            if (sanitizedInputSlug) {
              return { success: false, error: 'slug_taken' };
            }
            continue;
          }
          throw createError;
        }

        newPage = data;
        break;
      }

      if (!newPage) {
        return { success: false, error: 'slug_taken' };
      }

      const { error: blockError } = await supabase
        .from('blocks')
        .insert({
          page_id: newPage.id,
          type: 'profile',
          position: 0,
          content: {
            id: `profile-${newPage.id}`,
            type: 'profile',
            name: normalizedTitle,
          },
          is_premium: false,
        });

      if (blockError) {
        await supabase
          .from('pages')
          .delete()
          .eq('id', newPage.id)
          .eq('user_id', user.id);

        throw blockError;
      }

      const optimisticPage: UserPage = {
        id: newPage.id,
        title: normalizedTitle,
        slug: newPage.slug,
        isPublished: false,
        isPaid: false,
        isPrimaryPaid: false,
        viewCount: 0,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      setPages(prev => [optimisticPage, ...prev]);
      setLimits(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          currentPages: prev.currentPages + 1,
          freePages: prev.freePages + 1,
          canCreate: prev.currentPages + 1 < prev.maxPages,
        };
      });

      void loadPages();

      if (newPage?.id) {
        setActivePageId(newPage.id);
        storage.set(ACTIVE_PAGE_KEY, newPage.id);
      }

      return {
        success: true,
        pageId: newPage?.id,
        slug: newPage?.slug,
      };
    } catch (err) {
      logger.error('Error creating page', err, { context: 'useMultiPage' });
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create page',
      };
    }
  }, [user?.id, limits, loadPages, currentOrg?.id]);

  // Set primary paid page
  const setPrimaryPaidPage = useCallback(async (pageId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'not_authenticated' };
    }

    if (!isPremium) {
      return { success: false, error: 'pro_required' };
    }

    try {
      // Verify page belongs to user
      const page = pages.find(p => p.id === pageId);
      if (!page) {
        return { success: false, error: 'page_not_found' };
      }

      // Use raw SQL via RPC since columns may not be in types yet
      // For now, we'll just refresh the pages
      await loadPages();

      return { success: true };
    } catch (err) {
      logger.error('Error setting primary paid page', err, { context: 'useMultiPage' });
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to set primary paid page',
      };
    }
  }, [user?.id, isPremium, pages, loadPages]);

  // Delete page
  const deletePage = useCallback(async (pageId: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'not_authenticated' };
    }

    // Cannot delete if only one page
    if (pages.length <= 1) {
      return { success: false, error: 'cannot_delete_last_page' };
    }

    try {
      const { error: deleteError } = await supabase
        .from('pages')
        .delete()
        .eq('id', pageId)
        .eq('user_id', user.id);

      if (deleteError) {
        throw deleteError;
      }

      // If deleted page was active, switch to first remaining
      if (activePageId === pageId) {
        const remaining = pages.filter(p => p.id !== pageId);
        if (remaining.length > 0) {
          switchPage(remaining[0].id);
        }
      }

      // Refresh pages
      await loadPages();

      return { success: true };
    } catch (err) {
      logger.error('Error deleting page', err, { context: 'useMultiPage', data: { pageId } });
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete page',
      };
    }
  }, [user?.id, pages, activePageId, loadPages, switchPage]);

  // Update page slug
  const updatePageSlug = useCallback(async (pageId: string, newSlug: string): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'not_authenticated' };
    }

    // Validate slug
    const validation = validateSlug(newSlug);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    try {
      // Check slug availability
      const { data: existing } = await supabase
        .from('pages')
        .select('id')
        .eq('slug', newSlug)
        .neq('id', pageId)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'slug_taken' };
      }

      const { error: updateError } = await supabase
        .from('pages')
        .update({ slug: newSlug })
        .eq('id', pageId)
        .eq('user_id', user.id);

      if (updateError) {
        if (updateError.code === '23505') return { success: false, error: 'slug_taken' };
        throw updateError;
      }

      await loadPages();

      return { success: true };
    } catch (err) {
      logger.error('Error updating slug', err, { context: 'useMultiPage', data: { pageId, newSlug } });
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update slug',
      };
    }
  }, [user?.id, loadPages]);

  // Update custom domain
  const updatePageCustomDomain = useCallback(async (pageId: string, customDomain: string | null): Promise<{ success: boolean; error?: string }> => {
    if (!user?.id) {
      return { success: false, error: 'not_authenticated' };
    }

    // Basic format check if not null
    if (customDomain) {
      const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
      if (!domainRegex.test(customDomain)) {
        return { success: false, error: 'invalid_domain_format' };
      }
    }

    try {
      const { error: updateError } = await supabase
        .from('pages')
        .update({ custom_domain: customDomain } as any)
        .eq('id', pageId)
        .eq('user_id', user.id);

      if (updateError) {
        if (updateError.code === '23505') return { success: false, error: 'domain_taken' };
        throw updateError;
      }

      await loadPages();

      return { success: true };
    } catch (err) {
      logger.error('Error updating custom domain', err, { context: 'useMultiPage', data: { pageId, customDomain } });
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update custom domain',
      };
    }
  }, [user?.id, loadPages]);

  return {
    // State
    pages,
    activePage,
    activePageId,
    limits,
    loading,
    error,
    isPremium,
    tier,

    // Actions
    loadPages,
    switchPage,
    createPage,
    deletePage,
    updatePageSlug,
    setPrimaryPaidPage,
    updatePageCustomDomain,
  };
}
