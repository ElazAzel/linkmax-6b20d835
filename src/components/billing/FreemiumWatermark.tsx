import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import { getAppDomain } from '@/lib/utils/url-helpers';

interface FreemiumWatermarkProps {
  show: boolean;
}

export const FreemiumWatermark = memo(function FreemiumWatermark({ show }: FreemiumWatermarkProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;

    const onScroll = () => {
      if (window.scrollY > 150) {
        setVisible(true);
      }
    };

    // Show after 2s as fallback for short pages
    const timer = setTimeout(() => setVisible(true), 2000);

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
  }, [show]);

  if (!show) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href={getAppDomain()}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-5 py-2.5 bg-background/90 backdrop-blur-md border border-border/50 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-shadow group"
        >
          <Sparkles className="h-4 w-4 text-primary group-hover:animate-pulse" />
          <span className="text-sm font-medium text-foreground">
            Made with <span className="text-primary font-semibold">lnkmx</span>
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  );
});
