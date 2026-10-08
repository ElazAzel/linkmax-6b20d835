import { Link } from '@/lib/router-compat';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { listBlogPosts } from '@/lib/blog-posts';
import { NICHE_LANDINGS } from '@/lib/niche-landing-data';
import { fetchExpertDirectoryProfiles } from '@/services/pages';

const BASE = 'https://lnkmx.my';

const CLUSTERS: Array<{ title: string; tags: string[] }> = [
  { title: 'Link in Bio', tags: ['link-in-bio', 'instagram'] },
  { title: 'Сайт-визитка', tags: ['sayt-vizitka', 'free', 'kazakhstan'] },
  { title: 'Telegram', tags: ['telegram'] },
  { title: 'CRM и заявки', tags: ['crm', 'leads', 'small-business'] },
  { title: 'Онлайн-запись', tags: ['booking'] },
];

const MAIN = [
  { label: 'Главная', href: '/' },
  { label: 'Тарифы', href: '/pricing' },
  { label: 'Блог', href: '/blog' },
  { label: 'Каталог специалистов', href: '/experts' },
  { label: 'Альтернативы', href: '/alternatives' },
  { label: 'Link in Bio', href: '/link-in-bio-ru' },
  { label: 'Сайт-визитка для услуг', href: '/sayt-vizitka-dlya-uslug' },
  { label: 'Альтернатива Taplink', href: '/taplink-alternative' },
  { label: 'Мультиссылка', href: '/multilink' },
  { label: 'Визитка онлайн', href: '/vizitka-onlayn' },
  { label: 'Для бьюти-мастеров', href: '/для-бьюти-мастеров' },
  { label: 'Для репетиторов', href: '/для-репетиторов' },
];

export default function SitemapPage() {
  const posts = listBlogPosts();
  const { data: experts = [] } = useQuery({
    queryKey: ['sitemap-experts'],
    queryFn: () => fetchExpertDirectoryProfiles({ limit: 100 }),
    staleTime: 10 * 60 * 1000,
  });
  const clustered = new Set<string>();

  return (
    <main className="mx-auto max-w-5xl px-4 py-12 space-y-12">
      <Helmet>
        <title>Карта сайта LinkMAX</title>
        <meta name="description" content="Все разделы LinkMAX: статьи о Link in Bio, сайтах-визитках, Telegram, CRM и онлайн-записи, страницы для профессий и каталог специалистов." />
        <link rel="canonical" href={`${BASE}/sitemap`} />
      </Helmet>
      <h1 className="text-3xl font-bold tracking-tight">Карта сайта</h1>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Основные разделы</h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MAIN.map((l) => (
            <li key={l.href}><Link className="text-primary hover:underline" to={l.href}>{l.label}</Link></li>
          ))}
        </ul>
      </section>

      <section className="space-y-6">
        <h2 className="text-xl font-semibold">Статьи по темам</h2>
        {CLUSTERS.map((c) => {
          const items = posts.filter((p) => !clustered.has(p.slug) && p.tags.some((t) => c.tags.includes(t)));
          items.forEach((p) => clustered.add(p.slug));
          if (!items.length) return null;
          return (
            <div key={c.title} className="space-y-2">
              <h3 className="font-medium">{c.title}</h3>
              <ul className="space-y-1">
                {items.map((p) => (
                  <li key={p.slug}><Link className="text-primary hover:underline" to={`/blog/${p.slug}`}>{p.title}</Link></li>
                ))}
              </ul>
            </div>
          );
        })}
        {posts.some((p) => !clustered.has(p.slug)) && (
          <div className="space-y-2">
            <h3 className="font-medium">Другие статьи</h3>
            <ul className="space-y-1">
              {posts.filter((p) => !clustered.has(p.slug)).map((p) => (
                <li key={p.slug}><Link className="text-primary hover:underline" to={`/blog/${p.slug}`}>{p.title}</Link></li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Для профессий и бизнеса</h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {NICHE_LANDINGS.map((n) => (
            <li key={n.key}><Link className="text-primary hover:underline" to={n.canonicalPath}>{n.badge || n.title}</Link></li>
          ))}
        </ul>
      </section>

      {experts.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Специалисты</h2>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {experts.map((e) => (
              <li key={e.id}>
                <Link className="text-primary hover:underline" to={`/${e.slug}`}>
                  {e.title}{e.profession ? `, ${e.profession}` : ''}{e.city ? ` (${e.city})` : ''}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
