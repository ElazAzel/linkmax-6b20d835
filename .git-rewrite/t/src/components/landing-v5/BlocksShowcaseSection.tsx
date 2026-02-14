import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/motion';
import { useRef, useState, useEffect } from 'react';

export default function BlocksShowcaseSection() {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);

  const blocks = [
    { name: t('landingV5.blocks.profile'), emoji: '👤', pro: false },
    { name: t('landingV5.blocks.links'), emoji: '🔗', pro: false },
    { name: t('landingV5.blocks.pricing'), emoji: '💰', pro: false },
    { name: t('landingV5.blocks.form'), emoji: '📝', pro: false },
    { name: t('landingV5.blocks.booking'), emoji: '📅', pro: true },
    { name: t('landingV5.blocks.faq'), emoji: '❓', pro: false },
    { name: t('landingV5.blocks.testimonials'), emoji: '⭐', pro: true },
    { name: t('landingV5.blocks.map'), emoji: '📍', pro: true },
    { name: t('landingV5.blocks.products'), emoji: '🛍️', pro: true },
    { name: t('landingV5.blocks.video'), emoji: '🎬', pro: false },
    { name: t('landingV5.blocks.gallery'), emoji: '🖼️', pro: false },
    { name: t('landingV5.blocks.messenger'), emoji: '💬', pro: false },
    { name: t('landingV5.blocks.countdown'), emoji: '⏰', pro: true },
    { name: t('landingV5.blocks.event'), emoji: '🎉', pro: true },
  ];

  // Stop auto-scroll on user interaction
  const handleInteraction = () => setIsAutoScrolling(false);

  // Subtle auto-scroll effect
  useEffect(() => {
    if (!isAutoScrolling || !scrollRef.current) return;
    
    const el = scrollRef.current;
    let animationFrame: number;
    const scrollSpeed = 0.3;
    
    const scroll = () => {
      if (!el || !isAutoScrolling) return;
      el.scrollLeft += scrollSpeed;
      
      // Reset to beginning when reaching end
      if (el.scrollLeft >= el.scrollWidth - el.clientWidth) {
        el.scrollLeft = 0;
      }
      
      animationFrame = requestAnimationFrame(scroll);
    };
    
    animationFrame = requestAnimationFrame(scroll);
    
    return () => cancelAnimationFrame(animationFrame);
  }, [isAutoScrolling]);

  return (
    <section className="py-12 px-5">
      <div className="max-w-xl mx-auto">
        <Reveal direction="up">
          <div className="text-center mb-6">
            <Badge className="mb-3 h-6 px-3 text-xs font-medium bg-primary/10 text-primary border-primary/20 rounded-full">
              <Layers className="h-3.5 w-3.5 mr-1.5" />
              {t('landingV5.blocks.badge')}
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              {t('landingV5.blocks.title')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('landingV5.blocks.subtitle')}
            </p>
          </div>
        </Reveal>

        {/* Horizontal scroll on mobile with auto-scroll */}
        <div 
          ref={scrollRef}
          className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide"
          onTouchStart={handleInteraction}
          onMouseDown={handleInteraction}
        >
          {blocks.map((block, i) => (
            <Reveal key={i} delay={i * 30} direction="fade" duration={300}>
              <div 
                className={cn(
                  "relative flex-shrink-0 flex items-center gap-2 py-2 px-3 rounded-xl",
                  "bg-card border border-border/50 text-sm font-medium",
                  "hover:border-primary/30 hover:shadow-sm transition-all cursor-default"
                )}
              >
                <span>{block.emoji}</span>
                {block.name}
                {block.pro && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                    {t('landingV5.blocks.proLabel')}
                  </span>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
