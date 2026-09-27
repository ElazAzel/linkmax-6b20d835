import { useEffect, useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import CalendarCheck from 'lucide-react/dist/esm/icons/calendar-check';
import Check from 'lucide-react/dist/esm/icons/check';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Minus from 'lucide-react/dist/esm/icons/minus';
import Send from 'lucide-react/dist/esm/icons/send';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FAQSchema } from '@/components/seo/FAQSchema';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import { StructuredData } from '@/components/seo/StructuredData';
import { useMarketingAnalytics } from '@/hooks/analytics/useMarketingAnalytics';
import { getNicheLandingByKey } from '@/lib/niche-landing-data';
import { getAppDomain } from '@/lib/utils/url-helpers';
import { getGalleryPages } from '@/services/gallery';
import { ScreenErrorBoundary } from '@/components/dashboard-v2/common/ScreenErrorBoundary';

interface NicheLandingProps {
  landingKey?: string;
}

const COMPARISON_ROWS: Array<{ label: string; linkmax: string; others: string }> = [
  { label: 'Заявки с формы в одном кабинете', linkmax: 'Входит в бесплатный план', others: 'Нужен внешний сервис' },
  { label: 'Уведомление о заявке в Telegram', linkmax: 'Сразу после публикации', others: 'Обычно нет' },
  { label: 'Сборка страницы за пару минут', linkmax: 'AI собирает блоки и тексты', others: 'Собирать блоки вручную' },
  { label: 'Русский, казахский, узбекский', linkmax: '4 языка интерфейса', others: 'Чаще только английский' },
  { label: 'Работа без VPN в РФ, KZ, UZ', linkmax: 'Домен lnkmx.my', others: 'Бывают блокировки' },
];

export default function NicheLanding({ landingKey }: NicheLandingProps) {
  const { landingSlug } = useParams<{ landingSlug: string }>();
  const landing = getNicheLandingByKey(landingKey || landingSlug);
  const { trackMarketingEvent } = useMarketingAnalytics();

  const { data: pages } = useQuery({
    queryKey: ['niche-landing-gallery', landing?.key],
    queryFn: () => getGalleryPages(landing!.galleryNiche),
    enabled: Boolean(landing),
    staleTime: 5 * 60 * 1000,
  });

  const topPages = (pages || []).slice(0, 6);

  useEffect(() => {
    if (!landing) return;
    trackMarketingEvent({
      eventType: 'niche_landing_view',
      metadata: { niche: landing.niche, landing: landing.key },
    });
  }, [landing, trackMarketingEvent]);

  const pageUrl = landing ? `${getAppDomain()}${landing.canonicalPath}` : getAppDomain();
  const authUrl = landing ? `/auth?niche=${landing.niche}&from=${landing.authFrom}` : '/auth';

  const serviceSchema = useMemo(() => {
    if (!landing) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: landing.schemaServiceName,
      serviceType: 'Micro-business operating system',
      url: pageUrl,
      description: landing.seoDescription,
      audience: {
        '@type': 'Audience',
        audienceType: landing.audience,
      },
      provider: {
        '@type': 'Organization',
        name: 'LinkMAX',
        url: getAppDomain(),
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'KZT',
        availability: 'https://schema.org/InStock',
      },
    };
  }, [landing, pageUrl]);

  const howToSchema = useMemo(() => {
    if (!landing) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `Как запустить ${landing.schemaServiceName}`,
      description: landing.seoDescription,
      totalTime: 'PT2M',
      step: landing.workflow.map((item, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: item.title,
        text: item.description,
        url: `${pageUrl}#step-${index + 1}`,
      })),
    };
  }, [landing, pageUrl]);

  const speakableSchema = useMemo(() => {
    if (!landing) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      url: pageUrl,
      speakable: {
        '@type': 'SpeakableSpecification',
        cssSelector: ['[data-aeo-answer]', 'h1', '[data-aeo-summary]'],
      },
    };
  }, [landing, pageUrl]);

  const breadcrumbSchema = useMemo(() => {
    if (!landing) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'LinkMAX', item: getAppDomain() },
        { '@type': 'ListItem', position: 2, name: 'Решения', item: `${getAppDomain()}/gallery` },
        { '@type': 'ListItem', position: 3, name: landing.schemaServiceName, item: pageUrl },
      ],
    };
  }, [landing, pageUrl]);

  const localBusinessSchema = useMemo(() => {
    if (!landing) return null;
    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      '@id': `${pageUrl}#business`,
      name: `LinkMAX — ${landing.schemaServiceName}`,
      description: landing.seoDescription,
      url: pageUrl,
      image: `${getAppDomain()}/og-image.png`,
      areaServed: [
        { '@type': 'Country', name: 'Kazakhstan' },
        { '@type': 'Country', name: 'Russia' },
        { '@type': 'Country', name: 'Uzbekistan' },
      ],
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Almaty',
        addressCountry: 'KZ',
      },
      geo: { '@type': 'GeoCoordinates', latitude: 43.222, longitude: 76.8512 },
      priceRange: 'Free — Pro',
    };
  }, [landing, pageUrl]);

  const handleCtaClick = (location: string) => {
    trackMarketingEvent({
      eventType: 'niche_landing_cta_click',
      metadata: { niche: landing!.niche, landing: landing!.key, location },
    });
    trackMarketingEvent({
      eventType: 'signup_from_niche_landing',
      metadata: { niche: landing!.niche, landing: landing!.key, location },
    });
  };

  const statsElements = useMemo(() =>
    (landing?.stats ?? []).map((stat) => (
      <div key={stat.label} className="rounded-2xl border border-border bg-card px-4 py-3">
        <p className="text-xl font-black tracking-tight text-foreground">{stat.value}</p>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">{stat.label}</p>
      </div>
    )),
    [landing]
  );

  const featuresElements = useMemo(() =>
    [
      { icon: Link2, text: 'Одна ссылка для bio, рекламы и личных сообщений' },
      { icon: CalendarCheck, text: 'Услуги, цены, запись и заявка на одной странице' },
      { icon: Send, text: 'Новая заявка сразу приходит в Telegram' },
    ].map((item) => {
      const Icon = item.icon;
      return (
        <div key={item.text} className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Icon className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold leading-snug">{item.text}</p>
        </div>
      );
    }),
    []
  );

  const outcomeSummaryElements = useMemo(() =>
    (landing?.outcomes ?? []).map((item) => (
      <li key={item.title} className="flex items-start gap-2">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>{item.title}</span>
      </li>
    )),
    [landing]
  );

  const outcomeCardElements = useMemo(() =>
    (landing?.outcomes ?? []).map((item) => (
      <Card key={item.title} className="rounded-3xl border-border bg-card p-6 shadow-none">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-lg font-black tracking-tight">{item.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
      </Card>
    )),
    [landing]
  );

  const workflowElements = useMemo(() =>
    (landing?.workflow ?? []).map((item, index) => (
      <div key={item.title} id={`step-${index + 1}`} className="flex gap-4 rounded-3xl border border-border bg-card p-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground">
          {index + 1}
        </div>
        <div>
          <h3 className="font-black tracking-tight">{item.title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
        </div>
      </div>
    )),
    [landing]
  );

  const previewServices = useMemo(() =>
    (landing?.outcomes ?? []).slice(0, 3).map((item) => item.title),
    [landing]
  );

  const galleryElements = useMemo(() =>
    topPages.map((page) => (
      <Link key={page.id} to={`/${page.slug}`} target="_blank" className="group">
        <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-none">
          <div className="relative aspect-[9/16] bg-muted">
            {page.preview_url ? (
              <img
                src={page.preview_url}
                alt={page.title || (landing?.visualAlt ?? '')}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Avatar className="h-12 w-12 rounded-xl">
                  <AvatarImage src={page.avatar_url || undefined} />
                  <AvatarFallback className="rounded-xl">{page.title?.charAt(0) || 'L'}</AvatarFallback>
                </Avatar>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/30 opacity-0 transition-opacity group-hover:opacity-100">
              <Eye className="h-5 w-5 text-background" />
            </div>
          </div>
          <div className="p-2">
            <p className="truncate text-xs font-semibold">{page.title || 'LinkMAX page'}</p>
          </div>
        </Card>
      </Link>
    )),
    [topPages, landing]
  );

  const faqElements = useMemo(() =>
    (landing?.faq ?? []).map((item) => (
      <Card key={item.question} className="rounded-3xl border-border bg-card p-6 shadow-none">
        <h3 className="font-black tracking-tight">{item.question}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p>
      </Card>
    )),
    [landing]
  );

  if (!landing) {
    return <Navigate to="/" replace />;
  }

  return (
    <ScreenErrorBoundary screenName="NicheLanding">
      <StaticSEOHead
        title={landing.seoTitle}
        description={landing.seoDescription}
        canonical={pageUrl}
        currentLanguage="ru"
        indexable={true}
        ogImage={`${getAppDomain()}/og-image.png`}
      />
      <FAQSchema id={`faq-${landing.key}`} faqItems={landing.faq} />
      {serviceSchema && <StructuredData id={`service-${landing.key}`} data={serviceSchema} />}
      {howToSchema && <StructuredData id={`howto-${landing.key}`} data={howToSchema} />}
      {speakableSchema && <StructuredData id={`speakable-${landing.key}`} data={speakableSchema} />}
      {breadcrumbSchema && <StructuredData id={`breadcrumb-${landing.key}`} data={breadcrumbSchema} />}
      {localBusinessSchema && <StructuredData id={`localbusiness-${landing.key}`} data={localBusinessSchema} />}

      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2 text-sm font-black tracking-tight">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>lnkmx</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="ghost" className="rounded-xl">
                <Link to="/auth?mode=signin">Войти</Link>
              </Button>
              <Button asChild size="sm" className="hidden rounded-xl sm:inline-flex" onClick={() => handleCtaClick('header')}>
                <Link to={authUrl}>{landing.primaryCta}</Link>
              </Button>
            </div>
          </div>
        </header>

        <main className="pb-24 sm:pb-0">
          <section className="border-b border-border">
            <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground">
                  <Sparkles className="h-3.5 w-3.5" />
                  {landing.badge}
                </div>
                <h1 className="mt-5 text-3xl font-black leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">
                  {landing.title}
                </h1>
                <p data-aeo-summary className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                  {landing.description}
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="h-13 rounded-2xl px-7 text-base font-bold" onClick={() => handleCtaClick('hero')}>
                    <Link to={authUrl}>
                      {landing.primaryCta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="h-13 rounded-2xl px-7 text-base font-bold">
                    <Link to={`/gallery?niche=${landing.niche}`}>{landing.secondaryCta}</Link>
                  </Button>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">Бесплатный старт, без банковской карты</p>
                <div className="mt-8 grid grid-cols-3 gap-3">{statsElements}</div>
              </div>

              <div className="relative flex justify-center lg:justify-end">
                <div
                  aria-hidden
                  className="absolute inset-0 -z-10 rounded-[3rem] bg-[radial-gradient(circle_at_70%_25%,hsl(var(--primary)/0.12),transparent_65%)]"
                />
                <div className="w-[290px] rounded-[2.6rem] border border-border bg-card p-3 shadow-xl sm:w-[320px]">
                  <div className="overflow-hidden rounded-[2rem] border border-border bg-background">
                    <div className="h-20 bg-gradient-to-br from-primary/20 via-accent to-background" />
                    <div className="-mt-9 px-4 pb-5">
                      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-background bg-muted text-lg font-black text-muted-foreground">
                        {landing.previewTitle.charAt(0)}
                      </div>
                      <p className="mt-3 text-base font-black tracking-tight">{landing.previewTitle}</p>
                      <p className="mt-1 text-xs leading-snug text-muted-foreground">{landing.previewSubtitle}</p>

                      <div className="mt-4 space-y-2">
                        {previewServices.map((title) => (
                          <div key={title} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
                            <span className="truncate text-[11px] font-semibold">{title}</span>
                            <span className="shrink-0 text-[10px] font-bold text-primary">Открыть</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-[11px] font-bold text-primary-foreground">
                          <MessageCircle className="h-3.5 w-3.5" />
                          WhatsApp
                        </div>
                        <div className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-2.5 text-[11px] font-bold">
                          <Send className="h-3.5 w-3.5" />
                          Telegram
                        </div>
                      </div>

                      <div className="mt-3 rounded-xl border border-border bg-card p-3">
                        <p className="text-[11px] font-bold">Оставить заявку</p>
                        <div className="mt-2 space-y-1.5">
                          <div className="h-6 rounded-lg bg-muted" />
                          <div className="h-6 rounded-lg bg-muted" />
                          <div className="h-6 rounded-lg bg-foreground/85" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="border-b border-border bg-muted/40">
            <div className="mx-auto grid max-w-6xl gap-4 px-4 py-7 sm:grid-cols-3">{featuresElements}</div>
          </section>

          <section className="mx-auto max-w-4xl px-4 pt-12">
            <Card data-aeo-answer className="rounded-3xl border-border bg-card p-6 shadow-none">
              <p className="text-xs font-bold tracking-wide text-primary">Кратко</p>
              <p className="mt-2 text-base font-semibold leading-7 sm:text-lg">{landing.seoDescription}</p>
              <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">{outcomeSummaryElements}</ul>
            </Card>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-14">
            <div className="max-w-2xl">
              <p className="text-sm font-bold text-primary">Что получает специалист</p>
              <h2 className="mt-2 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                Страница, которая приводит клиентов, а не просто хранит ссылки
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">{outcomeCardElements}</div>
          </section>

          <section className="border-y border-border bg-muted/40">
            <div className="mx-auto max-w-4xl px-4 py-14">
              <div className="max-w-2xl">
                <p className="text-sm font-bold text-primary">Сравнение</p>
                <h2 className="mt-2 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                  LinkMAX и обычные мультиссылки
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Taplink и Linktree собирают ссылки. LinkMAX ведёт клиента дальше: заявка, уведомление и контакт остаются у вас.
                </p>
              </div>

              <div className="mt-8 overflow-hidden rounded-3xl border border-border bg-card">
                <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 border-b border-border px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <span>Возможность</span>
                  <span>LinkMAX</span>
                  <span>Taplink, Linktree</span>
                </div>
                {COMPARISON_ROWS.map((row) => (
                  <div key={row.label} className="grid grid-cols-[1.4fr_1fr_1fr] items-start gap-2 border-b border-border px-4 py-3 last:border-b-0">
                    <span className="text-xs font-semibold leading-snug sm:text-sm">{row.label}</span>
                    <span className="flex items-start gap-1.5 text-xs leading-snug text-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {row.linkmax}
                    </span>
                    <span className="flex items-start gap-1.5 text-xs leading-snug text-muted-foreground">
                      <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      {row.others}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-14">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <p className="text-sm font-bold text-primary">Как это работает</p>
                <h2 className="mt-2 text-2xl font-black leading-tight tracking-tight sm:text-3xl">
                  От регистрации до опубликованной ссылки
                </h2>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  Сфера подставляется автоматически, поэтому первый запуск открывает готовый шаблон под вашу нишу.
                </p>
              </div>
              <div className="space-y-3">{workflowElements}</div>
            </div>
          </section>

          {topPages.length > 0 && (
            <section className="border-t border-border">
              <div className="mx-auto max-w-6xl px-4 py-14">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-primary">Примеры</p>
                    <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Живые страницы на LinkMAX</h2>
                  </div>
                  <Button asChild variant="outline" className="hidden rounded-xl sm:inline-flex">
                    <Link to={`/gallery?niche=${landing.niche}`}>Все примеры</Link>
                  </Button>
                </div>
                <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{galleryElements}</div>
              </div>
            </section>
          )}

          <section className="border-t border-border bg-muted/40">
            <div className="mx-auto max-w-4xl px-4 py-14">
              <p className="text-sm font-bold text-primary">Частые вопросы</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Коротко о главном</h2>
              <div className="mt-8 space-y-3">{faqElements}</div>
            </div>
          </section>

          <section className="border-t border-border">
            <div className="mx-auto max-w-4xl px-4 py-16 text-center">
              <h2 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl">{landing.previewTitle}</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{landing.previewSubtitle}</p>
              <Button asChild size="lg" className="mt-7 h-13 rounded-2xl px-8 text-base font-bold" onClick={() => handleCtaClick('footer')}>
                <Link to={authUrl}>
                  {landing.primaryCta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-4 text-xs text-muted-foreground">Старт занимает пару минут</p>
            </div>
          </section>
        </main>

        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur sm:hidden">
          <Button asChild size="lg" className="h-12 w-full rounded-2xl text-base font-bold" onClick={() => handleCtaClick('sticky_mobile')}>
            <Link to={authUrl}>
              {landing.primaryCta}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </ScreenErrorBoundary>
  );
}
