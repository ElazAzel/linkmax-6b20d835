import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/platform/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Link2 from 'lucide-react/dist/esm/icons/link-2';
import CalendarCheck from 'lucide-react/dist/esm/icons/calendar-check';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import { getAppDomain } from '@/lib/utils/url-helpers';
import { NICHE_ICONS, type Niche } from '@/lib/niches';
import { trackActivationEvent } from '@/lib/activation-events';

export default function FromPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: page, isLoading } = useQuery({
    queryKey: ['from-page', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from('pages')
        .select('id, title, avatar_url, preview_url, niche, slug')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();
      if (error || !data) return null;
      return data;
    },
    enabled: !!slug,
  });

  // Track watermark landing view
  useEffect(() => {
    if (page?.id) {
      trackActivationEvent(page.id, 'watermark_landing_view' as any, { ref_slug: slug });
    }
  }, [page?.id, slug]);

  // Redirect to home if page not found after loading
  useEffect(() => {
    if (!isLoading && !page && slug) {
      navigate('/', { replace: true });
    }
  }, [isLoading, page, slug, navigate]);

  if (isLoading || !page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const nicheIcon = page.niche ? NICHE_ICONS[page.niche as Niche] || '📌' : '📌';
  const authUrl = `/auth?from=watermark&ref_slug=${slug}&niche=${page.niche || ''}`;

  return (
    <>
      <StaticSEOHead
        title={t('from.seoTitle', 'Создайте свою страницу — бесплатно | lnkmx')}
        description={t('from.seoDesc', 'Создайте страницу для записи клиентов за 5 минут. Бесплатно.')}
        canonical={`${getAppDomain()}/from/${slug}`}
        currentLanguage="ru"
        indexable={false}
      />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-background/80 flex flex-col items-center justify-center p-4 pb-safe">
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-bl from-primary/15 via-violet-500/10 to-transparent rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-500/10 via-cyan-500/5 to-transparent rounded-full blur-[100px]" />
        </div>

        <div className="w-full max-w-sm space-y-6">
          {/* Logo */}
          <div className="text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold">lnkmx</span>
            </Link>
          </div>

          {/* Referring page card */}
          <Card className="p-4 bg-card/80 backdrop-blur-lg border-border/50">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12 rounded-xl ring-2 ring-primary/20">
                <AvatarImage src={page.avatar_url || undefined} />
                <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold">
                  {page.title?.charAt(0) || 'L'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{page.title || 'Untitled'}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span>{nicheIcon}</span>
                  <span>lnkmx.my/{page.slug}</span>
                </p>
              </div>
            </div>
            {page.preview_url && (
              <div className="aspect-[16/9] rounded-lg overflow-hidden bg-muted/30">
                <img
                  src={page.preview_url}
                  alt={page.title || ''}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {t('from.madeWith', 'Эта страница создана на lnkmx')}
            </p>
          </Card>

          {/* Headline */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">
              {t('from.headline', 'Создайте такую же — бесплатно')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('from.subheadline', 'Ссылка для записи клиентов. Готова за 5 минут.')}
            </p>
          </div>

          {/* Value props */}
          <div className="space-y-3">
            {[
              { icon: <Link2 className="h-4 w-4 text-primary" />, text: t('from.val1', 'Красивая ссылка для Instagram bio') },
              { icon: <CalendarCheck className="h-4 w-4 text-primary" />, text: t('from.val2', 'Клиенты видят цены и записываются сами') },
              { icon: <Clock className="h-4 w-4 text-primary" />, text: t('from.val3', 'Без звонков и переписки') },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="space-y-3">
            <Button asChild size="lg" className="w-full rounded-xl text-base h-12">
              <Link to={authUrl}>
                {t('from.cta', 'Создать свою страницу')}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {t('from.free', 'Бесплатно. Без карты. Без скрытых платежей.')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
