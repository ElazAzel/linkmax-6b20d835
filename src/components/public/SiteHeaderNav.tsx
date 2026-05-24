/**
 * SiteHeaderNav — Sprint 1: auto-navigation on public pages.
 * Renders a slim top nav when a site has 2+ pages (home + sub-pages).
 * No new block type — just a presentational header above page content.
 */
import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils/utils';

interface NavItem {
  id: string;
  slug: string;
  page_path: string | null;
  is_home: boolean;
  title: string | null;
}

interface Props {
  ownerUserId: string | undefined;
  currentPageId: string | undefined;
  className?: string;
}

async function fetchSiteNav(userId: string): Promise<NavItem[]> {
  // 1) Find the user's site
  const { data: site } = await supabase
    .from('sites' as never)
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  const siteId = (site as { id?: string } | null)?.id;
  if (!siteId) return [];

  // 2) Get published pages of that site
  const { data: pages } = await supabase
    .from('pages')
    .select('id, slug, page_path, is_home, title')
    .eq('site_id', siteId)
    .eq('is_published', true)
    .order('is_home', { ascending: false })
    .order('created_at', { ascending: true });
  return (pages as NavItem[] | null) ?? [];
}

export const SiteHeaderNav = memo(function SiteHeaderNav({
  ownerUserId,
  currentPageId,
  className,
}: Props) {
  const { data: items = [] } = useQuery({
    queryKey: ['site-nav', ownerUserId],
    queryFn: () => (ownerUserId ? fetchSiteNav(ownerUserId) : Promise.resolve([])),
    enabled: !!ownerUserId,
    staleTime: 5 * 60 * 1000,
  });

  if (items.length < 2) return null;

  const home = items.find((p) => p.is_home) ?? items[0];
  const homeSlug = home.slug;

  const linkFor = (p: NavItem) =>
    p.is_home ? `/${homeSlug}` : `/${homeSlug}/p/${p.page_path}`;

  return (
    <nav
      className={cn(
        'sticky top-0 z-30 w-full bg-background/80 backdrop-blur-md border-b border-border/40',
        className,
      )}
      aria-label="Site navigation"
    >
      <div className="container max-w-2xl mx-auto px-3 sm:px-4 h-12 flex items-center gap-1 overflow-x-auto scrollbar-hide">
        {items.map((p) => {
          const active = p.id === currentPageId;
          return (
            <a
              key={p.id}
              href={linkFor(p)}
              className={cn(
                'px-3 h-8 inline-flex items-center rounded-lg text-sm whitespace-nowrap transition-colors',
                active
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted',
              )}
            >
              {p.title || (p.is_home ? 'Главная' : p.page_path)}
            </a>
          );
        })}
      </div>
    </nav>
  );
});
