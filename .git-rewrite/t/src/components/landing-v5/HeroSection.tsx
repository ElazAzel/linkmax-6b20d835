import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, ChevronRight, Play, Link, Image, MessageSquare, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/motion';
import { useState, useEffect } from 'react';

interface HeroSectionProps {
  onCreatePage: () => void;
  onViewExamples: () => void;
}

// Animated block component for the phone preview
function AnimatedBlock({ delay, children, className }: { delay: number; children: React.ReactNode; className?: string }) {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <div 
      className={cn(
        "transition-all duration-500 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        className
      )}
    >
      {children}
    </div>
  );
}

export default function HeroSection({ onCreatePage, onViewExamples }: HeroSectionProps) {
  const { t } = useTranslation();

  return (
    <section className="pt-24 pb-12 sm:pb-16 px-5 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-transparent pointer-events-none" />
      
      <div className="max-w-xl mx-auto text-center relative">
        {/* Trust badge */}
        <Reveal delay={0} direction="fade">
          <Badge className="mb-5 h-7 px-3 text-xs font-medium bg-primary/10 text-primary border-primary/20 rounded-full shadow-sm">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            {t('landingV5.hero.badge')}
          </Badge>
        </Reveal>

        {/* H1 - Clear value prop with specific outcome */}
        <Reveal delay={100} direction="up" distance={20}>
          <h1 className="text-[1.75rem] sm:text-4xl lg:text-5xl font-black tracking-tight mb-4 leading-[1.1]">
            <span className="block">{t('landingV5.hero.title1')}</span>
            <span className="text-primary bg-gradient-to-r from-primary to-primary/80 bg-clip-text">{t('landingV5.hero.title2')}</span>
          </h1>
        </Reveal>

        {/* Subtitle - specific, not generic */}
        <Reveal delay={200} direction="up">
          <p className="text-base sm:text-lg text-muted-foreground mb-6 max-w-md mx-auto leading-relaxed">
            {t('landingV5.hero.subtitle')}
          </p>
        </Reveal>

        {/* Primary CTA - prominent */}
        <Reveal delay={300} direction="up">
          <div className="flex flex-col gap-3 max-w-xs mx-auto mb-6">
            <Button 
              size="lg"
              onClick={onCreatePage}
              className={cn(
                "h-14 rounded-2xl text-base font-bold",
                "bg-gradient-to-r from-primary to-primary/90",
                "shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30",
                "hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              )}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {t('landingV5.hero.cta')}
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              onClick={onViewExamples}
              className="text-muted-foreground hover:text-foreground group"
            >
              <Play className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
              {t('landingV5.hero.secondary')}
              <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
        </Reveal>

        {/* Trust indicators - real, specific */}
        <Reveal delay={400} direction="fade">
          <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-primary" />
              {t('landingV5.hero.trust1')}
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-primary" />
              {t('landingV5.hero.trust2')}
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-primary" />
              {t('landingV5.hero.trust3')}
            </span>
          </div>
        </Reveal>
      </div>

      {/* Interactive product preview - animated blocks appearing */}
      <Reveal delay={500} direction="up" distance={24} duration={800}>
        <div className="max-w-xs mx-auto mt-10">
          <div className="relative rounded-3xl bg-gradient-to-b from-muted/60 to-muted/30 border border-border/50 p-3 shadow-2xl">
            {/* Phone frame shine effect */}
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-tr from-primary/10 via-transparent to-transparent pointer-events-none" />
            
            {/* Phone content */}
            <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
              {/* Status bar */}
              <div className="h-5 bg-muted/50 flex items-center justify-center">
                <div className="w-12 h-1 rounded-full bg-border" />
              </div>
              
              {/* Content preview with animated blocks */}
              <div className="p-3 space-y-2.5">
                {/* Avatar + Name block */}
                <AnimatedBlock delay={800}>
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">A</span>
                    </div>
                    <div className="flex-1">
                      <div className="h-3 bg-foreground/80 rounded w-16 mb-1" />
                      <div className="h-2 bg-muted-foreground/30 rounded w-24" />
                    </div>
                  </div>
                </AnimatedBlock>
                
                {/* CTA Button block */}
                <AnimatedBlock delay={1100}>
                  <div className="h-9 bg-primary rounded-xl flex items-center justify-center gap-1.5 shadow-md">
                    <MessageSquare className="h-3.5 w-3.5 text-primary-foreground" />
                    <span className="text-xs text-primary-foreground font-medium">
                      {t('landingV5.hero.previewCta')}
                    </span>
                  </div>
                </AnimatedBlock>
                
                {/* Links grid */}
                <AnimatedBlock delay={1400}>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="h-12 bg-muted/60 rounded-xl flex items-center justify-center">
                      <Link className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="h-12 bg-muted/60 rounded-xl flex items-center justify-center">
                      <Image className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </AnimatedBlock>
                
                {/* Booking block */}
                <AnimatedBlock delay={1700}>
                  <div className="h-14 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl flex items-center px-3 gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <div className="h-2.5 bg-foreground/60 rounded w-14 mb-1" />
                      <div className="h-2 bg-muted-foreground/30 rounded w-20" />
                    </div>
                    <div className="h-6 w-14 bg-primary/20 rounded-lg" />
                  </div>
                </AnimatedBlock>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
