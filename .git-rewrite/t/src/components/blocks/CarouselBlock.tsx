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
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';

interface CarouselBlockProps {
  block: CarouselBlockType;
}

export const CarouselBlock = memo(function CarouselBlockComponent({ block }: CarouselBlockProps) {
  const { i18n, t } = useTranslation();
  const title = getTranslatedString(block.title, i18n.language as SupportedLanguage);

  const autoplayPlugin = block.autoPlay
    ? Autoplay({ delay: block.interval || 3000, stopOnInteraction: true })
    : undefined;

  const handleImageClick = (link?: string) => {
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer');
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
    <Card className="overflow-hidden bg-card border-border shadow-sm">
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <Carousel
          opts={{
            align: 'start',
            loop: true,
          }}
          plugins={autoplayPlugin ? [autoplayPlugin] : undefined}
          className="w-full"
        >
          <CarouselContent>
          {block.images.map((image, index) => {
              const alt = getTranslatedString(image.alt, i18n.language as SupportedLanguage) || `Slide ${index + 1}`;
              return (
                <CarouselItem key={index}>
                  <div
                    className="aspect-video overflow-hidden bg-muted cursor-pointer"
                    onClick={() => handleImageClick(image.link)}
                  >
                    <img
                      src={image.url}
                      alt={alt}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          {block.images.length > 1 && (
            <>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </>
          )}
        </Carousel>
      </CardContent>
    </Card>
  );
});
