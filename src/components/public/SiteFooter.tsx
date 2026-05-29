/**
 * SiteFooter — sitewide footer rendered on every public page of a site.
 * Configured via site.settings.footer ({ enabled, text, copyright, links }).
 * Renders nothing if not enabled. Lightweight: one supabase query, cached.
 */
import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { readSiteFooter, type SiteFooterConfig } from '@/services/sites';
import { cn } from '@/lib/utils/utils';

interface Props {
  ownerUserId: string | undefined;
  className?: string;
}

async function fetchSiteFooter(userId: string): Promise<SiteFooterConfig> {
  const { data } = await supabase
    .from('sites' as never)
    .select('settings')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  return readSiteFooter((data as { settings?: Record<string, unknown> } | null)?.settings);
}

export const SiteFooter = memo(function SiteFooter({ ownerUserId, className }: Props) {
  const { data: footer } = useQuery({
    queryKey: ['site-footer', ownerUserId],
    queryFn: () =>
      ownerUserId
        ? fetchSiteFooter(ownerUserId)
        : Promise.resolve<SiteFooterConfig>({ enabled: false, text: '', copyright: '', links: [] }),
    enabled: !!ownerUserId,
    staleTime: 5 * 60 * 1000,
  });

  if (!footer || !footer.enabled) return null;
  const hasLinks = (footer.links?.length ?? 0) > 0;
  const hasText = !!footer.text;
  const hasCopy = !!footer.copyright;
  if (!hasLinks && !hasText && !hasCopy) return null;

  return (
    <footer
      className={cn(
        'mt-8 sm:mt-12 border-t border-border/40 bg-background/60',
        className,
      )}
    >
      <div className="container max-w-2xl mx-auto px-3 sm:px-4 py-6 space-y-3 text-sm">
        {hasText && (
          <p className="text-muted-foreground whitespace-pre-line">{footer.text}</p>
        )}
        {hasLinks && (
          <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Footer">
            {footer.links!.map((l, i) => (
              <a
                key={`${l.url}-${i}`}
                href={l.url}
                target={/^https?:\/\//.test(l.url) ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="text-foreground/80 hover:text-foreground underline-offset-4 hover:underline"
              >
                {l.label}
              </a>
            ))}
          </nav>
        )}
        {hasCopy && (
          <p className="text-xs text-muted-foreground">{footer.copyright}</p>
        )}
      </div>
    </footer>
  );
});
