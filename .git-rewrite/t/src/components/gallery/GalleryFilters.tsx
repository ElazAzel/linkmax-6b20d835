import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, TrendingUp, Clock, Heart, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

export type SortOption = 'recent' | 'popular' | 'trending';

interface GalleryFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  totalCount: number;
}

const SORT_OPTIONS: { value: SortOption; labelKey: string; icon: typeof TrendingUp }[] = [
  { value: 'recent', labelKey: 'gallery.sortRecent', icon: Clock },
  { value: 'popular', labelKey: 'gallery.sortPopular', icon: Heart },
  { value: 'trending', labelKey: 'gallery.sortTrending', icon: TrendingUp },
];

export function GalleryFilters({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  totalCount,
}: GalleryFiltersProps) {
  const { t } = useTranslation();

  const currentSort = SORT_OPTIONS.find(o => o.value === sortBy) || SORT_OPTIONS[0];
  const CurrentIcon = currentSort.icon;

  return (
    <div className="space-y-4">
      {/* Search and sort row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('gallery.searchPlaceholder', 'Search pages...')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 bg-card/50 border-border/30"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2 bg-card/50 border-border/30">
              <CurrentIcon className="h-4 w-4" />
              <span className="hidden sm:inline">
                {t(currentSort.labelKey, currentSort.value)}
              </span>
              <SlidersHorizontal className="h-4 w-4 sm:hidden" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{t('gallery.sortBy', 'Sort by')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SORT_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={sortBy === option.value ? 'bg-primary/10' : ''}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {t(option.labelKey, option.value)}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        <span>
          {t('gallery.totalPages', '{{count}} pages in gallery', { count: totalCount })}
        </span>
        {search && (
          <Badge variant="secondary" className="ml-auto">
            {t('gallery.searchResults', 'Filtering by "{{search}}"', { search })}
          </Badge>
        )}
      </div>
    </div>
  );
}
