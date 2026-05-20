import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { Card } from '@/components/ui/card';
import { listBlogPosts } from '@/lib/blog-posts';

const BASE = 'https://lnkmx.my';

export default function BlogIndex() {
  const posts = listBlogPosts();
  const title = 'Блог LinkMAX — как принимать заявки, оплаты и собирать сайт-визитку';
  const description =
    'Гайды для специалистов, мастеров, коучей и фрилансеров: как собрать сайт-визитку, мультиссылку, принимать оплаты через WhatsApp и Telegram, вести CRM.';

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'LinkMAX Blog',
    url: `${BASE}/blog`,
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${BASE}/blog/${p.slug}`,
      datePublished: p.publishedAt,
      description: p.description,
    })),
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${BASE}/blog`} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${BASE}/blog`} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(itemListLd)}</script>
      </Helmet>

      <header className="mb-10 space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Блог</p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Гайды для микро-бизнеса: страницы, заявки, оплаты
        </h1>
        <p className="text-muted-foreground">
          Практические инструкции для мастеров, коучей, фрилансеров и онлайн-специалистов.
        </p>
      </header>

      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link to={`/blog/${post.slug}`} className="block">
              <Card className="group border-0 p-6 shadow-none transition-colors hover:bg-muted/50">
                <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <time dateTime={post.publishedAt}>
                    {new Date(post.publishedAt).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </time>
                  <span>·</span>
                  <span>{post.readingMinutes} мин чтения</span>
                </div>
                <h2 className="mb-2 text-xl font-semibold tracking-tight">
                  {post.title}
                </h2>
                <p className="mb-4 text-sm text-muted-foreground">{post.description}</p>
                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Читать <ArrowRight className="h-4 w-4" />
                </span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
