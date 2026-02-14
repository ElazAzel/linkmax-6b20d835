import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { BeforeAfterBlock as BeforeAfterBlockType } from '@/types/page';
import { Card, CardContent } from '@/components/ui/card';
import { getTranslatedString } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils';

interface BeforeAfterBlockProps {
  block: BeforeAfterBlockType;
}

export const BeforeAfterBlock = React.memo(function BeforeAfterBlock({ block }: BeforeAfterBlockProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as 'ru' | 'en' | 'kk';
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const title = block.title ? getTranslatedString(block.title, currentLang) : '';
  const beforeLabel = block.beforeLabel 
    ? getTranslatedString(block.beforeLabel, currentLang) 
    : t('blocks.beforeAfter.before', 'До');
  const afterLabel = block.afterLabel 
    ? getTranslatedString(block.afterLabel, currentLang) 
    : t('blocks.beforeAfter.after', 'После');

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    handleMove(e.clientX);
  }, [handleMove]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    handleMove(e.clientX);
  }, [handleMove]);

  if (!block.beforeImage || !block.afterImage) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center text-muted-foreground">
          {t('blocks.beforeAfter.noImages', 'Добавьте изображения')}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-3">
      {title && (
        <h3 className="text-xl font-semibold text-center">{title}</h3>
      )}
      
      <div 
        ref={containerRef}
        className="relative w-full aspect-[4/3] rounded-xl overflow-hidden cursor-ew-resize select-none"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onClick={handleClick}
      >
        {/* After Image (Background) */}
        <img
          src={block.afterImage}
          alt={afterLabel}
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        
        {/* Before Image (Clipped) */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={block.beforeImage}
            alt={beforeLabel}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ 
              width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%',
              maxWidth: 'none'
            }}
            draggable={false}
          />
        </div>
        
        {/* Slider Line */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-background shadow-lg z-10"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          {/* Handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-background rounded-full shadow-lg flex items-center justify-center border border-border">
            <div className="flex gap-0.5">
              <div className="w-0.5 h-4 bg-muted-foreground rounded" />
              <div className="w-0.5 h-4 bg-muted-foreground rounded" />
            </div>
          </div>
        </div>
        
        {/* Labels */}
        <div className="absolute bottom-3 left-3 px-2 py-1 bg-background/80 backdrop-blur-sm text-foreground text-sm rounded border border-border">
          {beforeLabel}
        </div>
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-background/80 backdrop-blur-sm text-foreground text-sm rounded border border-border">
          {afterLabel}
        </div>
      </div>
    </div>
  );
});
