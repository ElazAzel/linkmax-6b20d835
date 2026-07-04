/**
 * SiteHeaderNav — Quiet Bento (Sprint E):
 * scroll-aware glass (transparent at top, glass after scroll > 8px),
 * compact pill links, respects per-site navigation settings.
 */
import { memo, useMemo, useEffect, useState } from 'react';
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

  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const items = useMemo(() => {
    if (!data) return [];
    const hidden = new Set(data.navSettings.hidden);
    const visible = data.pages.filter((p) => p.is_home || !hidden.has(p.id));

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
        'sticky top-0 z-30 w-full transition-all duration-200',
        scrolled
          ? 'bg-background/75 backdrop-blur-md border-b border-hairline shadow-soft'
          : 'bg-transparent border-b border-transparent',
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
                'px-3 h-8 inline-flex items-center rounded-control text-sm font-medium whitespace-nowrap transition-colors',
                active
                  ? 'text-foreground bg-foreground/10'
                  : 'text-muted-foreground hover:text-foreground',
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
