import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import type { CarouselBlock as CarouselBlockType } from '@/types/page';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';

interface CarouselBlockProps {
  block: CarouselBlockType;
  onClick?: () => void;
}

export const CarouselBlock = memo(function CarouselBlockComponent({ block, onClick }: CarouselBlockProps) {
  const { i18n, t } = useTranslation();
  const title = getI18nText(block.title, i18n.language as SupportedLanguage);

  const autoplayPlugin = block.autoPlay
    ? Autoplay({ delay: block.interval || 3000, stopOnInteraction: true })
    : undefined;

  const handleImageClick = (link?: string) => {
    if (link) {
      onClick?.();
      // Delay to ensure tracking request is sent before navigation
      setTimeout(() => {
        window.open(link, '_blank', 'noopener,noreferrer');
      }, 15);
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
    <div className="w-full overflow-hidden rounded-xl bg-card border border-border shadow-sm">
      {title && (
        <div className="p-4 pb-2">
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
      )}
      <Carousel
        opts={{
          align: 'start',
          loop: true,
        }}
        plugins={autoplayPlugin ? [autoplayPlugin] : undefined}
        className="w-full"
      >
        <CarouselContent className="-ml-0">
          {block.images.map((image, index) => {
            const alt = getI18nText(image.alt, i18n.language as SupportedLanguage) || `Slide ${index + 1}`;
            return (
              <CarouselItem key={index} className="pl-0">
                <div
                  className="aspect-[4/3] overflow-hidden bg-muted cursor-pointer"
                  onClick={() => handleImageClick(image.link)}
                >
                  <img
                    src={image.url}
                    alt={alt}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        {block.images.length > 1 && (
          <>
            <CarouselPrevious className="left-2 h-8 w-8" />
            <CarouselNext className="right-2 h-8 w-8" />
          </>
        )}
      </Carousel>
      {/* Dots indicator for mobile */}
      {block.images.length > 1 && (
        <div className="flex justify-center gap-1.5 py-2">
          {block.images.map((_, idx) => (
            <div 
              key={idx} 
              className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"
            />
          ))}
        </div>
      )}
    </div>
  );
});
