import { useState, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ZoomIn, ZoomOut, Move, RotateCcw, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ImageCropperProps {
  imageUrl: string;
  open: boolean;
  onClose: () => void;
  onSave: (croppedDataUrl: string) => void;
  aspectRatio?: number; // 1 for square (avatar), 16/9 for cover
  shape?: 'circle' | 'rectangle';
}

export function ImageCropper({
  imageUrl,
  open,
  onClose,
  onSave,
  aspectRatio = 1,
  shape = 'circle',
}: ImageCropperProps) {
  const { t } = useTranslation();
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 50, posY: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = (e.clientX - dragStartRef.current.x) / 2;
    const deltaY = (e.clientY - dragStartRef.current.y) / 2;
    
    setPosition({
      x: Math.max(0, Math.min(100, dragStartRef.current.posX - deltaX / zoom)),
      y: Math.max(0, Math.min(100, dragStartRef.current.posY - deltaY / zoom)),
    });
  }, [isDragging, zoom]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      posX: position.x,
      posY: position.y,
    };
  };

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const deltaX = (touch.clientX - dragStartRef.current.x) / 2;
    const deltaY = (touch.clientY - dragStartRef.current.y) / 2;
    
    setPosition({
      x: Math.max(0, Math.min(100, dragStartRef.current.posX - deltaX / zoom)),
      y: Math.max(0, Math.min(100, dragStartRef.current.posY - deltaY / zoom)),
    });
  }, [isDragging, zoom]);

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 50, y: 50 });
  };

  const handleSave = () => {
    // Create canvas and draw the cropped image
    const canvas = document.createElement('canvas');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const outputSize = shape === 'circle' ? 512 : aspectRatio >= 1 ? 1200 : 800;
      const outputHeight = shape === 'circle' ? outputSize : Math.round(outputSize / aspectRatio);
      
      canvas.width = outputSize;
      canvas.height = outputHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate source dimensions
      const sourceWidth = img.width / zoom;
      const sourceHeight = img.height / zoom;
      const sourceX = (img.width - sourceWidth) * (position.x / 100);
      const sourceY = (img.height - sourceHeight) * (position.y / 100);

      // Draw image
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        outputSize,
        outputHeight
      );

      // Convert to data URL
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onSave(dataUrl);
    };
    
    img.src = imageUrl;
  };

  const previewStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: `${position.x}% ${position.y}%`,
    transform: `scale(${zoom})`,
    transformOrigin: `${position.x}% ${position.y}%`,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Move className="h-4 w-4" />
            {t('imageCropper.title', 'Настройка изображения')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview area */}
          <div
            ref={containerRef}
            className={`relative mx-auto overflow-hidden bg-muted border-2 border-dashed border-border ${
              shape === 'circle' ? 'rounded-full w-48 h-48' : 'rounded-xl w-full aspect-video'
            }`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
          >
            <img
              src={imageUrl}
              alt="Preview"
              style={previewStyle}
              draggable={false}
            />
          </div>

          {/* Zoom control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm flex items-center gap-2">
                <ZoomIn className="h-4 w-4" />
                {t('imageCropper.zoom', 'Масштаб')}
              </Label>
              <span className="text-sm text-muted-foreground">{Math.round(zoom * 100)}%</span>
            </div>
            <div className="flex items-center gap-3">
              <ZoomOut className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[zoom]}
                onValueChange={([value]) => setZoom(value)}
                min={1}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <ZoomIn className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Hint */}
          <p className="text-xs text-muted-foreground text-center">
            {t('imageCropper.hint', 'Перетащите изображение для позиционирования')}
          </p>
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('imageCropper.reset', 'Сбросить')}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            {t('actions.cancel', 'Отмена')}
          </Button>
          <Button onClick={handleSave} className="flex-1">
            <Check className="h-4 w-4 mr-2" />
            {t('actions.save', 'Сохранить')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
