import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { 
  Scissors, 
  Heart, 
  Brain,
  ArrowRight,
  Bell,
  MessageSquare,
  BarChart3
} from 'lucide-react';

interface TargetAudienceSectionProps {
  isVisible: boolean;
  sectionRef: React.RefObject<HTMLDivElement>;
}

export function TargetAudienceSection({ isVisible, sectionRef }: TargetAudienceSectionProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const audiences = [
    {
      icon: Heart,
      title: t('landing.targetAudience.beauty.title', 'Бьюти-мастера'),
      subtitle: t('landing.targetAudience.beauty.subtitle', 'Маникюр, брови, ресницы, волосы'),
      color: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-500/10',
      results: [
        t('landing.targetAudience.beauty.result1', 'Все услуги и цены - в одной ссылке'),
        t('landing.targetAudience.beauty.result2', 'Клиенты записываются через форму'),
        t('landing.targetAudience.beauty.result3', 'Уведомление в Telegram о записи'),
      ]
    },
    {
      icon: Brain,
      title: t('landing.targetAudience.expert.title', 'Эксперты и коучи'),
      subtitle: t('landing.targetAudience.expert.subtitle', 'Психологи, репетиторы, консультанты'),
      color: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-500/10',
      results: [
        t('landing.targetAudience.expert.result1', 'Портфолио и отзывы в красивом виде'),
        t('landing.targetAudience.expert.result2', 'Лиды автоматически в Mini-CRM'),
        t('landing.targetAudience.expert.result3', 'Статусы клиентов: новый → в работе → готово'),
      ]
    },
    {
      icon: Scissors,
      title: t('landing.targetAudience.business.title', 'Малый бизнес'),
      subtitle: t('landing.targetAudience.business.subtitle', 'Барберы, фотографы, кофейни'),
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/10',
      results: [
        t('landing.targetAudience.business.result1', 'Каталог товаров и услуг'),
        t('landing.targetAudience.business.result2', 'Аналитика: откуда пришли клиенты'),
        t('landing.targetAudience.business.result3', 'Контроль заявок без Excel'),
      ]
    },
  ];

  return (
    <section ref={sectionRef} className="py-14 sm:py-20 lg:py-28 px-5 sm:px-6 bg-muted/20">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-10 sm:mb-14 space-y-4">
          <h2 
            className={`text-2xl sm:text-3xl lg:text-[2.75rem] font-extrabold tracking-[-0.02em] leading-tight opacity-0 ${isVisible ? 'animate-blur-in' : ''}`}
          >
            {t('landing.targetAudience.title', 'Для кого создан LinkMAX')}
          </h2>
          <p 
            className={`text-sm sm:text-base lg:text-lg text-muted-foreground max-w-xl mx-auto opacity-0 ${isVisible ? 'animate-fade-in-up' : ''}`}
            style={{ animationDelay: '150ms' }}
          >
            {t('landing.targetAudience.subtitle', 'Конкретные результаты для вашей ниши')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {audiences.map((audience, index) => (
            <div 
              key={index}
              className={`group relative p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-card/60 backdrop-blur-xl border border-border/40 hover:border-primary/40 transition-all duration-500 hover:shadow-glass-xl hover:-translate-y-2 cursor-default opacity-0 ${isVisible ? 'animate-slide-in-up' : ''}`}
              style={{ animationDelay: `${200 + index * 100}ms` }}
            >
              {/* Hover glow effect */}
              <div className={`absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br ${audience.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`} />
              
              {/* Header */}
              <div className="flex items-start gap-4 mb-5 relative">
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${audience.color} flex items-center justify-center shadow-lg flex-shrink-0 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                  <audience.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold group-hover:text-primary transition-colors">{audience.title}</h3>
                  <p className="text-sm text-muted-foreground">{audience.subtitle}</p>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-3 relative">
                {audience.results.map((result, resultIndex) => (
                  <div 
                    key={resultIndex} 
                    className="flex items-start gap-3 group/item"
                  >
                    <div className={`h-6 w-6 rounded-lg ${audience.bgColor} flex items-center justify-center flex-shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform`}>
                      {resultIndex === 0 && <BarChart3 className="h-3.5 w-3.5 text-foreground/70" />}
                      {resultIndex === 1 && <MessageSquare className="h-3.5 w-3.5 text-foreground/70" />}
                      {resultIndex === 2 && <Bell className="h-3.5 w-3.5 text-foreground/70" />}
                    </div>
                    <span className="text-sm text-foreground/80 leading-relaxed">{result}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div 
          className={`text-center mt-10 sm:mt-14 opacity-0 ${isVisible ? 'animate-fade-in-up' : ''}`}
          style={{ animationDelay: '600ms' }}
        >
          <Button 
            onClick={() => navigate('/auth')}
            variant="premium"
            size="lg"
            className="rounded-2xl font-bold px-6 sm:px-8"
          >
            <span className="truncate">{t('landing.targetAudience.cta', 'Создать страницу')}</span>
            <ArrowRight className="ml-2 h-5 w-5 flex-shrink-0" />
          </Button>
        </div>
      </div>
    </section>
  );
}
