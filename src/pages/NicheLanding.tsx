import { useEffect, useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import CalendarCheck from 'lucide-react/dist/esm/icons/calendar-check';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
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
  const heroImage = topPages[0]?.preview_url || null;


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
      <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xl">
        <p className="text-lg font-black text-white">{stat.value}</p>
        <p className="mt-1 text-[11px] leading-tight text-white/70">{stat.label}</p>
      </div>
    )),
    [landing]
  );

  const featuresElements = useMemo(() =>
    [
      { icon: Link2, text: 'Ссылка для bio, рекламы и личных сообщений' },
      { icon: CalendarCheck, text: 'Заявки, запись и быстрые контакты на одной странице' },
      { icon: Send, text: 'Telegram-уведомления после публикации' },
    ].map((item) => {
      const Icon = item.icon;
      return (
        <div key={item.text} className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
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
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
        <span>{item.title}</span>
      </li>
    )),
    [landing]
  );

  const outcomeCardElements = useMemo(() =>
    (landing?.outcomes ?? []).map((item) => (
      <Card key={item.title} className="rounded-2xl border-border/60 bg-card/70 p-5 shadow-sm backdrop-blur-xl">
        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
        <h3 className="mt-4 text-lg font-black">{item.title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
      </Card>
    )),
    [landing]
  );

  const workflowElements = useMemo(() =>
    (landing?.workflow ?? []).map((item, index) => (
      <div key={item.title} className="flex gap-4 rounded-2xl border border-border/60 bg-background/80 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-sm font-black text-background">
          {index + 1}
        </div>
        <div>
          <h3 className="font-black">{item.title}</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.description}</p>
        </div>
      </div>
    )),
    [landing]
  );

  const galleryElements = useMemo(() =>
    topPages.map((page) => (
      <Link key={page.id} to={`/${page.slug}`} target="_blank" className="group">
        <Card className="overflow-hidden rounded-2xl border-border/60 bg-card/80">
          <div className="relative aspect-[9/16] bg-muted/40">
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
            <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity group-hover:opacity-100">
              <Eye className="h-5 w-5 text-white" />
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
      <Card key={item.question} className="rounded-2xl border-border/60 bg-card/70 p-5">
        <h3 className="font-black">{item.question}</h3>
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

      <div className="min-h-screen bg-background text-foreground">
        <header className="absolute inset-x-0 top-0 z-20">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-white drop-shadow">
              <Sparkles className="h-5 w-5" />
              <span>lnkmx</span>
            </Link>
            <Button asChild size="sm" variant="secondary" className="rounded-xl bg-white/90 text-foreground hover:bg-white">
              <Link to="/auth?mode=signin">Войти</Link>
            </Button>
          </div>
        </header>

        <main>
          <section className="relative min-h-[88svh] overflow-hidden">
            <img
              src={heroImage}
              alt={landing.visualAlt}
              className="absolute inset-0 h-full w-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/72 via-black/50 to-background" />
            <div className="relative z-10 mx-auto flex min-h-[88svh] max-w-6xl flex-col justify-end px-4 pb-12 pt-24">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white backdrop-blur-xl">
                  <Sparkles className="h-4 w-4" />
                  {landing.badge}
                </div>
                <h1 className="max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                  {landing.title}
                </h1>
                <p data-aeo-summary className="mt-5 max-w-2xl text-base leading-7 text-white/82 sm:text-lg">
                  {landing.description}
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg" className="h-14 rounded-2xl px-7 text-base font-bold" onClick={() => handleCtaClick('hero')}>
                    <Link to={authUrl}>
                      {landing.primaryCta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="secondary" className="h-14 rounded-2xl bg-white/90 px-7 text-base font-bold text-foreground hover:bg-white">
                    <Link to={`/gallery?niche=${landing.niche}`}>
                      {landing.secondaryCta}
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="mt-8 grid max-w-2xl grid-cols-3 gap-2">
                {statsElements}
              </div>
            </div>
          </section>

          <section className="border-y border-border/60 bg-muted/20">
            <div className="mx-auto grid max-w-6xl gap-4 px-4 py-7 sm:grid-cols-3">
              {featuresElements}
            </div>
          </section>

          <section className="mx-auto max-w-4xl px-4 pt-12">
            <Card data-aeo-answer className="rounded-2xl border-primary/20 bg-primary/5 p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-primary">Кратко</p>
              <p className="mt-2 text-base font-semibold leading-7 text-foreground sm:text-lg">
                {landing.seoDescription}
              </p>
              <ul className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
                {outcomeSummaryElements}
              </ul>
            </Card>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-14">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase text-primary">Что получает специалист</p>
              <h2 className="mt-2 text-3xl font-black leading-tight">
                Не просто мультиссылка, а первый слой Business OS
              </h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {outcomeCardElements}
            </div>
          </section>

          <section className="bg-muted/25">
            <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <p className="text-sm font-bold uppercase text-primary">Запуск после регистрации</p>
                <h2 className="mt-2 text-3xl font-black leading-tight">
                  От клика до опубликованной страницы без лишних настроек
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Ниша передается в `/auth`, поэтому первый онбординг открывает AI Builder уже с правильным направлением.
                </p>
              </div>
              <div className="space-y-3">
                {workflowElements}
              </div>
            </div>
          </section>

          {topPages.length > 0 && (
            <section className="mx-auto max-w-6xl px-4 py-14">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase text-primary">Примеры</p>
                  <h2 className="mt-2 text-3xl font-black">Живые страницы на LinkMAX</h2>
                </div>
                <Button asChild variant="outline" className="hidden rounded-xl sm:inline-flex">
                  <Link to={`/gallery?niche=${landing.niche}`}>Все примеры</Link>
                </Button>
              </div>
              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {galleryElements}
              </div>
            </section>
          )}

          <section className="mx-auto max-w-4xl px-4 py-14">
            <div className="text-center">
              <p className="text-sm font-bold uppercase text-primary">FAQ</p>
              <h2 className="mt-2 text-3xl font-black">Частые вопросы</h2>
            </div>
            <div className="mt-8 space-y-3">
              {faqElements}
            </div>
          </section>

          <section className="border-t border-border/60 bg-foreground text-background">
            <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-background/70">
                  <Clock className="h-4 w-4" />
                  Старт занимает пару минут
                </div>
                <h2 className="mt-2 text-2xl font-black">{landing.previewTitle}</h2>
                <p className="mt-1 text-sm text-background/70">{landing.previewSubtitle}</p>
              </div>
              <Button asChild size="lg" variant="secondary" className="h-14 rounded-2xl px-7 font-bold" onClick={() => handleCtaClick('footer')}>
                <Link to={authUrl}>
                  {landing.primaryCta}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </section>
        </main>
      </div>
    </ScreenErrorBoundary>
  );
}
