import { useTranslation } from 'react-i18next';
import type { MapBlock as MapBlockType } from '@/types/page';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';
import { getAnimationClass, getAnimationStyle } from '@/lib/animation-utils';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';

interface MapBlockProps {
  block: MapBlockType;
}

export function MapBlock({ block }: MapBlockProps) {
  const { i18n } = useTranslation();
  const title = getTranslatedString(block.title, i18n.language as SupportedLanguage);
  const address = getTranslatedString(block.address, i18n.language as SupportedLanguage);

  const heightClasses = {
    small: 'h-48',
    medium: 'h-64',
    large: 'h-96',
  };

  const height = heightClasses[block.height || 'medium'];
  
  const paddingMap = { none: '', sm: 'p-2', md: 'p-4', lg: 'p-6', xl: 'p-8' };
  const marginMap = { none: '', sm: 'my-2', md: 'my-4', lg: 'my-6', xl: 'my-8' };

  return (
    <div 
      className={cn(
        "w-full space-y-3",
        block.blockStyle?.padding && paddingMap[block.blockStyle.padding],
        block.blockStyle?.margin && marginMap[block.blockStyle.margin],
        getAnimationClass(block.blockStyle)
      )}
      style={getAnimationStyle(block.blockStyle)}
    >
      {title && (
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}
      
      {address && (
        <p className="text-sm text-muted-foreground">{address}</p>
      )}

      <div 
        className={cn(
          "w-full rounded-lg overflow-hidden border border-border",
          height
        )}
      >
        <iframe
          src={block.embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={title || 'Map'}
        />
      </div>
    </div>
  );
}
