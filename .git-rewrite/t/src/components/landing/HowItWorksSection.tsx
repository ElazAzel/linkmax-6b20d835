import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Wand2, 
  Bell, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface HowItWorksSectionProps {
  isVisible: boolean;
  sectionRef: React.RefObject<HTMLDivElement>;
}

export function HowItWorksSection({ isVisible, sectionRef }: HowItWorksSectionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const steps = [
    {
      icon: Target,
      number: '01',
      titleKey: 'landing.howItWorks.step1.title',
      descriptionKey: 'landing.howItWorks.step1.description',
      color: 'from-pink-500 to-rose-500',
    },
    {
      icon: Wand2,
      number: '02',
      titleKey: 'landing.howItWorks.step2.title',
      descriptionKey: 'landing.howItWorks.step2.description',
      color: 'from-violet-500 to-purple-600',
    },
    {
      icon: Bell,
      number: '03',
      titleKey: 'landing.howItWorks.step3.title',
      descriptionKey: 'landing.howItWorks.step3.description',
      color: 'from-blue-500 to-cyan-500',
    },
  ];

  return (
    <section ref={sectionRef} className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-12 sm:mb-16 space-y-4">
          <div 
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium opacity-0 ${isVisible ? 'animate-fade-in' : ''}`}
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-primary">{t('landing.howItWorks.badge', '2 минуты до результата')}</span>
          </div>
          <h2 
            className={`text-2xl sm:text-3xl lg:text-[2.75rem] font-extrabold tracking-[-0.02em] leading-tight opacity-0 ${isVisible ? 'animate-blur-in' : ''}`}
            style={{ animationDelay: '100ms' }}
          >
            {t('landing.howItWorks.title', 'Как это работает')}
          </h2>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connection line with gradient */}
          <div className="hidden md:block absolute top-24 left-[16.66%] right-[16.66%] h-0.5 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-pink-500/40 via-violet-500/40 to-blue-500/40 animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 sm:gap-8">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`group relative text-center opacity-0 ${isVisible ? 'animate-slide-in-up' : ''}`}
                style={{ animationDelay: `${200 + index * 150}ms` }}
              >
                {/* Icon with number */}
                <div className="relative inline-block mb-6">
                  <div className={`h-18 w-18 sm:h-22 sm:w-22 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl mx-auto relative z-10 group-hover:scale-110 group-hover:shadow-2xl transition-all duration-400`}>
                    <step.icon className="h-9 w-9 sm:h-11 sm:w-11 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-card border-2 border-border flex items-center justify-center text-sm font-bold z-20 shadow-lg group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                    {step.number}
                  </div>
                  {/* Glow effect */}
                  <div className={`absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${step.color} blur-2xl opacity-20 group-hover:opacity-40 transition-opacity -z-10`} />
                </div>

                <h3 className="text-lg sm:text-xl font-bold mb-3 group-hover:text-primary transition-colors">{t(step.titleKey)}</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xs mx-auto">
                  {t(step.descriptionKey)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div 
          className={`text-center mt-14 sm:mt-20 opacity-0 ${isVisible ? 'animate-fade-in-up' : ''}`}
          style={{ animationDelay: '700ms' }}
        >
          <Button 
            onClick={() => navigate('/auth')}
            variant="premium"
            size="lg"
            className="rounded-2xl font-bold px-6 sm:px-8"
          >
            <Sparkles className="mr-2 h-5 w-5 flex-shrink-0" />
            <span className="truncate">{t('landing.howItWorks.cta', 'Попробовать бесплатно')}</span>
            <ArrowRight className="ml-2 h-5 w-5 flex-shrink-0" />
          </Button>
        </div>
      </div>
    </section>
  );
}
