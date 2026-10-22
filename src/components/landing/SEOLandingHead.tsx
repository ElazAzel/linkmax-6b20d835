import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { buildLandingHead } from '@/lib/seo/landing-head';

function syncDocumentHead(head: ReturnType<typeof buildLandingHead>) {
  const created: HTMLElement[] = [];
  const append = (element: HTMLElement) => {
    if (!element.isConnected) { created.push(element); document.head.appendChild(element); }
  };
  // The hosted router does not expose TanStack's internal updateMatch API.
  // Update existing server tags so switching language neither crashes nor duplicates them.
  for (const meta of head.meta) {
    if ('title' in meta && meta.title) { document.title = meta.title; continue; }
    const attributes = Object.entries(meta).filter(([key, value]) => key !== 'content' && typeof value === 'string') as [string, string][];
    const element = Array.from(document.head.querySelectorAll('meta')).find(node => attributes.every(([key, value]) => node.getAttribute(key) === value)) || document.createElement('meta');
    for (const [key, value] of Object.entries(meta)) if (typeof value === 'string') element.setAttribute(key, value);
    append(element);
  }
  for (const link of head.links) {
    const hreflang = 'hrefLang' in link ? link.hrefLang : undefined;
    const element = Array.from(document.head.querySelectorAll('link')).find(node => node.rel === link.rel && (node.getAttribute('hreflang') || undefined) === hreflang) || document.createElement('link');
    element.rel = link.rel; element.href = link.href;
    if (hreflang) element.hreflang = hreflang;
    append(element);
  }
  const schema = Array.from(document.head.querySelectorAll<HTMLScriptElement>('script[type="application/ld+json"]')).find(node => node.textContent?.includes('/#application')) || document.createElement('script');
  schema.type = 'application/ld+json'; schema.textContent = head.scripts[0].children;
  append(schema);
  return () => created.forEach(element => element.remove());
}

/** Keep language changes on the same page aligned with its server-owned head. */
export function SEOLandingHead({ currentLanguage }: { currentLanguage: string }) {
  const router = useRouter();
  useEffect(() => {
    const match = router.state.matches.at(-1);
    if (!match) return;
    const head = buildLandingHead(currentLanguage.split('-')[0], match.pathname);
    let cleanup: (() => void) | undefined;
    if (typeof router.updateMatch === 'function') {
      router.updateMatch(match.id, previous => ({ ...previous, meta: head.meta, links: head.links, headScripts: head.scripts }));
    } else {
      cleanup = syncDocumentHead(head);
    }
    document.documentElement.lang = currentLanguage.split('-')[0];
    return cleanup;
  }, [currentLanguage, router]);
  return null;
}
