import { useState, useMemo } from 'react';
import type { GalleryPage } from '@/services/gallery';
import type { SortOption } from '@/components/gallery/GalleryFilters';

export function useGalleryFilters(pages: GalleryPage[]) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  const filteredPages = useMemo(() => {
    let result = [...pages];

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (page) =>
          page.title?.toLowerCase().includes(searchLower) ||
          page.slug.toLowerCase().includes(searchLower) ||
          page.description?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => (b.gallery_likes || 0) - (a.gallery_likes || 0));
        break;
      case 'trending':
        // Trending = recent + popular (weighted score)
        result.sort((a, b) => {
          const now = Date.now();
          const aDate = a.gallery_featured_at ? new Date(a.gallery_featured_at).getTime() : 0;
          const bDate = b.gallery_featured_at ? new Date(b.gallery_featured_at).getTime() : 0;
          const aAge = (now - aDate) / (1000 * 60 * 60 * 24); // days
          const bAge = (now - bDate) / (1000 * 60 * 60 * 24);
          
          // Score: likes / (age + 1)^0.5
          const aScore = (a.gallery_likes || 0) / Math.pow(aAge + 1, 0.5);
          const bScore = (b.gallery_likes || 0) / Math.pow(bAge + 1, 0.5);
          
          return bScore - aScore;
        });
        break;
      case 'recent':
      default:
        result.sort((a, b) => {
          const aDate = a.gallery_featured_at ? new Date(a.gallery_featured_at).getTime() : 0;
          const bDate = b.gallery_featured_at ? new Date(b.gallery_featured_at).getTime() : 0;
          return bDate - aDate;
        });
    }

    return result;
  }, [pages, search, sortBy]);

  // Get featured pages (top 5 by likes)
  const featuredPages = useMemo(() => {
    return [...pages]
      .sort((a, b) => (b.gallery_likes || 0) - (a.gallery_likes || 0))
      .slice(0, 5);
  }, [pages]);

  return {
    search,
    setSearch,
    sortBy,
    setSortBy,
    filteredPages,
    featuredPages,
    totalCount: pages.length,
  };
}
