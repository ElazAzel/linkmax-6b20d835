'use client';
import { useParams, useSearchParams, Link } from 'react-router-dom';
/**
 * Experts Directory Page
 * /experts - Main directory of all public profiles
 * /experts/{tag} - Filtered by niche/skill
 * 
 * SEO: CollectionPage schema, ItemList, internal linking
 */



import { useEffect, useMemo } from 'react';


import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import Users from 'lucide-react/dist/esm/icons/users';
import Search from 'lucide-react/dist/esm/icons/search';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Star from 'lucide-react/dist/esm/icons/star';
import { cn } from '@/lib/utils/utils';
import { getAppDomain, getPublicPageUrl } from '@/lib/utils/url-helpers';
import {
  fetchExpertDirectoryProfiles,
  normalizeExpertDirectoryFilter,
  type ExpertDirectoryProfile,
} from '@/services/pages';

// Normalized niche tags with i18n
const NICHE_TAGS = [
  { slug: 'beauty', label: { ru: 'Красота', en: 'Beauty', kk: 'Сұлулық' } },
  { slug: 'coaching', label: { ru: 'Коучинг', en: 'Coaching', kk: 'Коучинг' } },
  { slug: 'consulting', label: { ru: 'Консалтинг', en: 'Consulting', kk: 'Кеңес беру' } },
  { slug: 'design', label: { ru: 'Дизайн', en: 'Design', kk: 'Дизайн' } },
  { slug: 'education', label: { ru: 'Образование', en: 'Education', kk: 'Білім' } },
  { slug: 'fitness', label: { ru: 'Фитнес', en: 'Fitness', kk: 'Фитнес' } },
  { slug: 'health', label: { ru: 'Здоровье', en: 'Health', kk: 'Денсаулық' } },
  { slug: 'marketing', label: { ru: 'Маркетинг', en: 'Marketing', kk: 'Маркетинг' } },
  { slug: 'music', label: { ru: 'Музыка', en: 'Music', kk: 'Музыка' } },
  { slug: 'photo', label: { ru: 'Фотография', en: 'Photography', kk: 'Фотография' } },
  { slug: 'tech', label: { ru: 'Технологии', en: 'Technology', kk: 'Технология' } },
  { slug: 'other', label: { ru: 'Другое', en: 'Other', kk: 'Басқа' } },
];

export default function Experts() {
  const params = useParams();
  const tag = params?.tag as string;
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const language = i18n.language as 'ru' | 'en' | 'kk';
  const searchTerm = searchParams.get('q') ?? '';
  const cityFilter = searchParams.get('city') ?? '';
  const verifiedOnly = searchParams.get('verified') === '1';
  const normalizedSearchTerm = normalizeExpertDirectoryFilter(searchTerm)?.toLocaleLowerCase(language) ?? '';

  const { data: experts = [], isLoading } = useQuery({
    queryKey: ['experts', tag, cityFilter, verifiedOnly],
    queryFn: () => fetchExpertDirectoryProfiles({
      tag,
      city: cityFilter,
      verifiedOnly,
      limit: 100,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const visibleExperts = useMemo(() => {
    if (!normalizedSearchTerm) return experts;

    return experts.filter((expert) => [
      expert.title,
      expert.slug,
      expert.description,
      expert.niche,
      expert.city,
      expert.profession,
    ].some((value) => value?.toLocaleLowerCase(language).includes(normalizedSearchTerm)));
  }, [experts, language, normalizedSearchTerm]);

  const ratingFormatter = useMemo(() => new Intl.NumberFormat(language, {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }), [language]);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(language), [language]);

  const updateDirectoryFilter = (key: 'q' | 'city' | 'verified', value: string | null) => {
    const next = new URLSearchParams(searchParams);

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    setSearchParams(next, { replace: true });
  };

  const buildExpertsPath = (nextTag?: string) => {
    const query = searchParams.toString();
    return `${nextTag ? `/experts/${nextTag}` : '/experts'}${query ? `?${query}` : ''}`;
  };

  // Page meta
  const currentTag = NICHE_TAGS.find(t => t.slug === tag);
  const pageTitle = tag
    ? `${currentTag?.label[language] || tag} ${t('experts.title', 'эксперты')} | lnkmx`
    : t('experts.directoryTitle', 'Каталог экспертов | lnkmx');

  const pageDescription = tag
    ? t('experts.tagDescription', { tag: currentTag?.label[language] || tag })
    : t('experts.directoryDescription', 'Найдите экспертов и специалистов на lnkmx');

  const canonical = tag
    ? `${getAppDomain()}/experts/${tag}`
    : `${getAppDomain()}/experts`;

  // JSON-LD Schema
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: pageTitle.replace(' | lnkmx', ''),
      description: pageDescription,
      url: canonical,
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: visibleExperts.slice(0, 20).map((expert, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': expert.entity_type === 'organization' ? 'Organization' : 'Person',
            name: expert.title || expert.slug,
            url: getPublicPageUrl(expert.slug),
            image: expert.avatar_url,
            jobTitle: expert.profession || undefined,
            address: expert.city ? {
              '@type': 'PostalAddress',
              addressLocality: expert.city,
            } : undefined,
            aggregateRating: expert.reviewSummary.publishedCount > 0 && expert.reviewSummary.averageRating
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: expert.reviewSummary.averageRating,
                  reviewCount: expert.reviewSummary.publishedCount,
                  bestRating: 5,
                  worstRating: 1,
                }
              : undefined,
          },
        })),
      },
      isPartOf: {
        '@type': 'WebSite',
        name: 'lnkmx',
        url: getAppDomain(),
      },
    };

    let script = document.querySelector('script#experts-schema') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = 'experts-schema';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(schema);

    return () => {
      script?.remove();
    };
  }, [visibleExperts, canonical, pageTitle, pageDescription]);

  return (
    <>
      <StaticSEOHead
        title={pageTitle}
        description={pageDescription}
        canonical={canonical}
        currentLanguage={language}
        ogType="website"
        alternates={[
          { hreflang: 'ru', href: `${canonical}?lang=ru` },
          { hreflang: 'en', href: `${canonical}?lang=en` },
          { hreflang: 'kk', href: `${canonical}?lang=kk` },
          { hreflang: 'x-default', href: canonical },
        ]}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
          <div className="container max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="text-xl font-bold text-primary">
                lnkmx
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  {t('auth.signIn', 'Войти')}
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="py-12 bg-gradient-to-b from-primary/5 to-background">
          <div className="container max-w-6xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-sm text-primary font-medium">
                {visibleExperts.length}+ {t('experts.profiles', 'профилей')}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {tag ? (
                <>
                  {currentTag?.label[language] || tag}
                  <span className="text-muted-foreground"> {t('experts.onLnkmx', 'на lnkmx')}</span>
                </>
              ) : (
                t('experts.findExperts', 'Найти экспертов')
              )}
            </h1>

            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              {t('experts.subtitle', 'Мини-сайты экспертов, фрилансеров и малого бизнеса')}
            </p>

            <div className="max-w-3xl mx-auto grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  aria-label={t('experts.searchLabel', 'Search by name or niche')}
                  className="pl-10"
                  value={searchTerm}
                  onChange={(event) => updateDirectoryFilter('q', event.target.value.trimStart())}
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  aria-label={t('experts.cityFilter', 'City')}
                  className="pl-10"
                  value={cityFilter}
                  onChange={(event) => updateDirectoryFilter('city', event.target.value.trimStart())}
                />
              </div>
              <Button
                type="button"
                variant={verifiedOnly ? 'default' : 'outline'}
                className="gap-2"
                aria-pressed={verifiedOnly}
                onClick={() => updateDirectoryFilter('verified', verifiedOnly ? null : '1')}
              >
                <ShieldCheck className="h-4 w-4" />
                {t('experts.verifiedOnly', 'Verified')}
              </Button>
            </div>
          </div>
        </section>

        {/* Tags Filter */}
        <section className="py-6 border-b">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="flex flex-wrap gap-2 justify-center">
              <Link to={buildExpertsPath()}>
                <Badge
                  variant={!tag ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/80"
                >
                  {t('experts.all', 'Все')}
                </Badge>
              </Link>
              {NICHE_TAGS.map(niche => (
                <Link key={niche.slug} to={buildExpertsPath(niche.slug)}>
                  <Badge
                    variant={tag === niche.slug ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/80"
                  >
                    {niche.label[language]}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Experts Grid */}
        <section className="py-12">
          <div className="container max-w-6xl mx-auto px-4">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <Skeleton key={i} className="h-48 rounded-xl" />
                ))}
              </div>
            ) : visibleExperts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">
                  {t('experts.noResults', 'Пока нет профилей в этой категории')}
                </p>
                <Link to="/auth">
                  <Button>
                    {t('experts.beFirst', 'Стать первым')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleExperts.map((expert: ExpertDirectoryProfile) => (
                  <Link
                    key={expert.id}
                    to={`/${expert.slug}`}
                    className="group block"
                  >
                    <article
                      className={cn(
                        "h-full p-6 rounded-xl border bg-card hover:border-primary/50 transition-all",
                        "hover:shadow-lg hover:-translate-y-1"
                      )}
                      itemScope
                      itemType={expert.entity_type === 'organization'
                        ? 'https://schema.org/Organization'
                        : 'https://schema.org/Person'}
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="h-14 w-14 ring-2 ring-background">
                          <AvatarImage src={expert.avatar_url || undefined} itemProp="image" />
                          <AvatarFallback>
                            {(expert.title || expert.slug).slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-semibold truncate group-hover:text-primary transition-colors"
                            itemProp="name"
                          >
                            {expert.title || expert.slug}
                          </h3>
                          <p
                            className="text-sm text-muted-foreground line-clamp-2 mt-1"
                            itemProp="description"
                          >
                            {expert.description || t('experts.noDescription', 'Нет описания')}
                          </p>
                          <meta itemProp="url" content={getPublicPageUrl(expert.slug)} />
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {expert.reviewSummary.publishedCount > 0 && expert.reviewSummary.averageRating !== null && (
                        <div
                          className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-primary/5 px-3 py-2"
                          itemProp="aggregateRating"
                          itemScope
                          itemType="https://schema.org/AggregateRating"
                        >
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <Star className="h-4 w-4 fill-primary text-primary" />
                            <span itemProp="ratingValue">
                              {ratingFormatter.format(expert.reviewSummary.averageRating)}
                            </span>
                            <meta itemProp="bestRating" content="5" />
                            <meta itemProp="worstRating" content="1" />
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                            <span>
                              {t('experts.verifiedReviewCount', '{{count}} verified', {
                                count: expert.reviewSummary.publishedCount,
                              })}
                            </span>
                            <meta itemProp="reviewCount" content={String(expert.reviewSummary.publishedCount)} />
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {expert.niche && (
                          <Badge variant="secondary" className="text-xs">
                            {NICHE_TAGS.find(n => n.slug === expert.niche)?.label[language] || expert.niche}
                          </Badge>
                        )}
                        {expert.city && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {expert.city}
                          </span>
                        )}
                        {expert.view_count && expert.view_count > 100 && (
                            <span className="text-xs text-muted-foreground">
                              {numberFormatter.format(expert.view_count)} {t('experts.views', 'просмотров')}
                            </span>
                          )}
                      </div>
                    </article>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary/5">
          <div className="container max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">
              {t('experts.ctaTitle', 'Создайте свою страницу бесплатно')}
            </h2>
            <p className="text-muted-foreground mb-6">
              {t('experts.ctaSubtitle', 'Присоединяйтесь к сообществу экспертов на lnkmx')}
            </p>
            <Link to="/auth">
              <Button size="lg" className="font-semibold">
                {t('experts.ctaButton', 'Создать страницу')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-8">
          <div className="container max-w-6xl mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} lnkmx. {t('footer.rights', 'Все права защищены.')}</p>
          </div>
        </footer>
      </div>
    </>
  );
}
