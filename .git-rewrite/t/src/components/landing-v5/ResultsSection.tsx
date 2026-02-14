import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Briefcase, Store, GraduationCap, Calendar, Heart,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/motion';

interface ResultsSectionProps {
  onCreatePage: () => void;
}

export default function ResultsSection({ onCreatePage }: ResultsSectionProps) {
  const { t } = useTranslation();

  const useCases = [
    {
      icon: Users,
      title: t('landingV5.results.creators.title'),
      problem: t('landingV5.results.creators.problem'),
      solution: t('landingV5.results.creators.solution'),
      color: 'from-purple-500 to-violet-500',
    },
    {
      icon: Briefcase,
      title: t('landingV5.results.freelancers.title'),
      problem: t('landingV5.results.freelancers.problem'),
      solution: t('landingV5.results.freelancers.solution'),
      color: 'from-blue-500 to-indigo-500',
    },
    {
      icon: Store,
      title: t('landingV5.results.business.title'),
      problem: t('landingV5.results.business.problem'),
      solution: t('landingV5.results.business.solution'),
      color: 'from-emerald-500 to-teal-500',
    },
    {
      icon: GraduationCap,
      title: t('landingV5.results.education.title'),
      problem: t('landingV5.results.education.problem'),
      solution: t('landingV5.results.education.solution'),
      color: 'from-amber-500 to-orange-500',
    },
    {
      icon: Calendar,
      title: t('landingV5.results.events.title'),
      problem: t('landingV5.results.events.problem'),
      solution: t('landingV5.results.events.solution'),
      color: 'from-cyan-500 to-blue-500',
    },
    {
      icon: Heart,
      title: t('landingV5.results.health.title'),
      problem: t('landingV5.results.health.problem'),
      solution: t('landingV5.results.health.solution'),
      color: 'from-pink-500 to-rose-500',
    },
  ];

  return (
    <section className="py-12 px-5 bg-muted/20">
      <div className="max-w-3xl mx-auto">
        <Reveal direction="up">
          <div className="text-center mb-8">
            <Badge className="mb-3 h-6 px-3 text-xs font-medium bg-primary/10 text-primary border-primary/20 rounded-full">
              {t('landingV5.results.badge')}
            </Badge>
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              {t('landingV5.results.title')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t('landingV5.results.subtitle')}
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {useCases.map((useCase, i) => (
            <Reveal key={i} delay={i * 80} direction="up" distance={12}>
              <div
                className={cn(
                  "group relative p-4 rounded-2xl bg-card border border-border/40",
                  "hover:border-primary/30 hover:shadow-md transition-all cursor-pointer"
                )}
                onClick={onCreatePage}
              >
                <div className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${useCase.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${useCase.color} flex items-center justify-center flex-shrink-0`}>
                    <useCase.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1">{useCase.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
                      <span className="text-destructive/70">✗</span> {useCase.problem}
                    </p>
                    <p className="text-xs text-primary font-medium line-clamp-1">
                      <span className="text-primary">✓</span> {useCase.solution}
                    </p>
                  </div>
                </div>
                
                <div className="mt-3 flex justify-end">
                  <span className="text-xs text-primary font-medium group-hover:underline flex items-center gap-1">
                    {t('landingV5.results.creators.cta')}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
