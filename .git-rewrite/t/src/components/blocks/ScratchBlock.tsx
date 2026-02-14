import { memo, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown } from 'lucide-react';
import type { ScratchBlock as ScratchBlockType } from '@/types/page';
import { Card } from '@/components/ui/card';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';

interface ScratchBlockProps {
  block: ScratchBlockType;
}

export const ScratchBlock = memo(function ScratchBlock({ block }: ScratchBlockProps) {
  const { i18n, t } = useTranslation();
  const [isRevealed, setIsRevealed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScratching, setIsScratching] = useState(false);

  const title = getI18nText(block.title, i18n.language as SupportedLanguage);
  const revealText = getI18nText(block.revealText, i18n.language as SupportedLanguage);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctx.fillStyle = block.backgroundColor || '#C0C0C0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#A0A0A0';
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.fillRect(x, y, 2, 2);
    }

    ctx.fillStyle = '#808080';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('scratch.scratchHere', '👆 Scratch here'), canvas.width / 2, canvas.height / 2);
  }, [block.backgroundColor]);

  const scratch = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !isScratching) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let transparent = 0;
    
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) transparent++;
    }

    const percentScratched = (transparent / (pixels.length / 4)) * 100;
    if (percentScratched > 50) {
      setIsRevealed(true);
    }
  };

  return (
    <Card className="p-5 sm:p-6 bg-card border-border shadow-sm rounded-xl">
      {title && (
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-lg">{title}</h3>
          <Crown className="h-4 w-4 text-primary" />
        </div>
      )}
      <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-border">
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10">
          <div className="text-center p-6">
            <div className={`text-2xl font-bold transition-all duration-500 ${
              isRevealed ? 'scale-110 opacity-100' : 'scale-90 opacity-50'
            }`}>
              {revealText}
            </div>
          </div>
        </div>
        
        {!isRevealed && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full cursor-pointer touch-none"
            onMouseDown={() => setIsScratching(true)}
            onMouseUp={() => setIsScratching(false)}
            onMouseLeave={() => setIsScratching(false)}
            onMouseMove={scratch}
            onTouchStart={() => setIsScratching(true)}
            onTouchEnd={() => setIsScratching(false)}
            onTouchMove={scratch}
          />
        )}
      </div>
      <p className="text-xs text-center text-muted-foreground mt-2">
        {isRevealed ? t('scratch.revealed', '🎉 Revealed!') : t('scratch.hint', 'Scratch the layer to reveal a surprise')}
      </p>
    </Card>
  );
});
