import { useMemo } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/translation/LanguageSwitcher';
import { SEOMetaEnhancer } from '@/components/seo/SEOMetaEnhancer';
import { getAppDomain } from '@/lib/utils/url-helpers';
import { ALTERNATIVE_PROFILES, getAlternativeProfile } from '@/lib/alternatives-data';
import { useMarketingAnalytics } from '@/hooks/analytics/useMarketingAnalytics';

export default function AlternativeDetail() {
  const { competitor } = useParams();
  const profile = getAlternativeProfile(competitor);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { trackMarketingEvent } = useMarketingAnalytics();

  const canonicalUrl = useMemo(
    () => `${getAppDomain()}/alternatives/${profile?.slug ?? ''}`,
    [profile?.slug],
  );

  if (!profile) {
    return <Navigate to="/alternatives" replace />;
  }

  const onCta = (source: string) => {
    trackMarketingEvent({
      eventType: 'alternatives_cta_click',
      metadata: { source, competitor: profile.competitor },
    });
    navigate('/auth');
  };

  // Per-competitor translatable bundle, with RU fallback to data file.
  const tr = (field: string, fallback: string) =>
    t(`alternatives.profiles.${profile.slug}.${field}`, fallback);

  return (
    <>
      <SEOMetaEnhancer
        pageUrl={canonicalUrl}
        pageTitle={`LinkMAX vs ${profile.competitor}: ${tr('seoTitle', 'миграция на local-first business OS')}`}
        pageDescription={`${tr('summary', profile.summary)} ${t('alternatives.detail.metaTail', 'Сравните и запустите страницу + CRM + booking в одном окне.')}`}
        type="article"
        section="Alternatives"
      />

      <div className="min-h-screen bg-background pb-safe">
        <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/alternatives')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Link to="/" className="font-bold text-lg">LinkMAX.my</Link>
              <Badge variant="secondary">{profile.category}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <Button size="sm" onClick={() => onCta('header')}>
                {t('alternatives.detail.ctaHeader', 'Начать бесплатно')}
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
          <section className="space-y-4">
            <Badge className="bg-primary/10 text-primary border-primary/20">
              {t('alternatives.detail.badge', 'Migration guide')}
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              LinkMAX vs {profile.competitor}
            </h1>
            <p className="text-muted-foreground text-lg">{tr('summary', profile.summary)}</p>
            <p className="text-sm text-muted-foreground">
              {t('alternatives.detail.bestForLabel', 'Лучший сценарий для')} {profile.competitor}: {tr('bestFor', profile.bestFor)}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => onCta('hero_primary')}>
                <Sparkles className="h-4 w-4 mr-2" />
                {tr('migrationCta', profile.migrationCta)}
              </Button>
              <Button variant="outline" asChild>
                <Link to="/pricing">
                  {t('alternatives.detail.comparePricing', 'Сравнить тарифы')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </section>

          {profile.compareRows && profile.compareRows.length > 0 && (
            <section className="rounded-2xl border border-border/60 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">{t('alternatives.detail.table.metric', 'Критерий')}</th>
                    <th className="text-left px-4 py-3 font-semibold">{profile.competitor}</th>
                    <th className="text-left px-4 py-3 font-semibold text-primary">LinkMAX</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.compareRows.map((row) => (
                    <tr key={row.label} className="border-t border-border/40">
                      <td className="px-4 py-3 font-medium">{row.label}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.them}</td>
                      <td className="px-4 py-3 font-semibold text-primary">{row.us}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('alternatives.detail.migrationTitle', 'План миграции за 1 день')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {profile.migrationPoints.map((point) => (
                    <li key={point} className="flex gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('alternatives.detail.advantagesTitle', 'Почему LinkMAX сильнее в этом сценарии')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {profile.lnkmxAdvantages.map((point) => (
                    <li key={point} className="flex gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </section>

          <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center space-y-3">
            <h2 className="text-2xl font-bold">
              {t('alternatives.detail.ctaTitle', 'Готовы к миграции с')} {profile.competitor}?
            </h2>
            <p className="text-muted-foreground">
              {t('alternatives.detail.ctaSubtitle', 'Запустите страницу, CRM и booking в одном интерфейсе и сократите путь до первой сделки.')}
            </p>
            <Button size="lg" onClick={() => onCta('bottom')}>
              {t('alternatives.detail.ctaButton', 'Создать аккаунт')}
            </Button>
          </section>

          <section>
            <h3 className="font-semibold mb-3">{t('alternatives.detail.otherTitle', 'Другие сравнения')}</h3>
            <div className="flex flex-wrap gap-2">
              {ALTERNATIVE_PROFILES.filter((item) => item.slug !== profile.slug).map((item) => (
                <Button key={item.slug} variant="outline" size="sm" asChild>
                  <Link to={item.route}>vs {item.competitor}</Link>
                </Button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
