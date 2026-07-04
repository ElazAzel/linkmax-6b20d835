import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import { cn } from '@/lib/utils/utils';

/**
 * Sticky mobile-only CTA bar.
 * Appears after user scrolls past hero (~600px), hides near footer.
 */
export const StickyMobileCTA = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrolled = window.scrollY;
      const nearBottom =
        window.innerHeight + scrolled >= document.documentElement.scrollHeight - 400;
      // Hero takes ~100vh; show sticky only after fully past hero
      const heroHeight = window.innerHeight;
      setVisible(scrolled > heroHeight * 0.9 && !nearBottom);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 sm:hidden px-3 pb-3 pt-2 pointer-events-none transition-all duration-300',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      )}
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
      aria-hidden={!visible}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none" />
      <button
        type="button"
        onClick={() => navigate('/auth')}
        aria-label={t('landing.stickyCta.label', 'Создать страницу — бесплатно')}
        className="relative pointer-events-auto w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
      >
        <span>
          {t('landing.stickyCta.label', 'Создать страницу — бесплатно')}
        </span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
