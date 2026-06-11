/**
 * /seo-check — Dev utility page that validates sitemap.xml and JSON-LD
 * schemas (WebSite / Organization / FAQPage). Logs a detailed report to
 * the browser console and renders a human-readable summary.
 */
import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';

type Check = { name: string; ok: boolean; detail?: string; data?: unknown };

const ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://lnkmx.my';

async function fetchText(path: string): Promise<{ ok: boolean; status: number; text: string }> {
  try {
    const res = await fetch(path, { cache: 'no-store' });
    return { ok: res.ok, status: res.status, text: await res.text() };
  } catch (e) {
    return { ok: false, status: 0, text: String(e) };
  }
}

async function validateSitemap(): Promise<Check[]> {
  const checks: Check[] = [];
  const { ok, status, text } = await fetchText('/sitemap.xml');
  if (!ok) {
    checks.push({ name: 'sitemap.xml fetch', ok: false, detail: `HTTP ${status}` });
    return checks;
  }
  checks.push({ name: 'sitemap.xml fetch', ok: true, detail: `${text.length} bytes` });

  const doc = new DOMParser().parseFromString(text, 'application/xml');
  const parseErr = doc.querySelector('parsererror');
  checks.push({ name: 'XML well-formed', ok: !parseErr, detail: parseErr?.textContent ?? undefined });

  const urls = Array.from(doc.querySelectorAll('url'));
  checks.push({ name: '<url> entries', ok: urls.length > 0, detail: `${urls.length} URLs` });

  const withLastmod = urls.filter((u) => u.querySelector('lastmod')?.textContent?.trim()).length;
  checks.push({
    name: 'lastmod coverage',
    ok: withLastmod === urls.length && urls.length > 0,
    detail: `${withLastmod}/${urls.length} have <lastmod>`,
  });

  const badLastmod = urls
    .map((u) => u.querySelector('lastmod')?.textContent?.trim() ?? '')
    .filter((v) => v && !/^\d{4}-\d{2}-\d{2}(T.+)?$/.test(v));
  checks.push({
    name: 'lastmod format (W3C)',
    ok: badLastmod.length === 0,
    detail: badLastmod.length ? `bad: ${badLastmod.slice(0, 3).join(', ')}` : 'all ISO-8601',
  });

  return checks;
}

async function validateSchemas(): Promise<Check[]> {
  const checks: Check[] = [];
  // Pull homepage HTML for WebSite/Organization JSON-LD (index.html ships these in <head>)
  const { ok, text } = await fetchText('/');
  if (!ok) {
    checks.push({ name: 'homepage fetch', ok: false });
    return checks;
  }

  const scripts = [...text.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => {
      try { return JSON.parse(m[1]); } catch { return null; }
    })
    .filter(Boolean) as Record<string, unknown>[];

  checks.push({ name: 'JSON-LD blocks found', ok: scripts.length > 0, detail: `${scripts.length} scripts` });

  const types = scripts.map((s) => String(s['@type'] ?? '')).filter(Boolean);
  const hasWebsite = types.includes('WebSite');
  const hasOrg = types.includes('Organization');
  checks.push({ name: 'WebSite schema', ok: hasWebsite, data: scripts.find((s) => s['@type'] === 'WebSite') });
  checks.push({ name: 'Organization schema', ok: hasOrg, data: scripts.find((s) => s['@type'] === 'Organization') });

  // Live-rendered FAQ schema (react-helmet injects on landing). Scan current document.
  const liveScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map((el) => { try { return JSON.parse(el.textContent || '{}'); } catch { return null; } })
    .filter(Boolean) as Record<string, unknown>[];
  const faq = liveScripts.find((s) => s['@type'] === 'FAQPage');
  checks.push({
    name: 'FAQPage schema (live DOM)',
    ok: !!faq,
    detail: faq ? `${(faq.mainEntity as unknown[] | undefined)?.length ?? 0} questions` : 'not found on this route',
    data: faq,
  });

  return checks;
}

export default function SeoCheck() {
  const [sitemap, setSitemap] = useState<Check[]>([]);
  const [schemas, setSchemas] = useState<Check[]>([]);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    (async () => {
      setRunning(true);
      const [s1, s2] = await Promise.all([validateSitemap(), validateSchemas()]);
      setSitemap(s1);
      setSchemas(s2);
      setRunning(false);
      // eslint-disable-next-line no-console
      console.groupCollapsed('%c[SEO Check] Report', 'color:#10b981;font-weight:bold');
      console.table([...s1, ...s2].map(({ name, ok, detail }) => ({ name, ok, detail })));
      console.log('Sitemap details:', s1);
      console.log('Schema details:', s2);
      console.groupEnd();
    })();
  }, []);

  const renderRow = (c: Check, i: number) => (
    <tr key={i} className="border-b border-border">
      <td className="py-2 pr-4">
        <span className={c.ok ? 'text-emerald-500' : 'text-red-500'}>{c.ok ? '✓' : '✗'}</span>
      </td>
      <td className="py-2 pr-4 font-medium">{c.name}</td>
      <td className="py-2 text-muted-foreground text-sm">{c.detail ?? ''}</td>
    </tr>
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-6 max-w-3xl mx-auto">
      <Helmet>
        <title>SEO Check — LinkMAX</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <h1 className="text-2xl font-semibold mb-2">SEO / Schema Validator</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Origin: <code>{ORIGIN}</code>. Open DevTools console for the full report.
      </p>

      {running && <p>Running checks…</p>}

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-2">sitemap.xml</h2>
        <table className="w-full text-sm"><tbody>{sitemap.map(renderRow)}</tbody></table>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">JSON-LD Schemas</h2>
        <table className="w-full text-sm"><tbody>{schemas.map(renderRow)}</tbody></table>
        <p className="text-xs text-muted-foreground mt-3">
          FAQPage is injected via react-helmet on landing/blog routes. Visit one of those pages and re-run if missing.
        </p>
      </section>
    </div>
  );
}
