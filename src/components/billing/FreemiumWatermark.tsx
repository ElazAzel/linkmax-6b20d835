import { memo, useState, useEffect } from 'react';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';

interface FreemiumWatermarkProps {
  show: boolean;
}

export const FreemiumWatermark = memo(function FreemiumWatermark({ show }: FreemiumWatermarkProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;

    const onScroll = () => {
      // Show after scrolling 150px
      if (window.scrollY > 150) {
        setVisible(true);
      }
    };

    // Also show after 3s as fallback for short pages
    const timer = setTimeout(() => setVisible(true), 3000);

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
  }, [show]);

  if (!show) return null;

  return (
    <a
      href="https://lnkmx.my"
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-sm border border-border rounded-full shadow-lg hover:shadow-xl transition-all duration-700 hover:scale-105 group ${
        visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <Sparkles className="h-4 w-4 text-primary group-hover:animate-pulse" />
      <span className="text-sm font-medium text-foreground">
        Made with <span className="text-primary font-semibold">lnkmx</span>
      </span>
    </a>
  );
});
