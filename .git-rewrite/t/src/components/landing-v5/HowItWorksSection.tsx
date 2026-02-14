import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Target, Sparkles, Send, ArrowRight, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/motion';

interface HowItWorksSectionProps {
  onCreatePage: () => void;
}

export default function HowItWorksSection({ onCreatePage }: HowItWorksSectionProps) {
  const { t } = useTranslation();

  const steps = [
    {
      number: '1',
      icon: Target,
      title: t('landingV5.howItWorks.step1.title'),
      description: t('landingV5.howItWorks.step1.description'),
    },
    {
      number: '2',
      icon: Sparkles,
      title: t('landingV5.howItWorks.step2.title'),
      description: t('landingV5.howItWorks.step2.description'),
    },
    {
      number: '3',
      icon: Send,
      title: t('landingV5.howItWorks.step3.title'),
      description: t('landingV5.howItWorks.step3.description'),
    },
  ];

  return (
    <section className="py-12 px-5">
      <div className="max-w-xl mx-auto">
        <Reveal direction="up">
          <div className="text-center mb-8">
            <Badge className="mb-3 h-6 px-3 text-xs font-medium bg-primary/10 text-primary border-primary/20 rounded-full">
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              {t('landingV5.howItWorks.badge')}
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              {t('landingV5.howItWorks.title')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('landingV5.howItWorks.subtitle')}
            </p>
          </div>
        </Reveal>

        <div className="space-y-3">
          {steps.map((step, i) => (
            <Reveal key={i} delay={i * 150} direction="left" distance={20}>
              <div 
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50",
                  "hover:border-primary/30 hover:shadow-md transition-all duration-300"
                )}
              >
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold">{step.number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={500} direction="up">
          <div className="mt-8 text-center">
            <Button 
              size="lg"
              onClick={onCreatePage}
              className={cn(
                "h-12 px-6 rounded-xl font-semibold shadow-lg shadow-primary/20",
                "hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              )}
            >
              {t('landingV5.howItWorks.cta')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              {t('landingV5.howItWorks.note')}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
