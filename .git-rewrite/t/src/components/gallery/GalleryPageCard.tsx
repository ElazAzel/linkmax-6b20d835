import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Eye, ExternalLink, Share2, Check, Calendar, Crown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import type { GalleryPage } from '@/services/gallery';
import { NICHE_ICONS, type Niche } from '@/lib/niches';
import { PagePreview } from './PagePreview';

interface GalleryPageCardProps {
  page: GalleryPage;
  onLike: (pageId: string) => Promise<void>;
  isLiked: boolean;
  featured?: boolean;
}

export function GalleryPageCard({ page, onLike, isLiked, featured = false }: GalleryPageCardProps) {
  const { t } = useTranslation();
  const [isLiking, setIsLiking] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await onLike(page.id);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/${page.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(t('gallery.linkCopied', 'Link copied!'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('gallery.copyError', 'Failed to copy'));
    }
  };

  const featuredDate = page.gallery_featured_at 
    ? new Date(page.gallery_featured_at).toLocaleDateString()
    : null;

  return (
    <Card 
      className={`
        group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1
        ${featured 
          ? 'bg-gradient-to-br from-primary/10 via-card/80 to-card border-primary/30' 
          : 'bg-card/50 backdrop-blur-lg border-border/30'
        }
      `}
    >
      {/* Page Preview Screenshot */}
      <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" className="block">
        <PagePreview
          slug={page.slug}
          title={page.title}
          avatarUrl={page.avatar_url}
          previewUrl={page.preview_url}
          className="aspect-[4/3] w-full"
        />
      </a>

      <CardContent className="p-4">
        {/* Header with title and badges */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-foreground truncate">
                {page.title || page.slug}
              </h3>
              {page.is_premium && (
                <Crown className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              @{page.slug}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {featured && (
              <Badge variant="default" className="bg-primary/90 text-xs">
                ⭐ {t('gallery.featured', 'Featured')}
              </Badge>
            )}
            {page.niche && page.niche !== 'other' && (
              <Badge variant="outline" className="text-xs bg-card/50">
                {NICHE_ICONS[page.niche as Niche] || '📌'} {t(`niches.${page.niche}`, page.niche)}
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {page.description && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {page.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
            <span className="font-medium">{page.gallery_likes || 0}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            <span>{page.view_count || 0}</span>
          </div>
          {featuredDate && (
            <div className="flex items-center gap-1.5 ml-auto text-xs">
              <Calendar className="h-3 w-3" />
              <span>{featuredDate}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/30">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isLiked ? "secondary" : "outline"}
                size="sm"
                className="flex-1 gap-2"
                onClick={handleLike}
                disabled={isLiking}
              >
                <Heart 
                  className={`h-4 w-4 transition-all ${
                    isLiked ? 'fill-red-500 text-red-500 scale-110' : ''
                  }`} 
                />
                {isLiked ? t('gallery.unlike', 'Unlike') : t('gallery.like', 'Like')}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isLiked 
                ? t('gallery.clickToUnlike', 'Click to remove like')
                : t('gallery.likeTooltip', 'Show some love!')
              }
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleShare}
              >
                {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('gallery.shareTooltip', 'Copy page link')}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                asChild
              >
                <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('gallery.viewPage', 'Open page')}
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}
