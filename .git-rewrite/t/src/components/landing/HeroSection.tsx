import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useCallback } from 'react';
import { 
  ArrowRight, 
  Check, 
  Bot, 
  Zap,
  MessageSquare,
  Bell,
  Users,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeroSectionProps {
  isVisible: boolean;
  sectionRef: React.RefObject<HTMLElement>;
}

export function HeroSection({ isVisible, sectionRef }: HeroSectionProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleCreatePage = useCallback(() => {
    if (username.trim()) {
      navigate(`/auth?username=${encodeURIComponent(username.trim())}`);
    } else {
      navigate('/auth');
    }
  }, [username, navigate]);

  const benefits = [
    { icon: Bot, label: t('landing.hero.benefit1', 'AI создаёт всё сам'), color: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
    { icon: MessageSquare, label: t('landing.hero.benefit2', 'Mini-CRM внутри'), color: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' },
    { icon: Bell, label: t('landing.hero.benefit3', 'Telegram-уведомления'), color: 'bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400' },
  ];

  return (
    <section ref={sectionRef} className="relative pt-28 sm:pt-36 lg:pt-44 pb-16 sm:pb-24 lg:pb-32 px-5 sm:px-6">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
        <div className="absolute top-40 right-20 w-3 h-3 rounded-full bg-violet-500/30 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 left-1/4 w-2 h-2 rounded-full bg-blue-500/30 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto max-w-5xl relative z-10">
        <div className="text-center space-y-6 sm:space-y-8">
          {/* Badge with micro-interaction */}
          <div 
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium",
              "hover:bg-primary/15 hover:border-primary/30 hover:scale-105 transition-all duration-300 cursor-default",
              "opacity-0",
              isVisible && "animate-fade-in"
            )}
          >
            <Bot className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-primary font-semibold">{t('landing.hero.badge', 'AI-страница для бизнеса')}</span>
          </div>

          {/* Main headline with staggered reveal */}
          <div 
            className={cn(
              "space-y-4 opacity-0",
              isVisible && "animate-blur-in"
            )} 
            style={{ animationDelay: '100ms' }}
          >
            <h1 className="text-[2.25rem] sm:text-[3rem] lg:text-[4rem] xl:text-[4.5rem] font-extrabold tracking-[-0.03em] leading-[1.05]">
              {t('landing.hero.title', 'AI-страница за минуту,')}
              <br />
              <span className="text-gradient bg-[length:200%_auto] animate-gradient-x inline-block">
                {t('landing.hero.titleHighlight', 'которая собирает заявки')}
              </span>
            </h1>
          </div>

          {/* Subtitle with fade up */}
          <p 
            className={cn(
              "text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-normal",
              "opacity-0",
              isVisible && "animate-fade-in-up"
            )}
            style={{ animationDelay: '200ms' }}
          >
            {t('landing.hero.description', 'Для бьюти-мастеров, экспертов и малого бизнеса. AI-дизайнер + AI-копирайтер + Mini-CRM + Telegram-уведомления о новых клиентах.')}
          </p>

          {/* Key benefits with hover effects */}
          <div 
            className={cn(
              "flex flex-wrap justify-center gap-3 sm:gap-4",
              "opacity-0",
              isVisible && "animate-fade-in-up"
            )}
            style={{ animationDelay: '300ms' }}
          >
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300",
                  "hover:scale-105 hover:shadow-lg cursor-default",
                  benefit.color
                )}
              >
                <benefit.icon className="h-4 w-4" />
                <span className="text-sm font-semibold">{benefit.label}</span>
              </div>
            ))}
          </div>

          {/* Username Input with enhanced interaction */}
          <div 
            className={cn(
              "max-w-lg mx-auto",
              "opacity-0",
              isVisible && "animate-fade-in-up"
            )}
            style={{ animationDelay: '400ms' }}
          >
            <div 
              className={cn(
                "relative flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl transition-all duration-400",
                "bg-card/80 backdrop-blur-2xl border shadow-glass-lg",
                isFocused 
                  ? "border-primary/50 shadow-glass-xl ring-4 ring-primary/10" 
                  : "border-border/50 hover:border-border/70 hover:shadow-glass-xl"
              )}
            >
              <div className="flex-shrink-0 pl-3 sm:pl-4 text-muted-foreground font-semibold text-sm sm:text-base select-none">
                lnkmx.my/
              </div>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder={t('landing.hero.usernamePlaceholder', 'yourname')}
                variant="minimal"
                className="flex-1 text-lg font-medium placeholder:text-muted-foreground/50"
                onKeyDown={(e) => e.key === 'Enter' && handleCreatePage()}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                aria-label="Username"
              />
              <Button 
                onClick={handleCreatePage}
                size="lg"
                className="rounded-xl font-bold px-5 sm:px-7 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                aria-label={t('landing.hero.createPage', 'Create page')}
              >
                <span className="hidden sm:inline mr-2">{t('landing.hero.createPage', 'Создать')}</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-6 mt-4 text-muted-foreground">
              <span className="flex items-center gap-1.5 text-sm">
                <Check className="h-4 w-4 text-primary" />
                {t('landing.hero.free', 'Бесплатно')}
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                <Zap className="h-4 w-4 text-primary" />
                {t('landing.hero.noCode', 'Без кода')}
              </span>
              <span className="flex items-center gap-1.5 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                {t('landing.hero.aiHelps', 'AI помогает')}
              </span>
            </div>
          </div>

          {/* Secondary CTA with subtle animation */}
          <div 
            className={cn(
              "pt-2",
              "opacity-0",
              isVisible && "animate-fade-in-up"
            )}
            style={{ animationDelay: '500ms' }}
          >
            <Button 
              variant="ghost" 
              onClick={() => navigate('/gallery')}
              className="text-muted-foreground hover:text-foreground hover:bg-foreground/5 group px-6 py-2"
            >
              <Users className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
              {t('landing.hero.viewExamples', 'Посмотреть примеры')}
              <ArrowRight className="h-4 w-4 ml-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
