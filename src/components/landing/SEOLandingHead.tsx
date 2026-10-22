import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { buildLandingHead } from '@/lib/seo/landing-head';

/** Keep language changes on the same page aligned with its server-owned head. */
export function SEOLandingHead({ currentLanguage }: { currentLanguage: string }) {
  const router = useRouter();
  useEffect(() => {
    const match = router.state.matches.at(-1);
    if (!match) return;
    const head = buildLandingHead(currentLanguage.split('-')[0], match.pathname);
    // updateMatch is a runtime router method not exposed in the public types.
    type MatchUpdater = (id: string, fn: (previous: Record<string, unknown>) => Record<string, unknown>) => void;
    const updateMatch = (router as unknown as { updateMatch?: MatchUpdater }).updateMatch;
    updateMatch?.call(router, match.id, previous => ({ ...previous, meta: head.meta, links: head.links, headScripts: head.scripts }));
    document.documentElement.lang = currentLanguage.split('-')[0];
  }, [currentLanguage, router]);
  return null;
}
