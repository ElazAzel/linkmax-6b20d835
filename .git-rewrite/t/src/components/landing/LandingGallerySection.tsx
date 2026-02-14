import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, ArrowRight, Crown, Eye, Heart, Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useGallery } from '@/hooks/useGallery';
import { NICHES, NICHE_ICONS, type Niche } from '@/lib/niches';
import { toast } from 'sonner';

export function LandingGallerySection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pages, loading, likePage, selectedNiche, setSelectedNiche, nicheCounts } = useGallery();
  const [likedPages, setLikedPages] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // Get top 8 pages for display
  const displayPages = pages.slice(0, 8);

  const handleLike = useCallback(async (e: React.MouseEvent, pageId: string) => {
    e.stopPropagation();
    
    // Check localStorage for liked pages
    const storedLikes = localStorage.getItem('linkmax_liked_pages');
    const likedSet = new Set<string>(storedLikes ? JSON.parse(storedLikes) : []);
    
    if (likedSet.has(pageId)) {
      toast.info(t('gallery.alreadyLiked', 'You already liked this page'));
      return;
    }
    
    await likePage(pageId);
    likedSet.add(pageId);
    setLikedPages(new Set(likedSet));
    localStorage.setItem('linkmax_liked_pages', JSON.stringify([...likedSet]));
    toast.success(t('gallery.liked', 'Page liked!'));
  }, [likePage, t]);

  // Load liked pages from localStorage on mount
  useEffect(() => {
    const storedLikes = localStorage.getItem('linkmax_liked_pages');
    if (storedLikes) {
      try {
        setLikedPages(new Set(JSON.parse(storedLikes)));
      } catch (e) {
        console.error('Failed to parse liked pages:', e);
      }
    }
  }, []);

  // Top 5 niches by count
  const topNiches = Object.entries(nicheCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([niche]) => niche as Niche);

  return (
    <section className="py-12 sm:py-20 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium mb-4">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-primary">{t('landing.gallery.badge', 'Community')}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-3 sm:mb-4">
            {t('landing.gallery.title', 'Explore Community Pages')}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('landing.gallery.subtitle', 'Get inspired by amazing pages created by our community')}
          </p>
        </div>

        {/* Niche Filters - Always visible */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden text-muted-foreground"
            >
              <Filter className="h-4 w-4 mr-1" />
              {t('gallery.filter', 'Filter')}
            </Button>
          </div>
          
          <div className={`flex flex-wrap justify-center gap-2 ${showFilters ? '' : 'hidden sm:flex'}`}>
            <Button
              variant={selectedNiche === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedNiche(null)}
              className="rounded-full text-xs sm:text-sm"
            >
              {t('gallery.all', 'All')}
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">
                {Object.values(nicheCounts).reduce((a, b) => a + b, 0)}
              </Badge>
            </Button>
            
            {topNiches.map((niche) => (
              <Button
                key={niche}
                variant={selectedNiche === niche ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedNiche(niche)}
                className="rounded-full text-xs sm:text-sm"
              >
                <span className="mr-1">{NICHE_ICONS[niche]}</span>
                {t(`niches.${niche}`, niche)}
                <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">
                  {nicheCounts[niche] || 0}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!loading && displayPages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('gallery.empty', 'No pages found')}</p>
          </div>
        )}

        {/* Gallery grid */}
        {!loading && displayPages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {displayPages.map((page) => (
              <Card 
                key={page.id} 
                className="group cursor-pointer bg-card/50 backdrop-blur-xl border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden"
                onClick={() => navigate(`/${page.slug}`)}
              >
                {/* Avatar Section */}
                <div className="relative p-3 sm:p-4 pb-2 flex flex-col items-center">
                  {/* Premium Badge */}
                  {page.is_premium && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] font-semibold shadow-sm">
                        <Crown className="h-2.5 w-2.5" />
                      </div>
                    </div>
                  )}
                  
                  <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-primary/20 shadow-md group-hover:scale-105 transition-transform">
                    <AvatarImage 
                      src={page.avatar_url || ''} 
                      alt={page.title || ''} 
                      loading="lazy"
                      decoding="async"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                      {(page.title || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Page Info */}
                <div className="px-2.5 sm:px-3 pb-2.5 sm:pb-3">
                  <h3 className="font-semibold text-xs sm:text-sm text-center truncate mb-1.5">
                    {page.title || page.slug}
                  </h3>
                  
                  {page.niche && (
                    <div className="flex justify-center mb-2">
                      <Badge variant="secondary" className="text-[9px] sm:text-[10px] px-1.5 py-0">
                        {NICHE_ICONS[page.niche as Niche]} {t(`niches.${page.niche}`, page.niche)}
                      </Badge>
                    </div>
                  )}
                  
                  {/* Stats */}
                  <div className="flex items-center justify-center gap-3 text-[10px] sm:text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Eye className="h-3 w-3" />
                      {page.view_count || 0}
                    </span>
                    <button
                      onClick={(e) => handleLike(e, page.id)}
                      className={`flex items-center gap-0.5 transition-colors hover:text-red-500 ${
                        likedPages.has(page.id) ? 'text-red-500' : ''
                      }`}
                    >
                      <Heart className={`h-3 w-3 ${likedPages.has(page.id) ? 'fill-current' : ''}`} />
                      {page.gallery_likes || 0}
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* CTA button */}
        <div className="text-center">
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate('/gallery')}
            className="rounded-2xl px-6 sm:px-8 py-5 sm:py-6 text-sm sm:text-base font-semibold bg-background/60 backdrop-blur-xl hover:bg-accent border-border/50 hover:border-primary/30 transition-all group"
          >
            {t('landing.gallery.viewAll', 'Explore All Pages')}
            <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </section>
  );
}
