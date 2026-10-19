import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import type { CarouselBlock as CarouselBlockType } from '@/types/page';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { handleKeyboardActivation } from '@/lib/utils/a11y';
import { openExternal } from '@/lib/blocks/safe-href';
import { BLOCK_RADIUS } from '@/lib/appearance/block-appearance';

interface CarouselBlockProps {
  block: CarouselBlockType;
  onClick?: () => void;
}

export const CarouselBlock = memo(function CarouselBlockComponent({ block, onClick }: CarouselBlockProps) {
  const { i18n, t } = useTranslation();
  const title = getI18nText(block.title, i18n.language as SupportedLanguage);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    onSelect();
    api.on('select', onSelect);
    return () => { api.off('select', onSelect); };
  }, [api]);

  const autoplayPlugin = block.autoPlay
    ? Autoplay({ delay: block.interval || 3000, stopOnInteraction: true })
    : undefined;

  const handleImageClick = (link?: string) => {
    if (link) {
      onClick?.();
      openExternal(link);
    }
  };

  if (!block.images || block.images.length === 0) {
    return (
      <Card className="bg-card border-border shadow-sm">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground text-center">
            {t('blocks.carousel.empty', 'No images added to carousel')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    // The grid cell is the card; a second bordered card inside it drew two frames.
    <div className="w-full overflow-hidden" style={{ borderRadius: 'inherit' }}>
      {title && (
        <div className="p-4 sm:p-5 pb-0">
          <h3 className="font-semibold text-base sm:text-lg text-foreground truncate">{title}</h3>
        </div>
      )}
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        plugins={autoplayPlugin ? [autoplayPlugin] : undefined}
        setApi={setApi}
        // Slides are a rounded tile of their own (16px, or the block's own
        // radius when the owner set one); the dots sit below it.
        className="w-full overflow-hidden"
        style={{ borderRadius: block.blockStyle?.borderRadius ? BLOCK_RADIUS[block.blockStyle.borderRadius] : '16px' }}
      >
        <CarouselContent className="-ml-0">
          {block.images.map((image, index) => {
            const alt = getI18nText(image.alt, i18n.language as SupportedLanguage) || `Slide ${index + 1}`;
            return (
              <CarouselItem key={index} className="pl-0">
                {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- role/tabIndex applied when image.link present */}
                <div
                  className="aspect-[16/9] overflow-hidden bg-black/20 cursor-pointer"
                  onClick={image.link ? () => handleImageClick(image.link) : undefined}
                  onKeyDown={image.link ? (event) => handleKeyboardActivation(event, () => handleImageClick(image.link)) : undefined}
                  role={image.link ? 'link' : undefined}
                  tabIndex={image.link ? 0 : undefined}
                >
                  <img
                    src={image.url}
                    alt={alt}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {block.images.length > 1 && (
          <>
            <CarouselPrevious className="left-4 h-10 w-10 glass-button shadow-soft border-hairline" />
            <CarouselNext className="right-4 h-10 w-10 glass-button shadow-soft border-hairline" />
          </>
        )}
      </Carousel>
      {/* Dots indicator for mobile */}
      {block.images.length > 1 && (
        <div className="flex justify-center gap-0.5 py-2">
          {block.images.map((_, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => api?.scrollTo(idx)}
              aria-label={t('blocks.carousel.goTo', 'Слайд {{n}}', { n: idx + 1 })}
              aria-current={idx === current}
              className="flex h-6 w-6 items-center justify-center"
            >
              <span className={idx === current ? 'h-2 w-5 rounded-full bg-foreground transition-all duration-300' : 'h-2 w-2 rounded-full bg-foreground/20 transition-all duration-300'} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
