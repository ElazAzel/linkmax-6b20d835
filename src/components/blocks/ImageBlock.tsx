import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import ImageOff from 'lucide-react/dist/esm/icons/image-off';
import { useRenderContext } from '@/contexts/RenderContext';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils/utils';
import { handleKeyboardActivation } from '@/lib/utils/a11y';
import { hasCustomBlockContainer } from '@/lib/blocks/block-styling';
import type { ImageBlock as ImageBlockType } from '@/types/page';
import { getImagePlacementStyle } from '@/lib/appearance/image-placement';
import { imageAltText, openExternal } from '@/lib/blocks/safe-href';

interface ImageBlockProps {
  block: ImageBlockType;
  onClick?: () => void;
}

export const ImageBlock = memo(function ImageBlockComponent({ block, onClick }: ImageBlockProps) {
  const { t, i18n } = useTranslation();
  const renderMode = useRenderContext();
  const [failed, setFailed] = useState(false);
  // A corrected URL gets a fresh try (editing keeps the same component).
  useEffect(() => setFailed(false), [block.url]);
  const alt = imageAltText(getI18nText(block.alt, i18n.language as SupportedLanguage), block.link);
  const caption = getI18nText(block.caption, i18n.language as SupportedLanguage);

  const hasLink = Boolean(block.link);
  // When the user paints their own container (bg/border/radius/shadow) via
  // the style panel, drop our default decorative frame so we don't render
  // two nested frames.
  const isNaked = hasCustomBlockContainer(block.blockStyle);

  // Every image spans the block: cropped to fill a tile, or full width at its
  // own aspect ratio. Circle, polaroid, letterboxed "contain", stretch and
  // tile modes left narrow or framed pictures, so old values render this way.
  const imageClass = isNaked ? '' : 'rounded-2xl qb-card border border-hairline';

  const handleClick = () => {
    if (block.link) {
      onClick?.();
      openExternal(block.link);
    }
  };

  // A missing or broken image: visitors see nothing instead of the browser's
  // broken-image box; the owner sees a calm placeholder to fix it.
  if (!block.url || failed) {
    if (renderMode === 'live') return null;
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-hairline bg-muted/40 text-muted-foreground">
        <ImageOff className="h-6 w-6" aria-hidden="true" />
        <span className="text-xs">{t('blocks.imageUnavailable', 'Изображение не загрузилось')}</span>
      </div>
    );
  }


  return (
    <div className="w-full flex flex-col">
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- role/tabIndex applied when interactive */}
      <div
        className={cn(
          "relative group w-full",
          hasLink && 'cursor-pointer'
        )}
        onClick={hasLink ? handleClick : undefined}
        onKeyDown={hasLink ? (event) => handleKeyboardActivation(event, handleClick) : undefined}
        role={hasLink ? 'link' : undefined}
        tabIndex={hasLink ? 0 : undefined}
      >
        <div className={cn(
          "relative overflow-hidden h-full w-full",
          imageClass,
          hasLink && 'hover:shadow-lg transition-shadow duration-300'
        )}>
          <img
            src={block.url}
            alt={alt}
            className={cn(
              "block w-full h-full object-cover",
              hasLink && 'transition-all duration-300 group-hover:scale-[1.02] group-hover:brightness-90'
            )}
            loading="lazy"
            onError={() => setFailed(true)}
            style={getImagePlacementStyle(block)}
          />

          {/* Link indicator overlay */}
          {hasLink && (
            <>
              {/* Gradient overlay on hover */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                'rounded-xl sm:rounded-2xl'
              )} />

              {/* External link icon */}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 p-1.5 sm:p-2 bg-background/90  rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-10">
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 text-foreground" />
              </div>
            </>
          )}
        </div>
      </div>
      {caption && (
        <p className={cn(
          "text-xs sm:text-sm text-muted-foreground mt-2 sm:mt-3 break-words hyphens-auto",
          // The grid cell is the card; without its own padding the caption sat
          // flush on the card edge (and was clipped in half-width tiles).
          !(block.blockStyle?.padding && block.blockStyle.padding !== 'none') && 'px-4 pb-3 sm:px-5',
          block.alignment === 'center' ? 'text-center' : block.alignment === 'right' ? 'text-right' : 'text-left'
        )}>
          {caption}
        </p>
      )}
    </div>
  );
});
