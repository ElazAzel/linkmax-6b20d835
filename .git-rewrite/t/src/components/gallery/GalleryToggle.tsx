import { useTranslation } from 'react-i18next';
import { Users, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useGalleryStatus } from '@/hooks/useGallery';

interface GalleryToggleProps {
  userId: string | undefined;
}

export function GalleryToggle({ userId }: GalleryToggleProps) {
  const { t } = useTranslation();
  const { isInGallery, loading, toggle } = useGalleryStatus(userId);

  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-card/50 border border-border/30">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-primary" />
        <div>
          <Label htmlFor="gallery-toggle" className="text-sm font-medium">
            {t('gallery.shareToGallery', 'Share to Gallery')}
          </Label>
          <p className="text-xs text-muted-foreground">
            {t('gallery.shareDescription', 'Show your page in the community gallery')}
          </p>
        </div>
      </div>
      
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Switch 
          id="gallery-toggle"
          checked={isInGallery} 
          onCheckedChange={toggle}
          disabled={!userId}
        />
      )}
    </div>
  );
}
