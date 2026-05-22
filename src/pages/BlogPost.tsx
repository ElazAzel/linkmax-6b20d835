import { Link, Navigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import { Button } from '@/components/ui/button';
import { FAQSchema } from '@/components/seo/FAQSchema';
import { getBlogPost, listBlogPosts } from '@/lib/blog-posts';

const BASE = 'https://lnkmx.my';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getBlogPost(slug) : undefined;

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const url = `${BASE}/blog/${post.slug}`;
  const related = listBlogPosts().filter((p) => p.slug !== post.slug).slice(0, 2);

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    mainEntityOfPage: url,
    url,
    author: { '@type': 'Organization', name: 'LinkMAX', url: BASE },
    publisher: {
      '@type': 'Organization',
      name: 'LinkMAX',
      url: BASE,
      logo: { '@type': 'ImageObject', url: `${BASE}/og-image.png` },
    },
    image: `${BASE}/og-image.png`,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: BASE },
      { '@type': 'ListItem', position: 2, name: 'Блог', item: `${BASE}/blog` },
      { '@type': 'ListItem', position: 3, name: post.title, item: url },
    ],
  };

  const speakableLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    url,
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['[data-aeo-answer]', 'h1', 'h2'],
    },
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Helmet>
        <title>{post.title} — LinkMAX Blog</title>
        <meta name="description" content={post.description} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:url" content={url} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={post.publishedAt} />
        <script type="application/ld+json">{JSON.stringify(articleLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
        <script type="application/ld+json">{JSON.stringify(speakableLd)}</script>
      </Helmet>

      {post.faq && post.faq.length > 0 && <FAQSchema faqItems={post.faq} />}

      <Link
        to="/blog"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Все статьи
      </Link>

      <article className="space-y-6">
        <header className="space-y-3">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
          <h1 className="text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            {post.title}
          </h1>
          <p className="text-lg text-muted-foreground">{post.description}</p>
        </header>

        {/* Answer Block for AEO / featured snippets */}
        <aside
          className="rounded-lg bg-muted/50 p-4 text-sm leading-relaxed"
          aria-label="Краткий ответ"
        >
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Кратко
          </p>
          <p>{post.answer}</p>
        </aside>

        {post.sections.map((section, idx) => (
          <section key={idx} className="space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight">{section.heading}</h2>
            {section.paragraphs.map((p, i) => (
              <p key={i} className="leading-relaxed text-foreground/90">
                {p}
              </p>
            ))}
            {section.bullets && (
              <ul className="ml-5 list-disc space-y-1 text-foreground/90">
                {section.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            )}
          </section>
        ))}

        {post.faq && post.faq.length > 0 && (
          <section className="space-y-4 pt-4">
            <h2 className="text-2xl font-semibold tracking-tight">Частые вопросы</h2>
            <dl className="space-y-3">
              {post.faq.map((item, i) => (
                <div key={i}>
                  <dt className="font-medium">{item.question}</dt>
                  <dd className="text-foreground/80">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {post.cta && (
          <div className="rounded-xl bg-primary/5 p-6 text-center">
            <p className="mb-3 text-lg font-medium">Готовы попробовать?</p>
            <Button asChild size="lg">
              <Link to={post.cta.href}>{post.cta.label}</Link>
            </Button>
          </div>
        )}

        {related.length > 0 && (
          <section className="space-y-3 border-t pt-8">
            <h2 className="text-xl font-semibold">Похожие статьи</h2>
            <ul className="space-y-2">
              {related.map((p) => (
                <li key={p.slug}>
                  <Link
                    to={`/blog/${p.slug}`}
                    className="text-primary hover:underline"
                  >
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  );
}
