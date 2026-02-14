import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Play, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/motion';

interface FinalCTASectionProps {
  onCreatePage: () => void;
  onViewExamples: () => void;
}

export default function FinalCTASection({ onCreatePage, onViewExamples }: FinalCTASectionProps) {
  const { t } = useTranslation();

  return (
    <section className="py-16 px-5 bg-gradient-to-b from-muted/30 via-primary/5 to-primary/10 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="max-w-xl mx-auto text-center relative">
        <Reveal direction="up">
          <Badge className="mb-4 h-6 px-3 text-xs font-medium bg-primary/10 text-primary border-primary/20 rounded-full">
            <Rocket className="h-3.5 w-3.5 mr-1.5" />
            {t('landingV5.finalCta.badge')}
          </Badge>
          
          <h2 className="text-xl sm:text-2xl font-bold mb-3">
            {t('landingV5.finalCta.title')}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm sm:text-base">
            {t('landingV5.finalCta.subtitle')}
          </p>
        </Reveal>
        
        <Reveal delay={200} direction="up">
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
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
              {t('landingV5.finalCta.cta')}
            </Button>
            <Button 
              variant="ghost"
              size="sm"
              onClick={onViewExamples}
              className="text-muted-foreground hover:text-foreground group"
            >
              <Play className="h-4 w-4 mr-2 transition-transform group-hover:scale-110" />
              {t('landingV5.finalCta.secondary')}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
