import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Check, ArrowDown, X } from 'lucide-react';
import { Reveal, Stagger } from '@/components/motion';
import { cn } from '@/lib/utils';

export default function ProblemSolutionSection() {
  const { t } = useTranslation();

  const problems = [
    { title: t('landingV5.problem.item1'), desc: t('landingV5.problem.item1desc') },
    { title: t('landingV5.problem.item2'), desc: t('landingV5.problem.item2desc') },
    { title: t('landingV5.problem.item3'), desc: t('landingV5.problem.item3desc') },
  ];

  const solutions = [
    { title: t('landingV5.solution.item1'), desc: t('landingV5.solution.item1desc') },
    { title: t('landingV5.solution.item2'), desc: t('landingV5.solution.item2desc') },
    { title: t('landingV5.solution.item3'), desc: t('landingV5.solution.item3desc') },
  ];

  return (
    <section className="py-12 px-5 bg-gradient-to-b from-muted/30 to-background">
      <div className="max-w-xl mx-auto">
        {/* Problem */}
        <Reveal direction="up">
          <div className="mb-6">
            <Badge className="mb-4 h-6 px-3 text-xs font-medium bg-destructive/10 text-destructive border-destructive/20 rounded-full">
              <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
              {t('landingV5.problem.badge')}
            </Badge>
            
            <h2 className="text-lg sm:text-xl font-bold mb-2">
              {t('landingV5.problem.title')}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t('landingV5.problem.description')}
            </p>
          </div>
        </Reveal>

        <Stagger className="space-y-2" staggerDelay={100} direction="left" distance={12}>
          {problems.map((problem, i) => (
            <div 
              key={i}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl",
                "bg-destructive/5 border border-destructive/10",
                "hover:bg-destructive/8 transition-colors"
              )}
            >
              <div className="h-5 w-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <X className="h-3 w-3 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium">{problem.title}</p>
                <p className="text-xs text-muted-foreground">{problem.desc}</p>
              </div>
            </div>
          ))}
        </Stagger>

        {/* Arrow */}
        <Reveal delay={300} direction="fade">
          <div className="flex justify-center my-5">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ArrowDown className="h-5 w-5 text-primary animate-bounce" />
            </div>
          </div>
        </Reveal>

        {/* Solution */}
        <Reveal delay={400} direction="up">
          <div className="mb-4">
            <Badge className="mb-4 h-6 px-3 text-xs font-medium bg-primary/10 text-primary border-primary/20 rounded-full">
              <Check className="h-3.5 w-3.5 mr-1.5" />
              {t('landingV5.solution.badge')}
            </Badge>
            
            <h2 className="text-lg sm:text-xl font-bold mb-2">
              {t('landingV5.solution.title')}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              {t('landingV5.solution.description')}
            </p>
          </div>
        </Reveal>

        <Stagger className="space-y-2" staggerDelay={100} direction="right" distance={12}>
          {solutions.map((solution, i) => (
            <div 
              key={i}
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl",
                "bg-primary/5 border border-primary/20",
                "hover:bg-primary/8 hover:border-primary/30 transition-colors"
              )}
            >
              <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="h-3 w-3 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{solution.title}</p>
                <p className="text-xs text-muted-foreground">{solution.desc}</p>
              </div>
            </div>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
