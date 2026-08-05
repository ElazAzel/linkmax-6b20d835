import { useTranslation } from 'react-i18next';
import Layers from 'lucide-react/dist/esm/icons/layers';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import Wallet from 'lucide-react/dist/esm/icons/wallet';
import BarChart3 from 'lucide-react/dist/esm/icons/bar-chart-3';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';

/**
 * Value bento: asymmetric editorial grid on the brand canvas.
 * Hard 1px borders, no glass, one accent per tile.
 */
export function ValueBento() {
  const { t } = useTranslation();

  const tiles = [
    {
      id: 'page',
      icon: Layers,
      title: t('landing.short.features.pageTitle', 'Страница'),
      body: t(
        'landing.short.features.pageBody',
        'Услуги, ссылки, портфолио, отзывы и кнопки связи в одном коротком профиле.'
      ),
      className: 'sm:col-span-2 bg-white',
      accent: 'bg-brand-ink text-white',
    },
    {
      id: 'leads',
      icon: Inbox,
      title: t('landing.short.features.leadsTitle', 'Заявки'),
      body: t(
        'landing.short.features.leadsBody',
        'Формы, мессенджеры и записи складываются в единый поток, а не теряются в переписках.'
      ),
      className: 'bg-white',
      accent: 'bg-brand-coral text-white',
    },
    {
      id: 'money',
      icon: Wallet,
      title: t('landing.short.features.moneyTitle', 'Оплата'),
      body: t('landing.short.features.moneyBody', 'Инвойсы, платежи и базовая CRM уже рядом со страницей.'),
      className: 'bg-white',
      accent: 'bg-brand-mint text-white',
    },
    {
      id: 'insights',
      icon: BarChart3,
      title: t('landing.short.features.insightsTitle', 'Аналитика'),
      body: t(
        'landing.short.features.insightsBody',
        'Видно, откуда пришли клиенты, какие блоки работают и что стоит поменять.'
      ),
      className: 'sm:col-span-2 bg-brand-sun/25',
      accent: 'bg-brand-ink text-white',
    },
  ];

  return (
    <section className="border-b border-brand-ink/15 bg-brand-canvas px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-[1180px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-sage">
              <Sparkles className="h-3.5 w-3.5 text-brand-coral" />
              {t('landing.short.features.badge', 'LinkMAX OS')}
            </div>
            <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-brand-ink md:text-5xl">
              {t('landing.short.features.title', 'Что это?')}
            </h2>
          </div>
          <p className="max-w-md text-base leading-7 text-brand-sage">
            {t(
              'landing.short.features.subtitle',
              'Одна публичная ссылка для малого бизнеса: показать предложение, принять заявку и продолжить работу с клиентом.'
            )}
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => (
            <article
              key={tile.id}
              className={`group flex flex-col justify-between rounded-2xl border border-brand-ink/15 p-6 transition-colors hover:border-brand-ink/40 ${tile.className}`}
            >
              <span
                className={`mb-8 inline-flex h-10 w-10 items-center justify-center rounded-xl ${tile.accent}`}
              >
                <tile.icon className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-xl font-bold text-brand-ink">{tile.title}</h3>
                <p className="mt-2 text-sm leading-6 text-brand-sage">{tile.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
