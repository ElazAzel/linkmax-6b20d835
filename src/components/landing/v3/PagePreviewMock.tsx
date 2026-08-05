import { useTranslation } from 'react-i18next';
import Check from 'lucide-react/dist/esm/icons/check';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import CreditCard from 'lucide-react/dist/esm/icons/credit-card';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';

/**
 * Product mock of a real LinkMAX public page.
 * Pure CSS/JSX (no stock imagery) so it stays crisp, fast and on-brand.
 */
export function PagePreviewMock({ className = '' }: { className?: string }) {
  const { t } = useTranslation();

  const rows = [
    {
      id: 'booking',
      icon: Calendar,
      title: t('landing.short.preview.bookingTitle', 'Запись'),
      body: t('landing.short.preview.bookingBody', '3 свободных окна сегодня'),
      tone: 'bg-brand-mint/10 text-brand-mint',
    },
    {
      id: 'lead',
      icon: MessageCircle,
      title: t('landing.short.preview.leadTitle', 'Заявка'),
      body: t('landing.short.preview.leadBody', 'Клиент оставил WhatsApp'),
      tone: 'bg-brand-coral/10 text-brand-coral',
    },
    {
      id: 'pay',
      icon: CreditCard,
      title: t('landing.short.preview.payTitle', 'Оплата'),
      body: t('landing.short.preview.payBody', 'Инвойс готов к отправке'),
      tone: 'bg-brand-ink/[0.06] text-brand-ink',
    },
  ];

  return (
    <div className={`relative ${className}`} aria-hidden="true">
      {/* accent slabs behind the device */}
      <div className="pointer-events-none absolute -left-3 top-8 hidden h-24 w-24 bg-brand-sun md:block" />
      <div className="pointer-events-none absolute -right-2 bottom-14 hidden h-16 w-16 bg-brand-coral md:block" />

      <div className="relative mx-auto w-full max-w-[340px] rounded-[28px] border border-brand-ink/20 bg-brand-ink p-2 shadow-[0_24px_60px_-30px_hsl(var(--brand-ink)/0.55)]">
        <div className="overflow-hidden rounded-[22px] bg-white">
          {/* browser bar */}
          <div className="flex items-center gap-2 border-b border-brand-ink/10 bg-brand-canvas px-3 py-2">
            <span className="h-2 w-2 rounded-full bg-brand-coral" />
            <span className="h-2 w-2 rounded-full bg-brand-sun" />
            <span className="h-2 w-2 rounded-full bg-brand-mint" />
            <span className="ml-2 truncate font-metric text-[11px] font-semibold text-brand-sage">
              {t('landing.short.preview.slug', 'lnkmx.my/amina')}
            </span>
          </div>

          <div className="px-4 pb-4 pt-5">
            {/* profile */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-ink text-sm font-bold text-white">
                {t('landing.short.preview.initials', 'LM')}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-brand-ink">
                  {t('landing.short.preview.name', 'Amina Studio')}
                </p>
                <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-mint">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-mint" />
                  {t('landing.short.preview.live', 'online')}
                </p>
              </div>
            </div>

            <p className="mt-4 text-[15px] font-semibold leading-snug text-brand-ink">
              {t('landing.short.preview.headline', 'Маникюр, запись и оплата в одном месте')}
            </p>

            {/* blocks */}
            <div className="mt-4 space-y-2">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center gap-3 rounded-xl border border-brand-ink/12 bg-white px-3 py-2.5"
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${row.tone}`}>
                    <row.icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[12px] font-bold text-brand-ink">{row.title}</span>
                    <span className="block truncate text-[11px] text-brand-sage">{row.body}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-3 rounded-xl bg-brand-coral px-3 py-3 text-center text-[13px] font-bold text-white">
              {t('landing.short.preview.cta', 'Записаться на сегодня')}
            </div>

            <div className="mt-3 flex items-start gap-2 rounded-xl bg-brand-canvas px-3 py-2.5">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-ink" />
              <p className="text-[11px] leading-4 text-brand-sage">
                <span className="font-bold text-brand-ink">{t('landing.short.preview.aiLabel', 'AI собрал')}</span>{' '}
                {t('landing.short.preview.aiBody', 'блоки: услуги, цены, запись, отзывы, контакты')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* floating inbox card */}
      <div className="absolute -bottom-4 left-0 hidden w-[236px] rounded-2xl border border-brand-ink/15 bg-white p-3 shadow-[0_18px_40px_-24px_hsl(var(--brand-ink)/0.45)] lg:block">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-sage">
          {t('landing.short.preview.inboxLabel', 'Новая заявка')}
        </p>
        <p className="mt-1 text-[12px] font-bold leading-4 text-brand-ink">
          {t('landing.short.preview.inboxName', 'Айжан хочет консультацию')}
        </p>
        <div className="mt-2 flex items-center justify-between text-[10px] font-semibold">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-mint/10 px-2 py-0.5 text-brand-mint">
            <Check className="h-3 w-3" />
            {t('landing.short.preview.inboxStatus', 'в CRM')}
          </span>
          <span className="text-brand-sage">{t('landing.short.preview.inboxTime', '2 мин')}</span>
        </div>
      </div>
    </div>
  );
}
