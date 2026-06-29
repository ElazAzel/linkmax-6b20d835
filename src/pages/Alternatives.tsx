import { useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import Smartphone from 'lucide-react/dist/esm/icons/smartphone';
import Layers from 'lucide-react/dist/esm/icons/layers';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import { LanguageSwitcher } from '@/components/translation/LanguageSwitcher';
import { useMarketingAnalytics } from '@/hooks/analytics/useMarketingAnalytics';
import { SEOMetaEnhancer } from '@/components/seo/SEOMetaEnhancer';
import { GEOTagging } from '@/components/seo/GEOTagging';
import { AISearchOptimizer } from '@/components/seo/AISearchOptimizer';
import { getAppDomain } from '@/lib/utils/url-helpers';
import { ALTERNATIVE_PROFILES } from '@/lib/alternatives-data';
import { ScreenErrorBoundary } from '@/components/dashboard-v2/common/ScreenErrorBoundary';

// SEO Component for Alternatives page
function AlternativesSEOHead({ currentLanguage }: { currentLanguage: string }) {
  const { t } = useTranslation();

  useEffect(() => {
    const title = t(
      'alternatives.seo.title',
      'LinkMAX alternatives - Linktree, Taplink, Carrd, Beacons comparison'
    );
    document.title = title;

    const setMetaTag = (name: string, content: string, property = false) => {
      const attr = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    const setLinkTag = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang
        ? `link[rel="${rel}"][hreflang="${hreflang}"]`
        : `link[rel="${rel}"]:not([hreflang])`;
      let link = document.querySelector(selector) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        if (hreflang) link.hreflang = hreflang;
        document.head.appendChild(link);
      }
      link.href = href;
    };

    const description = t(
      'alternatives.seo.description',
      'Compare LinkMAX with Linktree, Taplink, Carrd and Beacons. See which tool fits link-in-bio, mini-landing or lead collection needs.'
    );
    const ogTitle = t('alternatives.seo.ogTitle', title);
    const ogDescription = t('alternatives.seo.ogDescription', description);
    setMetaTag('description', description);
    setMetaTag('robots', 'index, follow');
    setMetaTag('googlebot', 'index, follow');

    const keywords = t(
      'alternatives.seo.keywords',
      'linktree alternative, taplink alternative, carrd alternative, beacons alternative, link in bio comparison, mini landing builder comparison'
    );
    setMetaTag('keywords', keywords);

    setMetaTag('og:title', ogTitle, true);
    setMetaTag('og:description', ogDescription, true);
    setMetaTag('og:url', `${getAppDomain()}/alternatives`, true);
    setMetaTag('twitter:title', ogTitle);
    setMetaTag('twitter:description', ogDescription);

    // Canonical + hreflang for alternatives page
    setLinkTag('canonical', `${getAppDomain()}/alternatives`);
    setLinkTag('alternate', `${getAppDomain()}/alternatives?lang=ru`, 'ru');
    setLinkTag('alternate', `${getAppDomain()}/alternatives?lang=en`, 'en');
    setLinkTag('alternate', `${getAppDomain()}/alternatives?lang=kk`, 'kk');
    setLinkTag('alternate', `${getAppDomain()}/alternatives`, 'x-default');

    // Schema for comparison page
    const existingSchema = document.querySelectorAll('script.alternatives-schema');
    existingSchema.forEach((schema) => schema.remove());

    const pageSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description: description,
      url: `${getAppDomain()}/alternatives`,
    };

    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'LinkMAX',
          item: `${getAppDomain()}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: t('alternatives.seo.breadcrumb', 'Alternatives'),
          item: `${getAppDomain()}/alternatives`,
        },
      ],
    };

    [pageSchema, breadcrumbSchema].forEach((schema) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.className = 'alternatives-schema';
      script.textContent = JSON.stringify(schema);
      document.head.appendChild(script);
    });

    return () => {
      document.title = t('alternatives.seo.defaultTitle', 'LinkMAX.my - AI-Powered Link-in-Bio Platform');
      const schemaToRemove = document.querySelectorAll('script.alternatives-schema');
      schemaToRemove.forEach((schema) => schema.remove());
    };
  }, [currentLanguage, t]);

  return null;
}

export default function Alternatives() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { trackMarketingEvent } = useMarketingAnalytics();

  useEffect(() => {
    trackMarketingEvent({ eventType: 'alternatives_view' });
  }, [trackMarketingEvent]);

  const handleCtaClick = useCallback((destination: string, location: string) => {
    trackMarketingEvent({
      eventType: 'alternatives_cta_click',
      metadata: { destination, location },
    });
    if (destination === '/auth') {
      trackMarketingEvent({
        eventType: 'signup_from_alternatives',
        metadata: { location },
      });
    }
    navigate(destination);
  }, [trackMarketingEvent, navigate]);

  const handleBack = useCallback(() => navigate('/'), [navigate]);
  const handleHeaderCta = useCallback(() => handleCtaClick('/auth', 'header'), [handleCtaClick]);
  const handleHeroPrimary = useCallback(() => handleCtaClick('/auth', 'hero_primary'), [handleCtaClick]);
  const handleHeroSecondary = useCallback(() => handleCtaClick('/pricing', 'hero_secondary'), [handleCtaClick]);
  const handleHeroTertiary = useCallback(() => handleCtaClick('/gallery', 'hero_tertiary'), [handleCtaClick]);
  const handleSegmentsCta = useCallback(() => handleCtaClick('/auth', 'segments'), [handleCtaClick]);
  const handleMatrixCta = useCallback(() => handleCtaClick('/auth', 'matrix'), [handleCtaClick]);
  const handleWhenToChooseCta = useCallback(() => handleCtaClick('/auth', 'when_to_choose'), [handleCtaClick]);
  const handleWhenNotChooseGallery = useCallback(() => handleCtaClick('/gallery', 'when_not_choose'), [handleCtaClick]);
  const handleWhenNotChoosePricing = useCallback(() => handleCtaClick('/pricing', 'when_not_choose_pricing'), [handleCtaClick]);
  const handleBitrix24Cta = useCallback(() => handleCtaClick('/auth', 'bitrix24'), [handleCtaClick]);
  const handleFinalPrimary = useCallback(() => handleCtaClick('/auth', 'final_primary'), [handleCtaClick]);
  const handleFinalSecondary = useCallback(() => handleCtaClick('/gallery', 'final_secondary'), [handleCtaClick]);

  const segmentCards = [
    {
      icon: Smartphone,
      title: t('alternatives.segments.linkInBio.title', 'Link-in-bio инструменты'),
      description: t(
        'alternatives.segments.linkInBio.description',
        'Нужны быстрые ссылки и минимальный профиль без сложной структуры.'
      ),
      examples: t('alternatives.segments.linkInBio.examples', 'Примеры: Linktree, Beacons'),
    },
    {
      icon: Layers,
      title: t('alternatives.segments.miniLanding.title', 'Мини-лендинги'),
      description: t(
        'alternatives.segments.miniLanding.description',
        'Нужны блоки с оффером, прайсом и заявкой, но без полноценного сайта.'
      ),
      examples: t('alternatives.segments.miniLanding.examples', 'Примеры: Taplink, Carrd'),
    },
    {
      icon: MessageSquare,
      title: t('alternatives.segments.leadCapture.title', 'Сбор заявок'),
      description: t(
        'alternatives.segments.leadCapture.description',
        'Важно получать лиды и отвечать быстро, а не просто показывать ссылки.'
      ),
      examples: t('alternatives.segments.leadCapture.examples', 'Фокус: CRM, формы, уведомления'),
    },
  ];

  type MatrixValue = 'yes' | 'no' | 'depends';

  const comparisonRows: Array<{
    feature: string;
    LinkMAX: MatrixValue;
    linktree: MatrixValue;
    taplink: MatrixValue;
    carrd: MatrixValue;
    beacons: MatrixValue;
  }> = [
      {
        feature: t('alternatives.matrix.rows.linkPage', 'Базовая страница ссылок'),
        LinkMAX: 'yes',
        linktree: 'yes',
        taplink: 'yes',
        carrd: 'yes',
        beacons: 'yes',
      },
      {
        feature: t('alternatives.matrix.rows.miniLanding', 'Мини-лендинг с блоками (прайс, FAQ, формы)'),
        LinkMAX: 'yes',
        linktree: 'depends',
        taplink: 'depends',
        carrd: 'depends',
        beacons: 'depends',
      },
      {
        feature: t('alternatives.matrix.rows.aiGeneration', 'AI генерация структуры страницы'),
        LinkMAX: 'yes',
        linktree: 'depends',
        taplink: 'depends',
        carrd: 'depends',
        beacons: 'depends',
      },
      {
        feature: t('alternatives.matrix.rows.leadsCrm', 'Лиды и мини-CRM'),
        LinkMAX: 'yes',
        linktree: 'depends',
        taplink: 'depends',
        carrd: 'depends',
        beacons: 'depends',
      },
      {
        feature: t('alternatives.matrix.rows.telegram', 'Уведомления в Telegram'),
        LinkMAX: 'yes',
        linktree: 'depends',
        taplink: 'depends',
        carrd: 'depends',
        beacons: 'depends',
      },
      {
        feature: t('alternatives.matrix.rows.localization', 'RU/EN/KK локализация'),
        LinkMAX: 'yes',
        linktree: 'depends',
        taplink: 'depends',
        carrd: 'depends',
        beacons: 'depends',
      },
      {
        feature: t('alternatives.matrix.rows.localPricing', 'Цены и оплата в KZT'),
        LinkMAX: 'yes',
        linktree: 'depends',
        taplink: 'depends',
        carrd: 'depends',
        beacons: 'depends',
      },
    ];


  const whenToChoose = [
    t('alternatives.whenToChoose.item1', 'Нужна одна ссылка, которая ведет к заявке, а не к списку ссылок.'),
    t('alternatives.whenToChoose.item2', 'Важно принимать лиды и фиксировать их в мини-CRM.'),
    t('alternatives.whenToChoose.item3', 'Нужен быстрый запуск без дизайнера и кода.'),
    t('alternatives.whenToChoose.item4', 'Хотите видеть аналитику по блокам и источникам трафика.'),
    t('alternatives.whenToChoose.item5', 'Работаете в RU и KK, нужна локализация и KZT цены.'),
  ];

  const whenNotToChoose = [
    t('alternatives.whenNotToChoose.item1', 'Нужен сложный многостраничный сайт с кастомной логикой.'),
    t('alternatives.whenNotToChoose.item2', 'Требуется полный контроль над HTML и хостингом.'),
    t('alternatives.whenNotToChoose.item3', 'Вы хотите управлять только соцсетями без сбора заявок.'),
  ];

  const renderMatrixValue = (value: 'yes' | 'no' | 'depends') => {
    if (value === 'yes') {
      return <Check className="h-5 w-5 text-green-500 mx-auto" />;
    }
    if (value === 'no') {
      return <X className="h-5 w-5 text-red-400 mx-auto" />;
    }
    return <span className="text-xs text-muted-foreground">{t('alternatives.matrix.depends', 'Зависит от тарифа')}</span>;
  };

  const alternativeProfilesCards = useMemo(() =>
    ALTERNATIVE_PROFILES.map((profile) => (
      <Card key={profile.slug} className="hover:border-primary/50 transition-colors">
        <CardContent className="p-5 space-y-3">
          <Badge variant="secondary">{profile.category}</Badge>
          <h3 className="font-semibold text-lg">LinkMAX vs {profile.competitor}</h3>
          <p className="text-sm text-muted-foreground">{profile.summary}</p>
          <Button asChild size="sm" variant="outline" className="w-full">
            <Link to={profile.route}>
              {t('alternatives.details.open', 'Открыть сравнение')}
              <ExternalLink className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    )),
  [t]);

  const segmentCardsContent = useMemo(() =>
    segmentCards.map((segment, index) => (
      <Card key={index} className="group hover:border-primary/50 transition-all duration-300">
        <CardContent className="p-6">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <segment.icon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-bold text-lg mb-2">{segment.title}</h3>
          <p className="text-muted-foreground text-sm mb-3">{segment.description}</p>
          <p className="text-xs text-muted-foreground">{segment.examples}</p>
        </CardContent>
      </Card>
    )),
  [segmentCards]);

  const comparisonRowsContent = useMemo(() =>
    comparisonRows.map((row, index) => (
      <tr key={index} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
        <td className="p-4 font-medium">{row.feature}</td>
        <td className="p-4 text-center bg-primary/5">{renderMatrixValue(row.LinkMAX)}</td>
        <td className="p-4 text-center">{renderMatrixValue(row.linktree)}</td>
        <td className="p-4 text-center">{renderMatrixValue(row.taplink)}</td>
        <td className="p-4 text-center">{renderMatrixValue(row.carrd)}</td>
        <td className="p-4 text-center">{renderMatrixValue(row.beacons)}</td>
      </tr>
    )),
  [comparisonRows]);

  const whenToChooseContent = useMemo(() =>
    whenToChoose.map((item, index) => (
      <li key={index} className="flex items-start gap-2">
        <Check className="h-4 w-4 text-primary mt-0.5" />
        <span>{item}</span>
      </li>
    )),
  [whenToChoose]);

  const whenNotToChooseContent = useMemo(() =>
    whenNotToChoose.map((item, index) => (
      <li key={index} className="flex items-start gap-2">
        <X className="h-4 w-4 text-muted-foreground mt-0.5" />
        <span>{item}</span>
      </li>
    )),
  [whenNotToChoose]);

  return (
    <ScreenErrorBoundary screenName="Alternatives">
      <AlternativesSEOHead currentLanguage={i18n.language} />
      <SEOMetaEnhancer
        pageUrl={`${getAppDomain()}/alternatives`}
        pageTitle={t('alternatives.seo.title', 'LinkMAX alternatives - Linktree, Taplink, Carrd, Beacons comparison')}
        pageDescription={t('alternatives.seo.description', 'Compare LinkMAX with Linktree, Taplink, Carrd and Beacons. See which tool fits link-in-bio, mini-landing or lead collection needs.')}
        imageUrl={`${getAppDomain()}/og-alternatives.png`}
        imageAlt={t('alternatives.seo.imageAlt', 'LinkMAX vs Alternatives Comparison')}
        type="article"
        section="Comparisons"
      />
      <GEOTagging includeOrganization={false} />
      <AISearchOptimizer
        pageType="article"
        primaryQuestion={t('alternatives.seo.opt.question', 'What are the best alternatives to Linktree?')}
        primaryAnswer={t('alternatives.seo.opt.answer', 'Top Linktree alternatives include LinkMAX (AI-powered, built-in CRM), Beacons (creator-focused), Koji (interactive), Taplink (analytics), and Stan Store (e-commerce). LinkMAX stands out with its AI page builder, lead management, and affordable pricing.')}
        entityName={t('alternatives.seo.opt.entity', 'LinkMAX vs Competitors')}
        entityCategory="Comparison, Link in Bio Tools, Linktree Alternative"
        useCases={[
          t('alternatives.seo.opt.uses.1', 'Compare link-in-bio tools'),
          t('alternatives.seo.opt.uses.2', 'Find Linktree alternatives'),
          t('alternatives.seo.opt.uses.3', 'Choose best page builder'),
          t('alternatives.seo.opt.uses.4', 'Evaluate CRM features'),
          t('alternatives.seo.opt.uses.5', 'Compare pricing plans'),
        ]}
        targetAudience={[
          t('alternatives.seo.opt.audience.1', 'Users researching alternatives'),
          t('alternatives.seo.opt.audience.2', 'Businesses switching from Linktree'),
          t('alternatives.seo.opt.audience.3', 'Freelancers comparing options'),
          t('alternatives.seo.opt.audience.4', 'Content creators choosing tools'),
        ]}
        problemStatement={t('alternatives.seo.opt.problem', 'Users need unbiased comparisons to choose the right link-in-bio tool for their needs')}
        solutionStatement={t('alternatives.seo.opt.solution', 'LinkMAX provides transparent comparison showing unique features like AI page builder and built-in CRM that competitors lack')}
        keyFeatures={[
          t('alternatives.seo.opt.features.1', 'Feature-by-feature comparison table'),
          t('alternatives.seo.opt.features.2', 'Honest pros and cons'),
          t('alternatives.seo.opt.features.3', 'Pricing comparison'),
          t('alternatives.seo.opt.features.4', 'Use case recommendations'),
          t('alternatives.seo.opt.features.5', 'Migration guidance'),
        ]}
      />

      <div className="min-h-screen bg-background relative overflow-x-hidden pb-safe">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-bl from-primary/20 via-violet-500/10 to-transparent rounded-full blur-[150px] animate-morph" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/15 via-cyan-500/10 to-transparent rounded-full blur-[120px] animate-morph" style={{ animationDelay: '-7s' }} />
        </div>

        {/* Header */}
        <header className="sticky top-0 z-50">
          <div className="mx-4 mt-3">
            <div className="backdrop-blur-2xl bg-card/50 border border-border/30 rounded-2xl shadow-glass-lg">
              <div className="container mx-auto px-4 h-14 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={handleBack}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Link to="/" className="flex items-center gap-2">
                    <span className="text-xl font-bold">
                      LinkMAX<span className="text-gradient">.my</span>
                    </span>
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <LanguageSwitcher />
                  <Button onClick={handleHeaderCta} size="sm">
                    {t('alternatives.header.cta', 'Get Started')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Hero Section */}
          <section className="text-center mb-12 sm:mb-16">
            <Badge
              data-testid="alternatives-hero-badge"
              className="mb-4 bg-primary/10 text-primary border-primary/20"
            >
              {t('alternatives.hero.badge', 'Comparison guide')}
            </Badge>

            <h1
              data-testid="alternatives-hero-title"
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight"
            >
              {t('alternatives.hero.title', 'LinkMAX vs Linktree, Taplink, Carrd, Beacons')}
            </h1>

            <p
              data-testid="alternatives-hero-description"
              className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8"
            >
              {t(
                'alternatives.hero.description',
                'Сравнение без громких обещаний: для каких задач подходит LinkMAX, и когда стоит выбрать другой инструмент.'
              )}
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={handleHeroPrimary} className="rounded-xl">
                <Sparkles className="h-5 w-5 mr-2" />
                <span data-testid="alternatives-hero-primary-cta">
                  {t('alternatives.hero.ctaPrimary', 'Создать страницу бесплатно')}
                </span>
              </Button>
              <Button size="lg" variant="outline" onClick={handleHeroSecondary} className="rounded-xl">
                <span data-testid="alternatives-hero-secondary-cta">
                  {t('alternatives.hero.ctaSecondary', 'Посмотреть тарифы')}
                </span>
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
              <Button size="lg" variant="ghost" onClick={handleHeroTertiary} className="rounded-xl">
                {t('alternatives.hero.ctaTertiary', 'Посмотреть примеры')}
              </Button>
            </div>
          </section>


          {/* Competitor detail pages */}
          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">
              {t('alternatives.details.title', 'Точечные сравнения по конкурентам')}
            </h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-6">
              {t('alternatives.details.description', 'Выберите конкретный продукт и получите пошаговый план миграции на LinkMAX.')}
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {alternativeProfilesCards}
            </div>
          </section>

          {/* Segments */}
          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
              {t('alternatives.segments.title', 'Какие задачи вы решаете')}
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {segmentCardsContent}
            </div>

            <div className="flex justify-center mt-6">
              <Button onClick={handleSegmentsCta} className="rounded-xl">
                {t('alternatives.segments.cta', 'Попробовать LinkMAX')}
              </Button>
            </div>
          </section>

          {/* Feature Comparison Table */}
          <section className="mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">
              {t('alternatives.matrix.title', 'Сравнение по ключевым возможностям')}
            </h2>

            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full min-w-[640px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-semibold">
                        {t('alternatives.matrix.featureLabel', 'Функция')}
                      </th>
                      <th className="text-center p-4">
                        <span className="text-muted-foreground">LinkMAX</span>
                      </th>
                      <th className="text-center p-4">
                        <span className="text-muted-foreground">Linktree</span>
                      </th>
                      <th className="text-center p-4">
                        <span className="text-muted-foreground">Taplink</span>
                      </th>
                      <th className="text-center p-4">
                        <span className="text-muted-foreground">Carrd</span>
                      </th>
                      <th className="text-center p-4">
                        <span className="text-muted-foreground">Beacons</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonRowsContent}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <p className="text-center text-xs text-muted-foreground mt-3">
              {t(
                'alternatives.matrix.note',
                'Столбцы конкурентов указаны ориентировочно. Уточняйте актуальные планы на их сайтах.'
              )}
            </p>

            <div className="flex justify-center mt-6">
              <Button onClick={handleMatrixCta} className="rounded-xl">
                {t('alternatives.matrix.cta', 'Создать страницу')}
              </Button>
            </div>
          </section>

          {/* When to choose LinkMAX */}
          <section className="mb-12 sm:mb-16">
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-violet-500/5">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold">
                    {t('alternatives.whenToChoose.title', 'Когда выбирать LinkMAX')}
                  </h2>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {whenToChooseContent}
                </ul>
                <div className="mt-6">
                  <Button onClick={handleWhenToChooseCta} className="rounded-xl">
                    {t('alternatives.whenToChoose.cta', 'Создать страницу')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* When not to choose LinkMAX */}
          <section className="mb-12 sm:mb-16">
            <Card className="border-border/40">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-bold mb-4">
                  {t('alternatives.whenNotToChoose.title', 'Когда LinkMAX может не подойти')}
                </h2>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {whenNotToChooseContent}
                </ul>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="outline" onClick={handleWhenNotChooseGallery} className="rounded-xl">
                    {t('alternatives.whenNotToChoose.ctaSecondary', 'Посмотреть примеры')}
                  </Button>
                  <Button onClick={handleWhenNotChoosePricing} className="rounded-xl">
                    {t('alternatives.whenNotToChoose.ctaPrimary', 'Сравнить тарифы')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Why not Bitrix24 for solopreneurs — Phase B comparison */}
          <section className="mb-12 sm:mb-16">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-violet-500/5">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Crown className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold">
                    {t('alternatives.bitrix24.title', 'Почему не Bitrix24 для соло')}
                  </h2>
                </div>
                <p className="text-muted-foreground text-sm mb-6">
                  {t('alternatives.bitrix24.intro', 'Bitrix24 заточен под команды и предприятия. Для соло и микро-бизнеса мы предлагаем более простую альтернативу.')}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px] text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-3 font-semibold">{t('alternatives.matrix.featureLabel', 'Функция')}</th>
                        <th className="text-center p-3 text-primary">LinkMAX</th>
                        <th className="text-center p-3 text-muted-foreground">Bitrix24</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/50">
                        <td className="p-3 font-medium">{t('alternatives.bitrix24.rowSimplicity', 'Простота')}</td>
                        <td className="p-3 text-center text-muted-foreground">{t('alternatives.bitrix24.LinkMAXSimple', '3 клика, без инструкций')}</td>
                        <td className="p-3 text-center text-muted-foreground">{t('alternatives.bitrix24.bitrixComplex', 'Сложный интерфейс, долгая адаптация')}</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="p-3 font-medium">{t('alternatives.bitrix24.rowTime', 'Время до запуска')}</td>
                        <td className="p-3 text-center text-muted-foreground">{t('alternatives.bitrix24.LinkMAX15min', 'CRM за 15 минут, без внедрения')}</td>
                        <td className="p-3 text-center text-muted-foreground">{t('alternatives.bitrix24.bitrixWeeks', 'Недели, часто консультанты')}</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="p-3 font-medium">{t('alternatives.bitrix24.rowMobile', 'Мобильность')}</td>
                        <td className="p-3 text-center text-muted-foreground">{t('alternatives.bitrix24.LinkMAXMobile', 'PWA + нативные приложения, пуш')}</td>
                        <td className="p-3 text-center text-muted-foreground">{t('alternatives.bitrix24.bitrixWeak', 'Слабое мобильное приложение')}</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="p-3 font-medium">{t('alternatives.bitrix24.rowPrice', 'Цена (соло)')}</td>
                        <td className="p-3 text-center text-muted-foreground">{t('alternatives.bitrix24.LinkMAXPrice', 'Один тариф Pro ~$6.5/мес')}</td>
                        <td className="p-3 text-center text-muted-foreground">{t('alternatives.bitrix24.bitrixPrice', 'Рост по пользователям, per-seat')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-muted-foreground mt-4 italic">
                  {t('alternatives.bitrix24.positioning', 'LinkMAX — «анти-Битрикс» для соло и микро-бизнеса: простая, быстрая, мобильная CRM и визитка за 15 минут, без внедрения и программистов.')}
                </p>
                <div className="mt-6">
                  <Button onClick={handleBitrix24Cta} className="rounded-xl">
                    {t('alternatives.bitrix24.cta', 'Создать страницу')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Final CTA */}
          <section className="text-center py-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              {t('alternatives.finalCta.title', 'Ready to Try?')}
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              {t(
                'alternatives.finalCta.description',
                'Создайте страницу и проверьте, подходит ли LinkMAX под вашу задачу.'
              )}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" onClick={handleFinalPrimary} className="rounded-xl">
                <Sparkles className="h-5 w-5 mr-2" />
                {t('alternatives.finalCta.primary', 'Создать страницу')}
              </Button>
              <Button size="lg" variant="outline" onClick={handleFinalSecondary} className="rounded-xl">
                {t('alternatives.finalCta.secondary', 'Посмотреть примеры')}
                <ExternalLink className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t border-border/40 py-8 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <Link to="/" className="flex items-center">
                  <span className="text-lg font-bold">
                    LinkMAX<span className="text-gradient">.my</span>
                  </span>
                </Link>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Link to="/pricing" className="hover:text-foreground transition-colors">
                    {t('alternatives.footer.pricing', 'Pricing')}
                  </Link>
                  <Link to="/gallery" className="hover:text-foreground transition-colors">
                    {t('alternatives.footer.gallery', 'Gallery')}
                  </Link>
                  <Link to="/auth" className="hover:text-foreground transition-colors">
                    {t('alternatives.footer.signIn', 'Sign In')}
                  </Link>
                </div>
              </div>

              {/* Company Details for RoboKassa compliance */}
              <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border/30">
                <p className="mb-1">{t('alternatives.footer.company', 'ARchitecKZ • BIN: 190540008684')}</p>
                <p className="mb-2">{t('alternatives.footer.address', 'Almaty, Sholokhov St., 20')}</p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <a href="mailto:admin@LinkMAX.my" className="hover:text-foreground transition-colors">
                    admin@LinkMAX.my
                  </a>
                  <span>•</span>
                  <a href="tel:+77051097664" className="hover:text-foreground transition-colors">
                    +7 705 109 7664
                  </a>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                {t('landingV5.footer.copyright', { year: new Date().getFullYear(), defaultValue: `© ${new Date().getFullYear()} LinkMAX.my` })}
              </p>
            </div>
          </div>
        </footer>
      </div>
    </ScreenErrorBoundary>
  );
}
