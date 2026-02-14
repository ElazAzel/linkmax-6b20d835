/**
 * Gallery v1.3 - Mobile-first community gallery with performance optimizations
 * iOS-style design with filters, skeleton loading, and one-tap copy
 */
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Sparkles,
  TrendingUp,
  Heart,
  Search,
  Filter,
  Copy,
  ExternalLink,
  Crown,
  Eye,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { SkeletonCard, SkeletonGalleryGrid, SkeletonStats } from '@/components/ui/skeleton-card';
import { CommunityGallery } from '@/components/gallery/CommunityGallery';
import { Leaderboard } from '@/components/gallery/Leaderboard';
import { TopReferrers } from '@/components/gallery/TopReferrers';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useGallery } from '@/hooks/useGallery';
import { NICHES, NICHE_ICONS } from '@/lib/niches';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import { StructuredData } from '@/components/seo/StructuredData';
import { SEOMetaEnhancer } from '@/components/seo/SEOMetaEnhancer';
import { GEOTagging } from '@/components/seo/GEOTagging';
import { AISearchOptimizer } from '@/components/seo/AISearchOptimizer';

export default function Gallery() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { pages, loading, likePage } = useGallery();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'gallery' | 'leaderboard'>('gallery');
  const nicheLabel = selectedNiche ? t(`niches.${selectedNiche}`, selectedNiche) : null;
  const canonical = selectedNiche
    ? `https://lnkmx.my/gallery?niche=${selectedNiche}`
    : 'https://lnkmx.my/gallery';
  const seoTitle = selectedNiche
    ? t('gallery.seo.nicheTitle', { niche: nicheLabel, defaultValue: `lnkmx Gallery — ${nicheLabel}` })
    : t('gallery.seo.title', 'lnkmx Gallery — Link in Bio Examples & Templates');
  const seoDescription = selectedNiche
    ? t('gallery.seo.nicheDescription', { niche: nicheLabel, defaultValue: `Explore ${nicheLabel} pages on lnkmx.` })
    : t(
      'gallery.seo.description',
      'Explore real lnkmx link in bio pages by creators and businesses. Find templates, niches, and inspiration for your mini-site.'
    );
  const seoHighlights = t('gallery.seoIntro.highlights', { returnObjects: true }) as string[];

  // Quick stats - memoized for performance
  const totalLikes = useMemo(() =>
    pages.reduce((sum, p) => sum + (p.gallery_likes || 0), 0), [pages]);
  const totalViews = useMemo(() =>
    pages.reduce((sum, p) => sum + (p.view_count || 0), 0), [pages]);

  // Filter pages - memoized
  const filteredPages = useMemo(() => pages.filter(page => {
    const matchesSearch = !searchQuery ||
      page.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNiche = !selectedNiche || page.niche === selectedNiche;
    return matchesSearch && matchesNiche;
  }), [pages, searchQuery, selectedNiche]);

  // Featured pages (top 5 by likes) - memoized
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
          url: `https://lnkmx.my/${page.slug}`,
          name: page.title || page.slug,
        })),
      },
    ],
  }), [seoTitle, seoDescription, canonical, featuredPages, i18n.language]);

  useEffect(() => {
    const nicheParam = searchParams.get('niche');
    if (nicheParam && NICHES.includes(nicheParam as (typeof NICHES)[number])) {
      setSelectedNiche(nicheParam);
      return;
    }
    if (!nicheParam) {
      setSelectedNiche(null);
    }
  }, [searchParams]);

  const updateNiche = useCallback((niche: string | null) => {
    setSelectedNiche(niche);
    const nextParams = new URLSearchParams(searchParams);
    if (niche) {
      nextParams.set('niche', niche);
    } else {
      nextParams.delete('niche');
    }
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Handlers - memoized
  const handleCopyTemplate = useCallback((pageSlug: string) => {
    toast.success(t('gallery.templateCopied', 'Шаблон скопирован!'), {
      description: t('gallery.goToEditor', 'Откройте редактор чтобы настроить'),
      action: {
        label: t('gallery.openEditor', 'Открыть'),
        onClick: () => navigate('/dashboard?tab=editor'),
      },
    });
  }, [t, navigate]);

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
        imageUrl="https://lnkmx.my/og-gallery.png"
        imageAlt={t('gallery.seo.imageAlt', 'lnkmx Gallery - Link in Bio Examples')}
        type="website"
      />
      <GEOTagging includeOrganization={false} />
      <AISearchOptimizer
        pageType="gallery"
        primaryQuestion="Where can I see examples of lnkmx pages?"
        primaryAnswer="The lnkmx Gallery showcases real examples of pages created by users across different industries including freelancers, businesses, beauty professionals, fitness coaches, and content creators."
        entityName="lnkmx Gallery"
        entityCategory="Page Examples, Templates, Portfolio, Showcase"
        useCases={[
          'Browse professional page examples',
          'Find inspiration for your industry',
          'See real user implementations',
          'Discover design ideas',
          'Learn from successful pages',
        ]}
        targetAudience={[
          'New users seeking inspiration',
          'Businesses looking for examples',
          'Designers researching layouts',
          'Marketers studying conversions',
        ]}
        problemStatement="Users need inspiration and examples to understand how to build effective pages"
        solutionStatement="The Gallery provides real-world examples across multiple industries showing successful page implementations"
      />
      <StructuredData id="gallery-schema" data={gallerySchema} />
      <div className="min-h-screen bg-background pb-20">
        {/* Header - Sticky glass effect */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-border/10">
          <div className="px-5 pt-4 pb-3">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl" asChild>
                <Link to="/">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div className="flex-1">
                <h1 className="text-xl font-black flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  {t('gallery.title', 'Галерея')}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {pages.length} {t('gallery.pages', 'страниц')}
                </p>
              </div>
              <LanguageSwitcher />
              <Button
                size="sm"
                className="h-10 rounded-xl font-bold"
                onClick={() => navigate('/auth')}
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                {t('gallery.create', 'Создать')}
              </Button>
            </div>

            {/* Stats row - with skeleton loading */}
            {loading ? (
              <SkeletonStats />
            ) : (
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="p-3 rounded-xl bg-muted/50 text-center">
                  <Sparkles className="h-4 w-4 mx-auto text-primary mb-1" />
                  <p className="text-lg font-black">{pages.length}</p>
                  <p className="text-xs text-muted-foreground">{t('gallery.statsPages', 'Страниц')}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 text-center">
                  <Heart className="h-4 w-4 mx-auto text-red-500 mb-1" />
                  <p className="text-lg font-black">{totalLikes}</p>
                  <p className="text-xs text-muted-foreground">{t('gallery.statsLikes', 'Лайков')}</p>
                </div>
                <div className="p-3 rounded-xl bg-muted/50 text-center">
                  <Eye className="h-4 w-4 mx-auto text-emerald-500 mb-1" />
                  <p className="text-lg font-black">{totalViews}</p>
                  <p className="text-xs text-muted-foreground">{t('gallery.statsViews', 'Просмотров')}</p>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="bg-muted/50 rounded-xl p-1 flex gap-1">
              <button
                onClick={() => setActiveTab('gallery')}
                className={cn(
                  "flex-1 h-10 rounded-lg text-sm font-bold transition-all",
                  activeTab === 'gallery'
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {t('gallery.tabGallery', 'Галерея')}
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={cn(
                  "flex-1 h-10 rounded-lg text-sm font-bold transition-all",
                  activeTab === 'leaderboard'
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {t('gallery.tabLeaderboard', 'Рейтинг')}
              </button>
            </div>
          </div>
        </header>

        {activeTab === 'gallery' && (
          <>
            {/* SEO intro */}
            <section className="px-5 pt-4">
              <div className="rounded-2xl border border-border/40 bg-card/60 p-5 space-y-3">
                <h2 className="text-base font-semibold">{t('gallery.seoIntro.title')}</h2>
                <p className="text-sm text-muted-foreground">{t('gallery.seoIntro.subtitle')}</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  {seoHighlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="pt-2">
                  <h3 className="text-sm font-semibold">{t('gallery.seoIntro.locationTitle')}</h3>
                  <p className="text-sm text-muted-foreground">{t('gallery.seoIntro.locationBody')}</p>
                </div>
              </div>
            </section>

            {/* Search */}
            <div className="px-5 py-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder={t('gallery.searchPlaceholder', 'Поиск страниц...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 pl-12 rounded-xl bg-muted/50 border-0 text-base"
                />
              </div>
            </div>

            {/* Niche filters - Horizontal scroll */}
            <div className="px-5 pb-3 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 min-w-max">
                <button
                  onClick={() => updateNiche(null)}
                  className={cn(
                    "h-9 px-4 rounded-full text-sm font-bold whitespace-nowrap transition-all",
                    !selectedNiche
                      ? "bg-foreground text-background"
                      : "bg-muted/60 text-muted-foreground"
                  )}
                >
                  {t('gallery.allNiches', 'Все')}
                </button>
                {NICHES.slice(0, 10).map((niche) => (
                  <button
                    key={niche}
                    onClick={() => updateNiche(niche)}
                    className={cn(
                      "h-9 px-4 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5",
                      selectedNiche === niche
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/60 text-muted-foreground"
                    )}
                  >
                    <span>{NICHE_ICONS[niche]}</span>
                    {t(`niches.${niche}`, niche)}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured carousel */}
            {!searchQuery && !selectedNiche && featuredPages.length > 0 && (
              <div className="px-5 pb-4">
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                  {t('gallery.featured', 'Популярные')}
                </h2>
                <ScrollArea className="w-full">
                  <div className="flex gap-3 pb-2">
                    {featuredPages.map((page) => (
                      <FeaturedPageCard
                        key={page.id}
                        page={page}
                        onCopy={() => handleCopyTemplate(page.slug)}
                        onView={() => navigate(`/${page.slug}`)}
                      />
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            )}

            {/* Pages grid */}
            <div className="px-5">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3">
                {selectedNiche
                  ? t(`niches.${selectedNiche}`, selectedNiche)
                  : t('gallery.allPages', 'Все страницы')}
                <span className="ml-2 text-xs font-normal">({filteredPages.length})</span>
              </h2>

              {loading ? (
                <SkeletonGalleryGrid />
              ) : filteredPages.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                  <h3 className="font-bold mb-2">{t('gallery.noPages', 'Страниц не найдено')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('gallery.tryAnotherFilter', 'Попробуйте другой фильтр')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
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
          </>
        )}

        {activeTab === 'leaderboard' && (
          <div className="px-5 py-4 space-y-6">
            <Leaderboard />
            <TopReferrers />
          </div>
        )}
      </div>
    </>
  );
}

// Featured Page Card - Larger horizontal card
interface FeaturedPageCardProps {
  page: any;
  onCopy: () => void;
  onView: () => void;
}

function FeaturedPageCard({ page, onCopy, onView }: FeaturedPageCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="w-64 shrink-0 overflow-hidden bg-card/50 border-border/30">
      {/* Preview image */}
      <div className="h-32 bg-gradient-to-br from-primary/20 to-violet-500/20 relative">
        {page.preview_url && (
          <img
            src={page.preview_url}
            alt={page.title}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        )}
        {page.is_premium && (
          <Badge className="absolute top-2 right-2 bg-amber-500 text-white border-0">
            <Crown className="h-3 w-3 mr-1" />
            PRO
          </Badge>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={page.avatar_url} />
            <AvatarFallback className="rounded-lg text-xs font-bold bg-primary/10 text-primary">
              {page.title?.charAt(0) || 'L'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm truncate">{page.title || t('gallery.untitled', 'Untitled')}</h3>
            <p className="text-xs text-muted-foreground truncate">{page.description}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {page.gallery_likes || 0}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {page.view_count || 0}
            </span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={(e) => { e.stopPropagation(); onCopy(); }}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={(e) => { e.stopPropagation(); onView(); }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Gallery Page Card - Grid item
interface GalleryPageCardProps {
  page: any;
  onCopy: () => void;
  onView: () => void;
  onLike: () => void;
}

function GalleryPageCard({ page, onCopy, onView, onLike }: GalleryPageCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      className="overflow-hidden bg-card/50 border-border/30 hover:border-border/50 transition-all cursor-pointer active:scale-[0.98]"
      onClick={onView}
    >
      {/* Preview */}
      <div className="aspect-[4/3] bg-gradient-to-br from-primary/10 to-violet-500/10 relative">
        {page.preview_url && (
          <img
            src={page.preview_url}
            alt={page.title}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        )}
        {page.is_premium && (
          <div className="absolute top-2 right-2">
            <Crown className="h-4 w-4 text-amber-500" />
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-6 w-6 rounded-md">
            <AvatarImage src={page.avatar_url} />
            <AvatarFallback className="rounded-md text-xs font-bold bg-primary/10 text-primary">
              {page.title?.charAt(0) || 'L'}
            </AvatarFallback>
          </Avatar>
          <span className="font-bold text-sm truncate flex-1">{page.title || t('gallery.untitled', 'Untitled')}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <button
              onClick={(e) => { e.stopPropagation(); onLike(); }}
              className="flex items-center gap-1 hover:text-red-500 transition-colors"
            >
              <Heart className="h-3 w-3" />
              {page.gallery_likes || 0}
            </button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs rounded-lg"
            onClick={(e) => { e.stopPropagation(); onCopy(); }}
          >
            <Copy className="h-3 w-3 mr-1" />
            {t('common.copy', 'Copy')}
          </Button>
        </div>
      </div>
    </Card>
  );
}
