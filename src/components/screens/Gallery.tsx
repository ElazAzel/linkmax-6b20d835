/**
 * Gallery v2.0 - Clean, modern community gallery
 */
'use client';

import { useState, useMemo, useCallback, useEffect, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Heart from 'lucide-react/dist/esm/icons/heart';
import Search from 'lucide-react/dist/esm/icons/search';
import Eye from 'lucide-react/dist/esm/icons/eye';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import X from 'lucide-react/dist/esm/icons/x';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkeletonGalleryGrid } from '@/components/ui/skeleton-card';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingState } from '@/components/ui/loading-state';
import { Leaderboard } from '@/components/gallery/Leaderboard';
import { TopReferrers } from '@/components/gallery/TopReferrers';
import { LanguageSwitcher } from '@/components/translation/LanguageSwitcher';
import { useGallery } from '@/hooks/social/useGallery';
import { GalleryPageCard } from '@/components/gallery/GalleryPageCard';
import { NICHES } from '@/lib/niches';
import { cn } from '@/lib/utils/utils';
import { toast } from 'sonner';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import { StructuredData } from '@/components/seo/StructuredData';
import { SEOMetaEnhancer } from '@/components/seo/SEOMetaEnhancer';
import { GEOTagging } from '@/components/seo/GEOTagging';
import { AISearchOptimizer } from '@/components/seo/AISearchOptimizer';
import { getAppDomain, getPublicPageUrl } from '@/lib/utils/url-helpers';

type SortMode = 'popular' | 'recent' | 'views';

const stripDecorativeEmoji = (label: string) => label.replace(/^[^\p{L}\p{N}]+/u, '');

export const Gallery = memo(function Gallery() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { pages, loading, likePage, cities } = useGallery();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'gallery' | 'leaderboard'>('gallery');
  const [sortMode, setSortMode] = useState<SortMode>('popular');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const nicheLabel = selectedNiche ? t(`niches.${selectedNiche}`, selectedNiche) : null;
  const canonical = selectedNiche
    ? `${getAppDomain()}/gallery?niche=${selectedNiche}`
    : `${getAppDomain()}/gallery`;
  const seoTitle = selectedNiche
    ? t('gallery.seo.nicheTitle', { niche: nicheLabel, defaultValue: `lnkmx Gallery — ${nicheLabel}` })
    : t('gallery.seo.title', 'lnkmx Gallery — Link in Bio Examples & Templates');
  const seoDescription = selectedNiche
    ? t('gallery.seo.nicheDescription', { niche: nicheLabel, defaultValue: `Explore ${nicheLabel} pages on lnkmx.` })
    : t(
      'gallery.seo.description',
      'Explore real lnkmx link in bio pages by creators and businesses. Find templates, niches, and inspiration for your mini-site.'
    );

  // Filter & sort pages
  const filteredPages = useMemo(() => {
    const result = pages.filter(page => {
      const matchesSearch = !searchQuery ||
        page.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesNiche = !selectedNiche || page.niche === selectedNiche;
      const matchesCity = !selectedCity || page.city === selectedCity;
      return matchesSearch && matchesNiche && matchesCity;
    });

    switch (sortMode) {
      case 'popular':
        result.sort((a, b) => (b.gallery_likes || 0) - (a.gallery_likes || 0));
        break;
      case 'views':
        result.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case 'recent':
        result.sort((a, b) => {
          const aDate = a.gallery_featured_at ? new Date(a.gallery_featured_at).getTime() : 0;
          const bDate = b.gallery_featured_at ? new Date(b.gallery_featured_at).getTime() : 0;
          return bDate - aDate;
        });
        break;
    }

    return result;
  }, [pages, searchQuery, selectedNiche, sortMode, selectedCity]);

  const featuredPages = useMemo(() => [...pages]
    .sort((a, b) => (b.gallery_likes || 0) - (a.gallery_likes || 0))
    .slice(0, 5), [pages]);

  const gallerySchema = useMemo(() => ({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: seoTitle,
        description: seoDescription,
        url: canonical,
        inLanguage: i18n.language,
      },
      {
        '@type': 'ItemList',
        itemListElement: featuredPages.map((page, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: getPublicPageUrl(page.slug),
          name: page.title || page.slug,
        })),
      },
    ],
  }), [seoTitle, seoDescription, canonical, featuredPages, i18n.language]);

  useEffect(() => {
    const nicheParam = searchParams.get('niche');
    if (nicheParam && NICHES.includes(nicheParam as (typeof NICHES)[number])) {
      setSelectedNiche(nicheParam);
    } else if (!nicheParam) {
      setSelectedNiche(null);
    }
  }, [searchParams]);

  const updateNiche = useCallback((niche: string | null) => {
    setSelectedNiche(niche);
    const nextParams = new URLSearchParams(searchParams.toString());
    if (niche) {
      nextParams.set('niche', niche);
    } else {
      nextParams.delete('niche');
    }
    navigate(`/gallery?${nextParams.toString()}`, { replace: true });
  }, [searchParams, navigate]);

  const handleCopyTemplate = useCallback((_pageSlug: string) => {
    toast.success(t('gallery.templateCopied', 'Шаблон скопирован!'), {
      description: t('gallery.goToEditor', 'Откройте редактор чтобы настроить'),
      action: {
        label: t('gallery.openEditor', 'Открыть'),
        onClick: () => navigate('/dashboard?tab=editor'),
      },
    });
  }, [t, navigate]);

  const seoHighlights = t('gallery.seoIntro.highlights', { returnObjects: true }) as string[];

  return (
    <>
      <StaticSEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={canonical}
        currentLanguage={i18n.language}
        alternates={[
          { hreflang: 'ru', href: `${canonical}${canonical.includes('?') ? '&' : '?'}lang=ru` },
          { hreflang: 'en', href: `${canonical}${canonical.includes('?') ? '&' : '?'}lang=en` },
          { hreflang: 'kk', href: `${canonical}${canonical.includes('?') ? '&' : '?'}lang=kk` },
          { hreflang: 'x-default', href: canonical },
        ]}
      />
      <SEOMetaEnhancer
        pageUrl={canonical}
        pageTitle={seoTitle}
        pageDescription={seoDescription}
        imageUrl={`${getAppDomain()}/og-gallery.png`}
        imageAlt={t('gallery.seo.imageAlt', 'lnkmx Gallery - Link in Bio Examples')}
        type="website"
      />
      <GEOTagging includeOrganization={false} />
      <AISearchOptimizer
        pageType="gallery"
        primaryQuestion={t('gallery.seo.opt.question', 'Where can I see examples of lnkmx pages?')}
        primaryAnswer={t('gallery.seo.opt.answer', 'The lnkmx Gallery showcases real examples of pages created by users across different industries including freelancers, businesses, beauty professionals, fitness coaches, and content creators.')}
        entityName="lnkmx Gallery"
        entityCategory="Page Examples, Templates, Portfolio, Showcase"
        useCases={[
          t('gallery.seo.opt.uses.1', 'Browse professional page examples'),
          t('gallery.seo.opt.uses.2', 'Find inspiration for your industry'),
          t('gallery.seo.opt.uses.3', 'See real user implementations'),
          t('gallery.seo.opt.uses.4', 'Discover design ideas'),
          t('gallery.seo.opt.uses.5', 'Learn from successful pages'),
        ]}
        targetAudience={[
          t('gallery.seo.opt.audience.1', 'New users seeking inspiration'),
          t('gallery.seo.opt.audience.2', 'Businesses looking for examples'),
          t('gallery.seo.opt.audience.3', 'Designers researching layouts'),
          t('gallery.seo.opt.audience.4', 'Marketers studying conversions'),
        ]}
        problemStatement={t('gallery.seo.opt.problem', 'Users need inspiration and examples to understand how to build effective pages')}
        solutionStatement={t('gallery.seo.opt.solution', 'The Gallery provides real-world examples across multiple industries showing successful page implementations')}
      />
      <StructuredData id="gallery-schema" data={gallerySchema} />

      <main className="min-h-screen bg-background" data-testid="gallery">
        {/* Compact header */}
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/20">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full shrink-0" asChild>
                <Link to="/" aria-label={t('common.back', 'Go back')}>
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>

              {showSearch ? (
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    autoFocus
                    placeholder={t('gallery.searchPlaceholder', 'Поиск...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 pl-9 pr-9 rounded-full bg-muted/50 border-0 text-sm"
                  />
                  <button
                    onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                    aria-label={t('gallery.closeSearch', 'Закрыть поиск')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0 max-w-[min(46vw,18rem)]">
                    <h1 className="text-base sm:text-lg font-bold break-words whitespace-normal text-wrap leading-tight">
                      {t('gallery.title', 'Галерея')}
                    </h1>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-full shrink-0"
                    onClick={() => setShowSearch(true)}
                    aria-label={t('common.search', 'Search')}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </>
              )}

              <LanguageSwitcher />
              <Button
                size="sm"
                className="h-9 min-h-9 rounded-full font-semibold text-[11px] sm:text-xs px-3 sm:px-4 shrink-0 max-w-[9.5rem] sm:max-w-[11rem] whitespace-normal break-words text-wrap leading-tight"
                onClick={() => navigate('/auth')}
              >
                <Sparkles className="h-3.5 w-3.5 mr-1" />
                {t('gallery.create', 'Создать')}
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-3 bg-muted/40 rounded-full p-0.5">
              <button
                onClick={() => setActiveTab('gallery')}
                className={cn(
                  "flex-1 min-h-8 rounded-full text-[11px] sm:text-xs font-semibold transition-all whitespace-normal break-words text-wrap leading-tight px-2",
                  activeTab === 'gallery'
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t('gallery.tabGallery', 'Галерея')}
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={cn(
                  "flex-1 min-h-8 rounded-full text-[11px] sm:text-xs font-semibold transition-all whitespace-normal break-words text-wrap leading-tight px-2",
                  activeTab === 'leaderboard'
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t('gallery.tabLeaderboard', 'Рейтинг')}
              </button>
            </div>
          </div>
        </header>

        {activeTab === 'gallery' && (
          <div className="max-w-6xl mx-auto">
            {/* Niche filter pills */}
            <h2 className="sr-only">{t('gallery.filtersHeading', 'Фильтры галереи')}</h2>
            <div className="px-4 pt-4 pb-2 overflow-x-auto scrollbar-hide">

              <div className="flex gap-1.5 min-w-max">
                <button
                  onClick={() => updateNiche(null)}
                  className={cn(
                    "h-8 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                    !selectedNiche
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {t('gallery.allNiches', 'Все')}
                </button>
                {NICHES.map((niche) => (
                  <button
                    key={niche}
                    onClick={() => updateNiche(selectedNiche === niche ? null : niche)}
                    className={cn(
                      "h-8 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                      selectedNiche === niche
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {stripDecorativeEmoji(t(`niches.${niche}`, niche))}
                  </button>
                ))}
              </div>
            </div>

            {/* City filter pills */}
            {(cities?.length ?? 0) > 0 && (
              <div className="px-4 pb-2 overflow-x-auto scrollbar-hide">
                <div className="flex gap-1.5 min-w-max">
                  <button
                    onClick={() => setSelectedCity(null)}
                    className={cn(
                      "h-7 px-3 rounded-full text-[11px] font-medium whitespace-nowrap transition-all",
                      !selectedCity
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3 w-3" />
                      {stripDecorativeEmoji(t('gallery.allCities', 'Все города'))}
                    </span>
                  </button>
                  {(cities ?? []).slice(0, 15).map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedCity(selectedCity === c ? null : c)}
                      className={cn(
                        "h-7 px-3 rounded-full text-[11px] font-medium whitespace-nowrap transition-all",
                        selectedCity === c
                          ? "bg-accent text-accent-foreground shadow-sm"
                          : "bg-muted/30 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sort buttons */}
            <div className="px-4 pb-3 flex items-center gap-2">
              <div className="flex gap-1 bg-muted/30 rounded-full p-0.5">
                {([
                  { key: 'popular' as SortMode, icon: Heart, label: t('gallery.sortPopular', 'Популярные') },
                  { key: 'views' as SortMode, icon: Eye, label: t('gallery.sortViews', 'Просмотры') },
                  { key: 'recent' as SortMode, icon: TrendingUp, label: t('gallery.sortRecent', 'Новые') },
                ]).map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setSortMode(key)}
                    className={cn(
                      "h-7 px-3 rounded-full text-[11px] font-medium transition-all flex items-center gap-1",
                      sortMode === key
                        ? "bg-background shadow-sm text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </button>
                ))}
              </div>
              <span className="text-xs text-muted-foreground ml-auto">
                {filteredPages.length} {t('gallery.pages', 'страниц')}
              </span>
            </div>

            {/* Grid */}
            <h2 className="sr-only">{t('gallery.resultsHeading', 'Результаты')}</h2>
            <div className="px-4 pb-20">
              {loading ? (

                <LoadingState skeleton={<SkeletonGalleryGrid />} />
              ) : filteredPages.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title={t('gallery.noPages', 'Страниц не найдено')}
                  description={t('gallery.tryAnotherFilter', 'Попробуйте другой фильтр')}
                  ctaLabel={t('gallery.resetFilters', 'Сбросить фильтры')}
                  onCtaClick={() => {
                    setSearchQuery('');
                    setSortMode('popular');
                    setSelectedCity(null);
                    updateNiche(null);
                  }}
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                  {filteredPages.map((page) => (
                    <GalleryPageCard
                      key={page.id}
                      page={page}
                      onCopy={() => handleCopyTemplate(page.slug)}
                      onView={() => navigate(`/${page.slug}`)}
                      onLike={() => likePage(page.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Hidden SEO content */}
            <section className="sr-only" aria-hidden="false">
              <h2>{t('gallery.seoIntro.title')}</h2>
              <p>{t('gallery.seoIntro.subtitle')}</p>
              <ul>
                {Array.isArray(seoHighlights) && seoHighlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h3>{t('gallery.seoIntro.locationTitle')}</h3>
              <p>{t('gallery.seoIntro.locationBody')}</p>
            </section>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="max-w-6xl mx-auto px-4 py-4 space-y-6 pb-20">
            <Leaderboard />
            <TopReferrers />
          </div>
        )}
      </main>
    </>
  );
});
export default Gallery;
