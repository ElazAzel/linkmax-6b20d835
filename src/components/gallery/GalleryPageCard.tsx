import { useTranslation } from 'react-i18next';
import Heart from 'lucide-react/dist/esm/icons/heart';
import Copy from 'lucide-react/dist/esm/icons/copy';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Eye from 'lucide-react/dist/esm/icons/eye';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import type { GalleryPage } from '@/services/gallery';
import { PagePreview } from './PagePreview';
import { NICHE_ICONS, type Niche } from '@/lib/niches';
import { useState } from 'react';

// Unified interface supporting both old and new usage
interface GalleryPageCardProps {
  page: GalleryPage;
  // New props (simplified)
  onCopy?: () => void;
  onView?: () => void;
  onLike?: (pageId: string) => Promise<void> | void;

  // Legacy props (compat)
  isLiked?: boolean;
  featured?: boolean;
}

export function GalleryPageCard({
  page,
  onCopy,
  onView,
  onLike,
  isLiked = false,
  featured = false
}: GalleryPageCardProps) {
  const { t } = useTranslation();
  const [internalLikeState, setInternalLikeState] = useState(isLiked);
  const [isLiking, setIsLiking] = useState(false);

  // Sync internal state with prop if provided
  if (isLiked !== internalLikeState && !isLiking) {
    setInternalLikeState(isLiked);
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLiking || !onLike) return;

    setIsLiking(true);
    try {
      // Optimistic update
      setInternalLikeState(!internalLikeState);

      const result = onLike(page.id);
      if (result instanceof Promise) {
        await result;
      }
    } catch {
      // Revert on error
      setInternalLikeState(!internalLikeState);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCopy) {
      onCopy();
    } else {
      // Fallback copy logic if no handler provided
      navigator.clipboard.writeText(`${window.location.origin}/${page.slug}`);
    }
  };

  const handleView = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onView) {
      onView();
    } else {
      window.open(`/${page.slug}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card
      variant="borderless"
      className={`
        group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer active:scale-[0.98]
        ${featured
          ? 'bg-gradient-to-br from-primary/10 via-card/80 to-card'
          : 'bg-card/50 backdrop-blur-lg'
        }
      `}
      onClick={(e) => handleView()}
    >
      {/* Page Preview Screenshot */}
      <div className="aspect-[9/16] w-full relative overflow-hidden bg-gradient-to-br from-primary/10 to-violet-500/10 transition-transform duration-500 group-hover:scale-[1.02]">
        <PagePreview
          slug={page.slug}
          title={page.title}
          avatarUrl={page.avatar_url}
          previewUrl={page.preview_url}
          className="w-full h-full object-cover"
        />

        {page.is_premium && (
          <div className="absolute top-2 right-2 z-10">
            <Crown className="h-4 w-4 text-amber-500 drop-shadow-md" />
          </div>
        )}

        {/* Hover overlay for desktop */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="h-8"
            onClick={(e) => { e.stopPropagation(); handleView(e); }}
          >
            <Eye className="w-4 h-4 mr-1.5" />
            {t('common.view', 'View')}
          </Button>
        </div>
      </div>

      <CardContent className="p-3">
        {/* Header with title and badges */}
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-6 w-6 rounded-md ring-1 ring-border/50">
            <AvatarImage src={page.avatar_url || undefined} />
            <AvatarFallback className="rounded-md text-xs font-bold bg-primary/10 text-primary">
              {page.title?.charAt(0) || 'L'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm truncate">{page.title || t('gallery.untitled', 'Untitled')}</span>
              {featured && (
                <Badge variant="default" className="bg-primary/90 text-[10px] h-4 px-1">
                  ⭐
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Stats & Actions */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLike}
                  className="flex items-center gap-1 hover:text-red-500 transition-colors group/like"
                  disabled={isLiking}
                >
                  <Heart className={`h-3.5 w-3.5 transition-colors ${internalLikeState ? 'fill-red-500 text-red-500' : 'group-hover/like:text-red-500'}`} />
                  <span className={internalLikeState ? 'text-red-500 font-medium' : ''}>{page.gallery_likes || 0}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                {internalLikeState ? t('gallery.unlike', 'Unlike') : t('gallery.like', 'Like')}
              </TooltipContent>
            </Tooltip>

            <div className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {page.view_count || 0}
            </div>
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-lg hover:bg-primary/10 hover:text-primary ml-auto"
                onClick={handleCopy}
              >
                <Copy className="h-3.5 w-3.5" />
                <span className="sr-only">{t('common.copy', 'Copy')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('common.copy', 'Copy Link')}
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper component for layout compatibility if needed
function CardContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={className}>{children}</div>;
}
