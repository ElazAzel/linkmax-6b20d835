/**
 * SiteHeaderNav — Sprint 1 + Navigation Builder.
 * Renders a slim top nav when a site has 2+ pages, respecting per-site
 * navigation settings (custom order + hidden flags).
 */
import { memo, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils/utils';
import { readSiteNav } from '@/services/sites';

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

interface SiteNavData {
  pages: NavItem[];
  navSettings: ReturnType<typeof readSiteNav>;
}

async function fetchSiteNav(userId: string): Promise<SiteNavData> {
  const { data: site } = await supabase
    .from('sites' as never)
    .select('id, settings')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  const siteRow = site as { id?: string; settings?: Record<string, unknown> } | null;
  const siteId = siteRow?.id;
  if (!siteId) return { pages: [], navSettings: { order: [], hidden: [] } };

  const { data: pages } = await supabase
    .from('pages')
    .select('id, slug, page_path, is_home, title')
    .eq('site_id', siteId)
    .eq('is_published', true)
    .order('is_home', { ascending: false })
    .order('created_at', { ascending: true });

  return {
    pages: (pages as NavItem[] | null) ?? [],
    navSettings: readSiteNav(siteRow?.settings),
  };
}

export const SiteHeaderNav = memo(function SiteHeaderNav({
  ownerUserId,
  currentPageId,
  className,
}: Props) {
  const { data } = useQuery({
    queryKey: ['site-nav', ownerUserId],
    queryFn: () => (ownerUserId ? fetchSiteNav(ownerUserId) : Promise.resolve({ pages: [], navSettings: { order: [], hidden: [] } })),
    enabled: !!ownerUserId,
    staleTime: 5 * 60 * 1000,
  });

  const items = useMemo(() => {
    if (!data) return [];
    const hidden = new Set(data.navSettings.hidden);
    const visible = data.pages.filter((p) => p.is_home || !hidden.has(p.id));

    // Apply custom order to non-home pages: listed first (in order), then the rest.
    const home = visible.find((p) => p.is_home);
    const subs = visible.filter((p) => !p.is_home);
    const order = data.navSettings.order;
    if (order.length) {
      const byId = new Map(subs.map((p) => [p.id, p] as const));
      const ordered: NavItem[] = [];
      for (const id of order) {
        const p = byId.get(id);
        if (p) {
          ordered.push(p);
          byId.delete(id);
        }
      }
      ordered.push(...byId.values());
      return home ? [home, ...ordered] : ordered;
    }
    return home ? [home, ...subs] : subs;
  }, [data]);

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
