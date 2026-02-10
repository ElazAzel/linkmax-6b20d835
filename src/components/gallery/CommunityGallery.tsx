import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Loader2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGallery } from '@/hooks/useGallery';
import { useGalleryFilters } from '@/hooks/useGalleryFilters';
import { GalleryFilters } from './GalleryFilters';
import { GalleryPageCard } from './GalleryPageCard';
import { FeaturedPages } from './FeaturedPages';
import { NicheFilter } from './NicheFilter';

interface CommunityGalleryProps {
  compact?: boolean;
  maxItems?: number;
  showFilters?: boolean;
  showFeatured?: boolean;
}

export function CommunityGallery({
  compact = false,
  maxItems,
  showFilters = true,
  showFeatured = true,
}: CommunityGalleryProps) {
  const { t } = useTranslation();
  const { pages, loading, likePage, unlikePage, selectedNiche, setSelectedNiche, nicheCounts } = useGallery();
  const [likedPages, setLikedPages] = useState<Set<string>>(() => {
    const storedLikes = localStorage.getItem('linkmax_liked_pages');
    if (storedLikes) {
      try {
        return new Set(JSON.parse(storedLikes));
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  const {
    search,
    setSearch,
    sortBy,
    setSortBy,
    filteredPages,
    featuredPages,
    totalCount,
  } = useGalleryFilters(pages);

  const displayPages = maxItems ? filteredPages.slice(0, maxItems) : filteredPages;

  const handleToggleLike = useCallback(async (pageId: string) => {
    const isCurrentlyLiked = likedPages.has(pageId);

    if (isCurrentlyLiked) {
      // Unlike
      const newLikedPages = new Set(likedPages);
      newLikedPages.delete(pageId);
      setLikedPages(newLikedPages);
      localStorage.setItem('linkmax_liked_pages', JSON.stringify([...newLikedPages]));
      await unlikePage(pageId);
    } else {
      // Like
      const newLikedPages = new Set(likedPages).add(pageId);
      setLikedPages(newLikedPages);
      localStorage.setItem('linkmax_liked_pages', JSON.stringify([...newLikedPages]));
      await likePage(pageId);
    }
  }, [likedPages, likePage, unlikePage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (pages.length === 0 && !selectedNiche) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">{t('gallery.empty', 'No pages yet')}</h3>
        <p className="text-muted-foreground">
          {t('gallery.emptyDescription', 'Be the first to share your page!')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Niche filter */}
      {showFilters && !compact && (
        <NicheFilter
          selectedNiche={selectedNiche}
          onNicheChange={setSelectedNiche}
          nicheCounts={nicheCounts}
        />
      )}

      {/* Featured carousel (only on full view and no niche selected) */}
      {showFeatured && !compact && !selectedNiche && featuredPages.length > 0 && (
        <FeaturedPages
          pages={featuredPages}
          onLike={handleToggleLike}
          likedPages={likedPages}
        />
      )}

      {/* Search and sort filters */}
      {showFilters && !compact && (
        <GalleryFilters
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortChange={setSortBy}
          totalCount={totalCount}
        />
      )}

      {/* Grid */}
      {filteredPages.length === 0 ? (
        <div className="text-center py-20 px-4 border-2 border-dashed border-muted rounded-3xl bg-muted/30">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">{t('gallery.empty', 'Be the first here!')}</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {t('gallery.emptyDescription', 'This niche is waiting for a star. Create your page and get featured.')}
          </p>
          <Button onClick={() => window.location.href = '/auth'} size="lg" className="rounded-full shadow-lg hover:shadow-primary/20">
            {t('gallery.createPage', 'Create Page')}
          </Button>
        </div>
      ) : (
        <div className={
          compact
            ? 'space-y-3'
            : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6'
        }>
          {displayPages.map((page) => (
            <GalleryPageCard
              key={page.id}
              page={page}
              onLike={handleToggleLike}
              isLiked={likedPages.has(page.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
