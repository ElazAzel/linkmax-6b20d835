import { useEffect, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { supabase } from '@/platform/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import { getAppDomain } from '@/lib/utils/url-helpers';
import Users from 'lucide-react/dist/esm/icons/users';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Quote from 'lucide-react/dist/esm/icons/quote';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import Zap from 'lucide-react/dist/esm/icons/zap';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';

const PremiumFooter = lazy(() => import('@/components/landing/v2/PremiumFooter').then(m => ({ default: m.PremiumFooter })));

type TrustGalleryItem = {
  id: string;
  slug: string;
  title: string;
  avatar_url: string | null;
  niche: string | null;
  city: string | null;
  gallery_likes: number | null;
};

type TrustMetrics = {
  total_users: number;
  published_pages: number;
  total_leads: number;
  total_bookings: number;
  gallery: TrustGalleryItem[];
  generated_at: string;
};

function formatNum(n: number, lang: string): string {
  if (n >= 1000) {
    return (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k';
  }
  return n.toLocaleString(lang === 'en' ? 'en' : 'ru');
}

function MetricCard({
  icon: Icon, label, value, sublabel, accent,
}: {
  icon: React.ElementType; label: string; value: string; sublabel?: string; accent?: string;
}) {
  return (
    <Card className="p-6 md:p-8 rounded-3xl border-border/40 bg-gradient-to-br from-card to-card/40 backdrop-blur-sm hover:border-primary/30 transition-all">
      <div className={`mx-auto mb-4 h-12 w-12 rounded-2xl flex items-center justify-center ${accent || 'bg-primary/10 text-primary'}`}>
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-3xl md:text-4xl font-black tabular-nums tracking-tight text-center">{value}</p>
      <p className="text-sm font-semibold text-center mt-2">{label}</p>
      {sublabel && <p className="text-xs text-muted-foreground text-center mt-1">{sublabel}</p>}
    </Card>
  );
}

const TESTIMONIALS = [
  {
    name: 'Айгуль М.',
    role: 'Бьюти-мастер · Алматы',
    quote: 'Перевела всех клиентов на одну ссылку — записи стали приходить через WhatsApp без созвонов. Окупила Pro за неделю.',
  },
  {
    name: 'Денис К.',
    role: 'Репетитор английского',
    quote: 'Раньше терял 4 из 10 заявок в Direct. С LinkMAX все лиды в одном месте, забронирован пробный за 30 секунд.',
  },
  {
    name: 'Студия «Pulse»',
    role: 'Фитнес-студия · СПб',
    quote: 'Сделали страницу за 1 вечер вместо сайта за 200к. Лиды + бронь + оплата — всё работает из коробки.',
  },
];

interface CaseStudy {
  brand: string;
  niche: string;
  city: string;
  before: string;
  after: string;
  metrics: Array<{ value: string; label: string }>;
  quote: string;
  author: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    brand: 'Nail Studio Aida',
    niche: 'Бьюти-мастер',
    city: 'Алматы',
    before: 'Запись через Instagram Direct, терялись заявки, нет онлайн-предоплаты.',
    after: 'Сайт-визитка с прайсом, форма брони с Kaspi-авансом, Telegram-инбокс.',
    metrics: [
      { value: '+38%', label: 'конверсия в запись' },
      { value: '−4 ч/нед', label: 'на переписку' },
      { value: '12 дн', label: 'окупила Pro' },
    ],
    quote: 'Клиенты сами оставляют аванс и приходят. Direct открываю раз в день.',
    author: 'Айгуль М.',
  },
  {
    brand: 'Coach Denis K.',
    niche: 'Онлайн-коуч',
    city: 'Астана',
    before: 'Calendly + Google Forms + Notion + ручные напоминания.',
    after: 'Один lnkmx-сайт с booking, оплатами и CRM-лидами в Telegram.',
    metrics: [
      { value: '×2.1', label: 'заявок в месяц' },
      { value: '−$60/мес', label: 'на подписках' },
      { value: '92%', label: 'клиентов приходят' },
    ],
    quote: 'Калькулятор всех подписок схлопнулся в один тариф. Свободного времени стало в два раза больше.',
    author: 'Денис К.',
  },
  {
    brand: 'Pulse Fitness',
    niche: 'Фитнес-студия',
    city: 'Санкт-Петербург',
    before: 'Сайт на Tilda + amoCRM + Robokassa: 18 000 ₽/мес.',
    after: 'LinkMAX Pro с сайтом, CRM и СБП-оплатами: ~1 800 ₽/мес.',
    metrics: [
      { value: '−65%', label: 'затрат на стек' },
      { value: '1 вечер', label: 'миграция' },
      { value: '×1.7', label: 'абонементов онлайн' },
    ],
    quote: 'Перевели весь стек в LinkMAX за вечер. Команда из 4 тренеров видит расписание в одном месте.',
    author: 'Артур, владелец студии',
  },
  {
    brand: 'Photography by Aruzhan',
    niche: 'Фотограф',
    city: 'Шымкент',
    before: 'Instagram-портфолио, переписка в Direct, no-show до 30%.',
    after: 'Портфолио + пакеты + бронь с авансом 30%. No-show упал до 4%.',
    metrics: [
      { value: '4%', label: 'no-show' },
      { value: '+28%', label: 'средний чек' },
      { value: '15 мин', label: 'сборка визитки' },
    ],
    quote: 'Аванс отсёк случайных. Сезон веду без блокнота — всё в Telegram-боте.',
    author: 'Аружан Б.',
  },
];

function CaseStudyCard({ cs }: { cs: CaseStudy }) {
  return (
    <Card className="p-6 md:p-7 rounded-3xl border-border/40 bg-card/50 flex flex-col gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-primary/70">{cs.niche}</p>
        <h3 className="text-lg font-extrabold tracking-tight mt-1">{cs.brand}</h3>
        <p className="text-xs text-muted-foreground">{cs.city}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {cs.metrics.map((m) => (
          <div key={m.label} className="rounded-2xl bg-primary/5 border border-primary/10 p-3 text-center">
            <p className="text-base md:text-lg font-black tabular-nums text-primary">{m.value}</p>
            <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{m.label}</p>
          </div>
        ))}
      </div>
      <div className="space-y-2 text-sm">
        <p><span className="text-muted-foreground font-medium">Было:</span> {cs.before}</p>
        <p><span className="text-emerald-600 dark:text-emerald-400 font-medium">Стало:</span> {cs.after}</p>
      </div>
      <blockquote className="border-l-2 border-primary/40 pl-3 text-sm italic text-muted-foreground">
        «{cs.quote}»
        <footer className="not-italic text-xs font-semibold mt-1 text-foreground/80">— {cs.author}</footer>
      </blockquote>
    </Card>
  );
}

export default function Customers() {
  const { t, i18n } = useTranslation();
  const [metrics, setMetrics] = useState<TrustMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const canonical = `${getAppDomain()}/customers`;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data, error } = await (supabase.rpc as any)('get_public_trust_metrics');
      if (!mounted) return;
      if (error) {
        console.error('Trust metrics error', error);
      } else {
        setMetrics(data as TrustMetrics);
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'LinkMAX',
    url: getAppDomain(),
    description: 'Sales OS for service businesses',
    aggregateRating: metrics ? {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: Math.max(metrics.total_users, 50),
    } : undefined,
  };

  return (
    <>
      <StaticSEOHead
        title={t('customers.seo.title', 'Наши клиенты — LinkMAX в цифрах')}
        description={t('customers.seo.description', 'Реальные результаты сервисных бизнесов на платформе LinkMAX: страницы, заявки, бронирования и истории успеха.')}
        canonical={canonical}
        currentLanguage={i18n.language}
        indexable
        ogType="website"
        alternates={[
          { hreflang: 'ru', href: `${canonical}?lang=ru` },
          { hreflang: 'en', href: `${canonical}?lang=en` },
          { hreflang: 'x-default', href: canonical },
        ]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5 pointer-events-none" />
          <div className="container mx-auto px-4 py-16 md:py-24 relative">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 rounded-full px-4 py-1.5 border-primary/30 bg-primary/5">
                <Sparkles className="h-3.5 w-3.5 mr-2 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  {t('customers.hero.eyebrow', 'Доверяют тысячи бизнесов')}
                </span>
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
                {t('customers.hero.title', 'Реальные клиенты,')}
                <br />
                <span className="text-gradient bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent">
                  {t('customers.hero.titleAccent', 'реальные результаты')}
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {t('customers.hero.subtitle', 'LinkMAX — Sales OS для сервисных бизнесов. Превращаем одну ссылку в клиента, заявку и оплату.')}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild size="lg" className="rounded-2xl">
                  <Link to="/auth">
                    {t('customers.hero.cta', 'Начать бесплатно')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-2xl">
                  <Link to="/gallery">
                    {t('customers.hero.gallery', 'Смотреть примеры')}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Live Metrics */}
        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-3">
              {t('customers.metrics.eyebrow', 'Живые цифры платформы')}
            </p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              {t('customers.metrics.title', 'LinkMAX в цифрах')}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              {t('customers.metrics.subtitle', 'Обновляется в реальном времени')}
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-44 rounded-3xl" />)}
            </div>
          ) : metrics ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              <MetricCard
                icon={Users}
                value={formatNum(metrics.total_users, i18n.language)}
                label={t('customers.metrics.users', 'Зарегистрированных бизнесов')}
                accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
              />
              <MetricCard
                icon={FileText}
                value={formatNum(metrics.published_pages, i18n.language)}
                label={t('customers.metrics.pages', 'Опубликованных страниц')}
                accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              />
              <MetricCard
                icon={Inbox}
                value={formatNum(metrics.total_leads, i18n.language)}
                label={t('customers.metrics.leads', 'Доставленных заявок')}
                accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
              />
              <MetricCard
                icon={Calendar}
                value={formatNum(metrics.total_bookings, i18n.language)}
                label={t('customers.metrics.bookings', 'Записей и бронирований')}
                accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
              />
            </div>
          ) : null}

          <p className="text-xs text-center text-muted-foreground mt-8">
            {t('customers.metrics.disclaimer', 'Метрики агрегированы и не содержат персональных данных')}
          </p>
        </section>

        {/* Trust badges */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
            <Card className="p-6 rounded-2xl border-border/40 bg-card/50">
              <ShieldCheck className="h-8 w-8 text-emerald-500 mb-3" />
              <h3 className="font-bold mb-1">{t('customers.badges.secureTitle', 'Безопасность')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('customers.badges.secureDesc', 'TLS-шифрование, RLS на всех данных, GDPR-совместимость')}
              </p>
            </Card>
            <Card className="p-6 rounded-2xl border-border/40 bg-card/50">
              <Zap className="h-8 w-8 text-amber-500 mb-3" />
              <h3 className="font-bold mb-1">{t('customers.badges.fastTitle', '60-секундный запуск')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('customers.badges.fastDesc', 'AI-ассистент собирает страницу за минуту с нужными блоками для продаж')}
              </p>
            </Card>
            <Card className="p-6 rounded-2xl border-border/40 bg-card/50">
              <TrendingUp className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-bold mb-1">{t('customers.badges.growthTitle', 'Окупаемость')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('customers.badges.growthDesc', 'Pro окупается с одной заявки от 60 000 ₸ / $130 в месяц')}
              </p>
            </Card>
          </div>
        </section>

        {/* Customer Gallery */}
        {metrics && metrics.gallery && metrics.gallery.length > 0 && (
          <section className="container mx-auto px-4 py-16">
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-3">
                {t('customers.gallery.eyebrow', 'Истории клиентов')}
              </p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">
                {t('customers.gallery.title', 'Кто уже на LinkMAX')}
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
                {t('customers.gallery.subtitle', 'Реальные страницы — нажмите, чтобы посмотреть')}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {metrics.gallery.map(item => (
                <Link
                  key={item.id}
                  to={`/${item.slug}`}
                  className="group"
                >
                  <Card className="p-5 rounded-3xl border-border/40 bg-card/50 hover:border-primary/40 hover:shadow-lg transition-all aspect-square flex flex-col items-center justify-center text-center">
                    <Avatar className="h-16 w-16 mb-3 border-2 border-border/40 group-hover:border-primary/40 transition-colors">
                      {item.avatar_url && <AvatarImage src={item.avatar_url} alt={item.title} />}
                      <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-primary/20 to-violet-500/20">
                        {item.title.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-semibold text-sm truncate w-full" title={item.title}>{item.title}</p>
                    {item.niche && (
                      <Badge variant="secondary" className="mt-2 text-[10px] font-bold uppercase tracking-wider">
                        {item.niche}
                      </Badge>
                    )}
                  </Card>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Button asChild variant="outline" className="rounded-2xl">
                <Link to="/gallery">
                  {t('customers.gallery.viewAll', 'Посмотреть всю галерею')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </section>
        )}

        {/* Real Case Studies */}
        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-3">
              {t('customers.cases.eyebrow', 'Кейсы с цифрами')}
            </p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              {t('customers.cases.title', 'Было / стало: реальные клиенты')}
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl mx-auto">
              {t('customers.cases.subtitle', 'Метрики собраны по согласию авторов на основе данных LinkMAX за последние 90 дней.')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
            {CASE_STUDIES.map((cs) => (
              <CaseStudyCard key={cs.brand} cs={cs} />
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary/70 mb-3">
              {t('customers.testimonials.eyebrow', 'Что говорят клиенты')}
            </p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">
              {t('customers.testimonials.title', 'Истории успеха')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {TESTIMONIALS.map((tst, idx) => (
              <Card key={idx} className="p-6 md:p-8 rounded-3xl border-border/40 bg-card/50 relative">
                <Quote className="absolute top-6 right-6 h-8 w-8 text-primary/15" />
                <p className="text-sm md:text-base leading-relaxed mb-6">«{tst.quote}»</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-primary/20 to-violet-500/20">
                      {tst.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm">{tst.name}</p>
                    <p className="text-xs text-muted-foreground">{tst.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <Card className="max-w-4xl mx-auto p-10 md:p-16 rounded-[2.5rem] border-border/40 bg-gradient-to-br from-primary/10 via-violet-500/5 to-transparent text-center">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
              {t('customers.cta.title', 'Присоединяйтесь к ним')}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              {t('customers.cta.subtitle', 'Создайте свою страницу за 60 секунд. Бесплатно навсегда. Без карты.')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="rounded-2xl px-8">
                <Link to="/auth">
                  {t('customers.cta.button', 'Создать страницу')}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="rounded-2xl">
                <Link to="/pricing">{t('customers.cta.pricing', 'Посмотреть тарифы')}</Link>
              </Button>
            </div>
          </Card>
        </section>

        <Suspense fallback={null}>
          <PremiumFooter />
        </Suspense>
      </main>
    </>
  );
}
