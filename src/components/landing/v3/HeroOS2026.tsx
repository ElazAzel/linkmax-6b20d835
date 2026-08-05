import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { sanitizeSlug } from '@/lib/utils/slug';
import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import Check from 'lucide-react/dist/esm/icons/check';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import { PagePreviewMock } from './PagePreviewMock';

interface HeroOS2026Props {
  onStart: (desiredSlug?: string) => void;
  onExamples: () => void;
}

export function HeroOS2026({ onStart, onExamples }: HeroOS2026Props) {
  const { t } = useTranslation();
  const [slug, setSlug] = useState('');
  const cleanSlug = sanitizeSlug(slug);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onStart(cleanSlug || undefined);
  };

  return (
    <section className="relative overflow-hidden border-b border-brand-ink/15 bg-brand-canvas text-brand-ink">
      {/* subtle ruled background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(to right, hsl(var(--brand-ink)) 1px, transparent 1px)',
          backgroundSize: '88px 100%',
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-[1180px] items-center gap-10 px-4 pb-14 pt-24 sm:px-6 sm:pt-28 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:gap-14 lg:px-8 lg:pb-20">
        <div className="min-w-0">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-ink/20 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em]">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-coral" aria-hidden="true" />
            {t('landing.short.eyebrow', 'Страница, заявки и оплата')}
          </div>

          <h1 className="font-display text-[2.5rem] font-bold leading-[1.03] tracking-tight text-brand-ink sm:text-6xl xl:text-[4.25rem]">
            {t('landing.short.h1', 'Одна ссылка — вся ваша работа с клиентами')}
          </h1>

          <p className="mt-6 max-w-[560px] text-lg leading-8 text-brand-sage sm:text-xl">
            {t(
              'landing.short.subtitle',
              'LinkMAX собирает услуги, ссылки, запись, оплату и заявки в одну страницу. Без кода и долгой настройки.'
            )}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 max-w-[560px]">
            <div className="grid min-w-0 gap-1.5 rounded-2xl border border-brand-ink/25 bg-white p-1.5 sm:grid-cols-[minmax(0,1fr)_auto]">
              <label className="flex h-12 min-w-0 items-center px-3" htmlFor="hero-slug">
                <span className="shrink-0 font-metric text-sm font-semibold text-brand-sage">
                  {t('landing.short.slugPrefix', 'lnkmx.my/')}
                </span>
                <input
                  id="hero-slug"
                  value={slug}
                  onChange={(event) => setSlug(sanitizeSlug(event.target.value))}
                  placeholder={t('landing.short.slugHint', 'ваше-имя')}
                  className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-brand-sage/60"
                  aria-label={t('landing.short.slugAria', 'Короткий адрес страницы')}
                  maxLength={30}
                />
              </label>
              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-brand-coral px-6 text-base font-bold text-white hover:bg-brand-coral/90 sm:w-auto"
              >
                {t('landing.short.create', 'Создать страницу')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium">
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-brand-mint" />
              {t('landing.short.free', 'Бесплатный старт')}
            </span>
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-brand-mint" />
              {t('landing.short.noCode', 'без кода')}
            </span>
            <button
              type="button"
              onClick={onExamples}
              className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-ink underline decoration-brand-coral decoration-2 underline-offset-4 hover:text-brand-coral"
            >
              {t('landing.short.examples', 'посмотреть примеры')}
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative min-w-0 pb-6 lg:pb-0">
          <PagePreviewMock />
        </div>
      </div>
    </section>
  );
}
