import { useTranslation } from 'react-i18next';
import type { MapBlock as MapBlockType } from '@/types/page';
import { cn } from '@/lib/utils';
import { MapPin } from 'lucide-react';
import { getAnimationClass, getAnimationStyle } from '@/lib/animation-utils';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { useMemo } from 'react';

interface MapBlockProps {
  block: MapBlockType;
}

export function MapBlock({ block }: MapBlockProps) {
  const { t, i18n } = useTranslation();
  const address = getI18nText(block.address, i18n.language as SupportedLanguage);

  const paddingMap = { none: '', sm: 'p-2', md: 'p-4', lg: 'p-6', xl: 'p-8' };
  const marginMap = { none: '', sm: 'my-2', md: 'my-4', lg: 'my-6', xl: 'my-8' };

  const embedUrl = useMemo(() => {
    if (!address) return '';
    const encodedAddress = encodeURIComponent(address);
    return `https://maps.google.com/maps?q=${encodedAddress}&z=15&ie=UTF8&iwloc=&output=embed`;
  }, [address]);

  if (!address) {
    return (
      <div className="w-full h-40 sm:h-48 flex items-center justify-center bg-muted rounded-xl">
      <div className="text-center text-muted-foreground">
          <MapPin className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs sm:text-sm">{t('blocks.map.noAddress', 'Укажите адрес')}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "w-full",
        block.blockStyle?.padding && paddingMap[block.blockStyle.padding],
        block.blockStyle?.margin && marginMap[block.blockStyle.margin],
        getAnimationClass(block.blockStyle)
      )}
      style={getAnimationStyle(block.blockStyle)}
    >
      <div className="w-full h-48 sm:h-64 rounded-xl overflow-hidden border border-border">
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Map"
        />
      </div>
    </div>
  );
}
