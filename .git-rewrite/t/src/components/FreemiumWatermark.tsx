import { memo } from 'react';
import { Sparkles } from 'lucide-react';

interface FreemiumWatermarkProps {
  show: boolean;
}

export const FreemiumWatermark = memo(function FreemiumWatermark({ show }: FreemiumWatermarkProps) {
  if (!show) return null;
  
  return (
    <a
      href="/"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
    >
      <Sparkles className="h-4 w-4 text-primary group-hover:animate-pulse" />
      <span className="text-sm font-medium text-foreground">
        Made with <span className="text-primary font-semibold">LinkMAX</span>
      </span>
    </a>
  );
});
