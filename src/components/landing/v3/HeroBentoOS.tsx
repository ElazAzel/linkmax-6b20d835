import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { sanitizeSlug } from '@/lib/utils/slug';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Check from 'lucide-react/dist/esm/icons/check';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';

interface HeroBentoOSProps {
  onStart: (desiredSlug?: string) => void;
  onExamples: () => void;
}

export function HeroBentoOS({ onStart, onExamples }: HeroBentoOSProps) {
  const { t } = useTranslation();
  const [slug, setSlug] = useState('');
  const cleanSlug = sanitizeSlug(slug);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onStart(cleanSlug || undefined);
  };

  return (
    <section className="relative overflow-hidden bg-brand-canvas text-brand-ink">
      <div className="mx-auto grid min-h-[640px] max-w-[1180px] items-center gap-8 px-4 pb-16 pt-24 sm:px-6 sm:pt-28 md:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)] lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:gap-12 lg:px-8">
        <div className="min-w-0 py-4 md:py-8">
          <div className="mb-5 flex items-center gap-3 text-sm font-semibold">
            <span className="h-2.5 w-2.5 bg-brand-coral" aria-hidden="true" />
            {t('landing.short.eyebrow', 'Сайт, заявки и продажи в одной системе')}
          </div>

          <h1 className="font-display text-4xl font-bold leading-tight text-brand-ink sm:text-5xl xl:text-6xl">
            {t('landing.short.h1', 'LinkMAX — сайт, заявки и CRM для сферы услуг')}
          </h1>

          <p className="mt-5 max-w-[590px] text-xl font-semibold leading-snug xl:text-2xl">
            {t('landing.short.title', 'Соберите рабочую страницу бизнеса и управляйте клиентами без лишних сервисов')}
          </p>
          <p className="mt-4 max-w-[560px] text-base leading-7 text-brand-sage xl:text-lg">
            {t(
              'landing.short.subtitle',
              'AI помогает начать, гибкий редактор сохраняет ваш стиль, а заявки, оплаты и аналитика остаются рядом.'
            )}
          </p>

          <form onSubmit={handleSubmit} className="mt-7 max-w-[620px]">
            <div className="grid min-w-0 gap-1 rounded-md border border-brand-ink/30 bg-white p-1.5 md:grid-cols-[minmax(0,1fr)_auto]">
              <label className="flex h-12 min-w-0 items-center px-3" htmlFor="hero-slug">
                <span className="shrink-0 text-sm font-semibold text-brand-sage">
                  {t('landing.short.slugPrefix', 'lnkmx.my/')}
                </span>
                <input
                  id="hero-slug"
                  value={slug}
                  onChange={(event) => setSlug(sanitizeSlug(event.target.value))}
                  placeholder={t('landing.short.slugHint', 'ваше-имя')}
                  className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-[#98949B]"
                  aria-label={t('landing.short.slugAria', 'Короткий адрес страницы')}
                  maxLength={30}
                />
              </label>
              <Button
                type="submit"
                className="h-12 w-full rounded-md bg-brand-coral px-5 font-semibold text-white hover:bg-brand-coral/90 md:w-auto"
              >
                {t('landing.short.create', 'Создать страницу')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-medium">
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-brand-mint" />
              {t('landing.short.free', 'Бесплатный старт')}
            </span>
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-brand-mint" />
              {t('landing.short.noCode', 'Без кода')}
            </span>
            <button
              type="button"
              onClick={onExamples}
              className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand-blue hover:underline"
            >
              {t('landing.short.examples', 'Посмотреть примеры')}
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative hidden h-[440px] min-w-0 overflow-hidden rounded-lg border border-brand-ink/15 bg-white md:block lg:h-[520px]">
          <picture>
            <source srcSet="/brand/linkmax-hero-studio.webp" type="image/webp" />
            <img
              src="/brand/linkmax-hero-studio.png"
              alt="LinkMAX Studio Preview"
              className="absolute inset-0 h-full w-full object-cover object-center"
              width={2688}
              height={1536}
              fetchPriority="high"
            />
          </picture>
          <div className="absolute inset-x-0 bottom-0 border-t border-white/20 bg-brand-ink/90 p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/65">
              {t('landing.short.previewEyebrow', 'Всё в одном месте')}
            </p>
            <p className="mt-2 text-lg font-semibold">
              {t('landing.short.previewTitle', 'Страница, клиенты и оплата рядом')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
