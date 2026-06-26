/**
 * SiteFooter — Quiet Bento (Sprint E): minimal one-line footer.
 * Configured via site.settings.footer ({ enabled, text, copyright, links }).
 */
import { memo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/platform/supabase/client';
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
        'mt-8 border-t border-hairline',
        className,
      )}
    >
      <div className="container max-w-2xl mx-auto px-3 sm:px-4 py-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {hasCopy && <span>{footer.copyright}</span>}
          {hasText && <span className="opacity-80">{footer.text}</span>}
        </div>
        {hasLinks && (
          <nav className="flex flex-wrap gap-x-3 gap-y-1" aria-label="Footer">
            {footer.links!.map((l, i) => (
              <a
                key={`${l.url}-${i}`}
                href={l.url}
                target={/^https?:\/\//.test(l.url) ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
              >
                {l.label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </footer>
  );
});
