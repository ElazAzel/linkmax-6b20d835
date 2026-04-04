import { memo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Crown from 'lucide-react/dist/esm/icons/crown';
import { getAppDomain } from '@/lib/utils/url-helpers';
import { useTranslation } from 'react-i18next';

interface FreemiumWatermarkProps {
  show: boolean;
  slug?: string;
}

export const FreemiumWatermark = memo(function FreemiumWatermark({ show, slug }: FreemiumWatermarkProps) {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

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
          href={slug ? `${getAppDomain()}/from/${slug}` : getAppDomain()}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }}
          animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
          exit={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="fixed bottom-4 left-1/2 z-40 flex items-center gap-2.5 px-5 py-2.5 bg-black/60 dark:bg-white/10 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-95 transition-all duration-300 group overflow-hidden"
        >
          {/* Liquid Glass Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
          
          <Crown className="h-4 w-4 text-white/90 group-hover:text-yellow-400 transition-colors drop-shadow-md z-10" />
          <span className="text-[13px] font-medium text-white/95 tracking-wide z-10 flex gap-1.5 items-center">
            {t('publicPage.poweredBy', 'Powered by')} <strong className="font-bold opacity-100">LinkMAX</strong>
          </span>
        </motion.a>
      )}
    </AnimatePresence>
  );
});
