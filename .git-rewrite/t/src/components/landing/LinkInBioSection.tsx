import { useTranslation } from 'react-i18next';
import { Link2, Sparkles, TrendingUp, Shield, Globe, Smartphone } from 'lucide-react';
import { useScrollAnimation } from './hooks/useScrollAnimation';

export function LinkInBioSection() {
  const { t } = useTranslation();
  const sectionAnimation = useScrollAnimation();

  const benefits = [
    { icon: Link2, text: t('landing.linkInBio.benefit1', 'Все ссылки в одном месте') },
    { icon: Sparkles, text: t('landing.linkInBio.benefit2', 'AI создаёт контент') },
    { icon: TrendingUp, text: t('landing.linkInBio.benefit3', 'Аналитика кликов') },
    { icon: Shield, text: t('landing.linkInBio.benefit4', 'Без комиссий') },
    { icon: Globe, text: t('landing.linkInBio.benefit5', 'Свой домен') },
    { icon: Smartphone, text: t('landing.linkInBio.benefit6', 'Мобильный редактор') },
  ];

  return (
    <section 
      id="link-in-bio"
      ref={sectionAnimation.ref}
      className="py-16 sm:py-24 lg:py-32 px-5 sm:px-6 bg-muted/20"
    >
      <div className="container mx-auto max-w-5xl">
        <article className="space-y-8 sm:space-y-12">
          {/* Header */}
          <header className="text-center space-y-4">
            <h2 
              className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-[-0.02em] leading-tight opacity-0 ${sectionAnimation.isVisible ? 'animate-blur-in' : ''}`}
            >
              {t('landing.linkInBio.title', 'Что такое Link-in-Bio и зачем он нужен?')}
            </h2>
            <p 
              className={`text-sm sm:text-base lg:text-lg text-muted-foreground max-w-3xl mx-auto opacity-0 ${sectionAnimation.isVisible ? 'animate-fade-in-up' : ''}`}
              style={{ animationDelay: '150ms' }}
            >
              {t('landing.linkInBio.subtitle', 'Страница ссылок — это мини-сайт, который объединяет все ваши ресурсы: соцсети, мессенджеры, портфолио, товары и услуги')}
            </p>
          </header>

          {/* Main content */}
          <div 
            className={`prose prose-lg dark:prose-invert max-w-none opacity-0 ${sectionAnimation.isVisible ? 'animate-fade-in-up' : ''}`}
            style={{ animationDelay: '300ms' }}
          >
            <div className="grid md:grid-cols-2 gap-8 items-start">
              <div className="space-y-4 text-muted-foreground text-sm sm:text-base leading-relaxed">
                <p>
                  {t('landing.linkInBio.p1', 'Link-in-Bio (линк в био, мультиссылка) — это страница, которую вы размещаете в описании профиля Instagram, TikTok, YouTube или Telegram. Вместо одной ссылки вы получаете полноценный мини-лендинг с кнопками, контактами и даже каталогом товаров.')}
                </p>
                <p>
                  {t('landing.linkInBio.p2', 'LinkMAX — современная альтернатива Linktree и Taplink с AI-генерацией контента. Вы выбираете нишу (барбер, фотограф, тренер, психолог), и искусственный интеллект создаёт готовую страницу за 2 минуты: с профилем, нужными блоками и текстами.')}
                </p>
                <p>
                  {t('landing.linkInBio.p3', 'В отличие от конкурентов, мы не берём комиссию с ваших продаж. Все деньги от товаров и услуг — ваши. А встроенная аналитика и CRM помогают понять, какие ссылки работают лучше всего.')}
                </p>
              </div>

              <div className="space-y-3">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-card/60 border border-border/40 opacity-0 ${sectionAnimation.isVisible ? 'animate-stagger-in' : ''}`}
                    style={{ animationDelay: `${400 + index * 80}ms` }}
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-sm sm:text-base font-medium">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Keywords for SEO - visually subtle but present */}
          <footer 
            className={`pt-6 border-t border-border/30 opacity-0 ${sectionAnimation.isVisible ? 'animate-fade-in' : ''}`}
            style={{ animationDelay: '600ms' }}
          >
            <p className="text-xs text-muted-foreground/60 text-center">
              {t('landing.linkInBio.keywords', 'Ключевые слова: страница ссылок, линк в био, link in bio, мультиссылка, linktree альтернатива, taplink аналог, мини-лендинг')}
            </p>
          </footer>
        </article>
      </div>
    </section>
  );
}
