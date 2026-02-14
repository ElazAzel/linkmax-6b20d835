import { useTranslation } from 'react-i18next';
import { 
  Scissors, Camera, Dumbbell, GraduationCap, Heart, Brain, 
  Coffee, ShoppingBag, Building2, Stethoscope, Music, Palette,
  ArrowRight
} from 'lucide-react';
import { useScrollAnimation } from './hooks/useScrollAnimation';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface NicheCard {
  icon: React.ElementType;
  key: string;
  color: string;
}

export function NichesDetailSection() {
  const { t } = useTranslation();
  const sectionAnimation = useScrollAnimation();
  const navigate = useNavigate();

  const niches: NicheCard[] = [
    { icon: Scissors, key: 'barber', color: 'from-blue-500 to-cyan-500' },
    { icon: Camera, key: 'photographer', color: 'from-purple-500 to-violet-500' },
    { icon: Dumbbell, key: 'fitness', color: 'from-emerald-500 to-teal-500' },
    { icon: Heart, key: 'beauty', color: 'from-pink-500 to-rose-500' },
    { icon: Brain, key: 'psychologist', color: 'from-indigo-500 to-blue-500' },
    { icon: GraduationCap, key: 'tutor', color: 'from-amber-500 to-orange-500' },
    { icon: Stethoscope, key: 'clinic', color: 'from-sky-500 to-blue-500' },
    { icon: Music, key: 'musician', color: 'from-fuchsia-500 to-pink-500' },
    { icon: Palette, key: 'designer', color: 'from-violet-500 to-purple-500' },
    { icon: Coffee, key: 'cafe', color: 'from-amber-600 to-yellow-500' },
    { icon: ShoppingBag, key: 'shop', color: 'from-teal-500 to-cyan-500' },
    { icon: Building2, key: 'agency', color: 'from-slate-500 to-zinc-600' },
  ];

  const handleStartClick = () => {
    navigate('/auth');
  };

  return (
    <section 
      id="for-whom"
      ref={sectionAnimation.ref}
      className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6"
    >
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <header className="text-center mb-10 sm:mb-14 lg:mb-20 space-y-4 sm:space-y-5">
          <h2 
            className={`text-2xl sm:text-4xl lg:text-[3rem] font-extrabold tracking-[-0.02em] leading-tight opacity-0 ${sectionAnimation.isVisible ? 'animate-blur-in' : ''}`}
          >
            {t('landing.niches.title', 'Для кого подходит LinkMAX?')}
          </h2>
          <p 
            className={`text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto opacity-0 ${sectionAnimation.isVisible ? 'animate-fade-in-up' : ''}`}
            style={{ animationDelay: '150ms' }}
          >
            {t('landing.niches.subtitle', 'Мы создали специальные шаблоны для каждой ниши. AI знает боли вашей аудитории и создаёт страницу под ваши задачи')}
          </p>
        </header>

        {/* Niche cards grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {niches.map((niche, index) => (
            <article 
              key={niche.key}
              className={`group relative p-4 sm:p-5 lg:p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/40 hover:border-primary/50 transition-all duration-300 hover:shadow-glass-lg hover:-translate-y-1 cursor-pointer opacity-0 ${sectionAnimation.isVisible ? 'animate-slide-in-up' : ''}`}
              style={{ animationDelay: `${200 + index * 60}ms` }}
              onClick={handleStartClick}
            >
              <div className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${niche.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
              
              <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br ${niche.color} flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <niche.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              
              <h3 className="text-sm sm:text-base lg:text-lg font-bold mb-1.5 sm:mb-2">
                {t(`landing.niches.${niche.key}.title`)}
              </h3>
              
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-2 sm:mb-3 line-clamp-2">
                {t(`landing.niches.${niche.key}.pain`)}
              </p>
              
              <p className="text-xs sm:text-sm text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                {t(`landing.niches.${niche.key}.benefit`)}
                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
            </article>
          ))}
        </div>

        {/* CTA */}
        <div 
          className={`text-center mt-10 sm:mt-14 opacity-0 ${sectionAnimation.isVisible ? 'animate-fade-in-up' : ''}`}
          style={{ animationDelay: '800ms' }}
        >
          <Button 
            size="lg"
            onClick={handleStartClick}
            className="rounded-2xl font-bold shadow-lg shadow-primary/25 hover:shadow-xl px-8 py-6"
          >
            {t('landing.niches.cta', 'Создать страницу для моей ниши')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
