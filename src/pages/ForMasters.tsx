import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import CalendarCheck from 'lucide-react/dist/esm/icons/calendar-check';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Shield from 'lucide-react/dist/esm/icons/shield';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import { getAppDomain } from '@/lib/utils/url-helpers';
import { getGalleryPages } from '@/services/gallery';
import { trackActivationEvent } from '@/lib/activation-events';

export default function ForMasters() {
  const { t } = useTranslation();

  // Track landing view
  useEffect(() => {
    trackActivationEvent('niche-landing', 'niche_landing_view' as any, { niche: 'beauty' });
  }, []);

  const { data: beautyPages } = useQuery({
    queryKey: ['gallery-beauty-preview'],
    queryFn: () => getGalleryPages('beauty'),
    staleTime: 5 * 60 * 1000,
  });

  const topPages = (beautyPages || []).slice(0, 6);

  const handleCtaClick = () => {
    trackActivationEvent('niche-landing', 'niche_landing_cta_click' as any, { niche: 'beauty' });
  };

  return (
    <>
      <StaticSEOHead
        title="Онлайн-запись для мастеров красоты — бесплатно | lnkmx"
        description="Создайте страницу для записи клиентов за 5 минут. Клиенты записываются из Instagram. Без звонков, без переписки. Бесплатно."
        canonical={`${getAppDomain()}/for-masters`}
        currentLanguage="ru"
        indexable={true}
      />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80">
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-bl from-primary/15 via-violet-500/10 to-transparent rounded-full blur-[150px]" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-pink-500/10 via-rose-500/5 to-transparent rounded-full blur-[120px]" />
        </div>

        {/* Header */}
        <header className="flex items-center justify-between p-4 max-w-2xl mx-auto">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">lnkmx</span>
          </Link>
          <Button asChild variant="outline" size="sm" className="rounded-xl">
            <Link to="/auth">
              {t('auth.signIn', 'Войти')}
            </Link>
          </Button>
        </header>

        <main className="max-w-2xl mx-auto px-4 pb-20">
          {/* Hero */}
          <section className="text-center py-12 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary font-medium">
              💄 {t('forMasters.badge', 'Для мастеров красоты')}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
              {t('forMasters.headline', 'Онлайн-запись для мастеров — бесплатно, за 5 минут')}
            </h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              {t('forMasters.subheadline', 'Клиенты записываются прямо из Instagram. Без звонков, без переписки.')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild size="lg" className="rounded-xl text-base h-12 px-8" onClick={handleCtaClick}>
                <Link to="/auth?niche=beauty&from=masters-landing">
                  {t('forMasters.cta', 'Создать страницу записи')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl text-base h-12">
                <Link to="/gallery?niche=beauty">
                  {t('forMasters.ctaSecondary', 'Посмотреть примеры')}
                </Link>
              </Button>
            </div>
          </section>

          {/* Value Props */}
          <section className="space-y-4 py-8">
            {[
              {
                icon: <Link2 className="h-5 w-5 text-primary" />,
                title: t('forMasters.val1Title', 'Ссылка для записи в bio'),
                desc: t('forMasters.val1Desc', 'Одна ссылка — и клиенты видят ваши услуги, цены и свободные слоты'),
              },
              {
                icon: <CalendarCheck className="h-5 w-5 text-primary" />,
                title: t('forMasters.val2Title', 'Клиент видит цену и записывается сам'),
                desc: t('forMasters.val2Desc', 'Без переписки «а сколько стоит?». Клиент выбирает время и подтверждает'),
              },
              {
                icon: <LayoutDashboard className="h-5 w-5 text-primary" />,
                title: t('forMasters.val3Title', 'Все заявки в одном месте'),
                desc: t('forMasters.val3Desc', 'Видите кто записался, подтверждаете, отправляете напоминания'),
              },
            ].map((item, i) => (
              <Card key={i} className="p-4 bg-card/60 backdrop-blur-lg border-border/40 flex gap-4 items-start">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{item.title}</h3>
                  <p className="text-muted-foreground text-sm mt-0.5">{item.desc}</p>
                </div>
              </Card>
            ))}
          </section>

          {/* Social Proof — Gallery Preview */}
          {topPages.length > 0 && (
            <section className="py-8">
              <h2 className="text-lg font-bold mb-4 text-center">
                {t('forMasters.examplesTitle', 'Примеры страниц мастеров')}
              </h2>
              <div className="grid grid-cols-3 gap-3">
                {topPages.map((page) => (
                  <Link
                    key={page.id}
                    to={`/${page.slug}`}
                    target="_blank"
                    className="group"
                  >
                    <Card className="overflow-hidden bg-card/60 border-border/40 hover:border-primary/30 transition-colors">
                      <div className="aspect-[9/16] relative bg-muted/30">
                        {page.preview_url ? (
                          <img
                            src={page.preview_url}
                            alt={page.title || ''}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Avatar className="h-10 w-10 rounded-lg">
                              <AvatarImage src={page.avatar_url || undefined} />
                              <AvatarFallback className="rounded-lg bg-primary/10 text-primary text-xs">
                                {page.title?.charAt(0) || 'L'}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs font-medium truncate">{page.title || 'Untitled'}</p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Objection Block */}
          <section className="py-8">
            <Card className="p-6 bg-primary/5 border-primary/20 text-center space-y-3">
              <Shield className="h-8 w-8 text-primary mx-auto" />
              <h2 className="font-bold text-lg">
                {t('forMasters.freeTitle', 'Бесплатно навсегда')}
              </h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                {t('forMasters.freeDesc', 'До 50 записей в месяц — бесплатно. Без привязки карты. Без скрытых платежей. Без срока действия.')}
              </p>
            </Card>
          </section>

          {/* Final CTA */}
          <section className="text-center py-8 space-y-4">
            <h2 className="text-2xl font-bold">
              {t('forMasters.finalCta', 'Начните принимать записи сегодня')}
            </h2>
            <Button asChild size="lg" className="rounded-xl text-base h-12 px-8" onClick={handleCtaClick}>
              <Link to="/auth?niche=beauty&from=masters-landing">
                {t('forMasters.cta', 'Создать страницу записи')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground">
              {t('forMasters.trustLine', 'Более 1000 мастеров уже используют lnkmx')}
            </p>
          </section>
        </main>
      </div>
    </>
  );
}
