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
    <section className="relative isolate min-h-[min(820px,88svh)] overflow-hidden bg-[#F4F5F0] text-[#16131A]">
      <picture className="absolute inset-y-0 right-0 -z-20 w-full md:w-[40%]">
        <source srcSet="/brand/linkmax-hero-studio.webp" type="image/webp" />
        <img
          src="/brand/linkmax-hero-studio.png"
          alt=""
          className="h-full w-full object-cover object-right"
          width={2688}
          height={1536}
          fetchPriority="high"
        />
      </picture>
      <div className="absolute inset-0 -z-10 bg-[#F4F5F0]/90 md:right-[40%] md:bg-[#F4F5F0]" aria-hidden="true" />

      <div className="mx-auto flex min-h-[min(820px,88svh)] max-w-[1440px] flex-col px-4 pb-8 pt-24 sm:px-6 sm:pt-28 lg:px-10">
        <div className="flex max-w-[720px] flex-1 flex-col justify-center py-8 md:max-w-[58%]">
          <div className="mb-5 flex items-center gap-3 text-sm font-semibold">
            <span className="h-2.5 w-2.5 bg-[#C93618]" aria-hidden="true" />
            {t('landing.short.eyebrow', 'Сайт, заявки и продажи в одной системе')}
          </div>

          <h1 className="font-display text-5xl font-bold leading-none text-[#16131A] sm:text-6xl xl:text-7xl">
            LinkMAX
          </h1>
          <p className="mt-5 max-w-[590px] text-xl font-semibold leading-snug xl:text-2xl">
            {t('landing.short.title', 'Соберите рабочую страницу бизнеса и управляйте клиентами без лишних сервисов')}
          </p>
          <p className="mt-4 max-w-[560px] text-base leading-7 text-[#4E4952] xl:text-lg">
            {t(
              'landing.short.subtitle',
              'AI помогает начать, гибкий редактор сохраняет ваш стиль, а заявки, оплаты и аналитика остаются рядом.'
            )}
          </p>

          <form onSubmit={handleSubmit} className="mt-7 max-w-[620px]">
            <div className="grid min-w-0 gap-2 border border-[#16131A] bg-white p-2 shadow-[4px_4px_0_#16131A] xl:grid-cols-[minmax(0,1fr)_auto]">
              <label className="flex h-12 min-w-0 items-center px-3" htmlFor="hero-slug">
                <span className="shrink-0 text-sm font-semibold text-[#68636D]">
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
                className="h-12 w-full rounded-md bg-[#C93618] px-5 font-semibold text-white hover:bg-[#A92D16] xl:w-auto"
              >
                {t('landing.short.create', 'Создать страницу')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm font-medium">
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-[#087A54]" />
              {t('landing.short.free', 'Бесплатный старт')}
            </span>
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-[#087A54]" />
              {t('landing.short.noCode', 'Без кода')}
            </span>
            <button
              type="button"
              onClick={onExamples}
              className="inline-flex min-h-11 items-center gap-2 font-semibold text-[#2F52E0] hover:underline"
            >
              {t('landing.short.examples', 'Посмотреть примеры')}
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
}
