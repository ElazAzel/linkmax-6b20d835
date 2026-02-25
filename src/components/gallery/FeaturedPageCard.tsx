import { useTranslation } from 'react-i18next';
import Heart from 'lucide-react/dist/esm/icons/heart';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Copy from 'lucide-react/dist/esm/icons/copy';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import Crown from 'lucide-react/dist/esm/icons/crown';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { GalleryPage } from '@/services/gallery';

interface FeaturedPageCardProps {
    page: GalleryPage;
    onCopy: () => void;
    onView: () => void;
}

export function FeaturedPageCard({ page, onCopy, onView }: FeaturedPageCardProps) {
    const { t } = useTranslation();

    return (
        <Card className="w-64 shrink-0 overflow-hidden bg-card/50 border-border/30">
            {/* Preview image */}
            <div className="h-32 bg-gradient-to-br from-primary/20 to-violet-500/20 relative group">
                {page.preview_url ? (
                    <img
                        src={page.preview_url}
                        alt={page.title || 'Page Preview'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        decoding="async"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary/20">
                        <Crown className="w-12 h-12 opacity-20" />
                    </div>
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
                    <Avatar className="h-8 w-8 rounded-lg ring-1 ring-border/50">
                        <AvatarImage src={page.avatar_url || undefined} />
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
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
                            onClick={(e) => { e.stopPropagation(); onCopy(); }}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
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
