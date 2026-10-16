import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import type { PageData } from '@/types/page';
import { buildPublicPageHead, normalizeSeoLanguage } from '@/lib/seo/public-page-seo';

/** Keep the router-owned head in sync with the visitor's language switcher. */
export function PublicProfileHeadSync({ page, matchId }: { page: PageData; matchId: string }) {
  const router = useRouter();
  const { i18n } = useTranslation();
  const language = normalizeSeoLanguage(i18n.language);

  useEffect(() => {
    const head = buildPublicPageHead(page, { language });
    const r = router as unknown as { updateMatch?: (id: string, fn: (m: Record<string, unknown>) => Record<string, unknown>) => void };
    r.updateMatch?.(matchId, (match) => ({ ...match, meta: head.meta, links: head.links, headScripts: head.scripts }));
  }, [router, matchId, page, language]);

  return null;
}
