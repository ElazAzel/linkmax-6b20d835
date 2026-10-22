import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils/utils';
import { getI18nText, type I18nText } from '@/lib/i18n-helpers';
import type { PageTheme } from '@/types/page';
import { getPageThemeScope } from '@/lib/appearance/style-utils';

type PreviewBlock = Record<string, unknown> & { type: string };
interface TemplatePreviewCardProps {
  blocks: unknown;
  className?: string;
  showBlockCount?: boolean;
  theme?: Partial<PageTheme>;
}

/** A miniature content preview: actual photos, headings and offers from the recipe. */
export const TemplatePreviewCard = memo(function TemplatePreviewCard({ blocks, theme, className, showBlockCount = true }: TemplatePreviewCardProps) {
  const { i18n, t } = useTranslation();
  const text = (value: unknown) => getI18nText(value as string | I18nText | undefined, i18n.language);
  const list: PreviewBlock[] = Array.isArray(blocks)
    ? blocks.filter((block) => block && typeof block === 'object').map((block) => ({ ...block, ...(block.overrides || {}) }))
    : [];
  const profile = list.find((block) => block.type === 'profile');
  const scope = getPageThemeScope(theme);
  const content = list.filter((block) => block.type !== 'profile').slice(0, 5);
  const thumbnail = (url: unknown, alt: string, extra = '') => typeof url === 'string' && url
    ? <img src={url} alt={alt} loading="lazy" decoding="async" className={cn('h-full w-full object-cover', extra)} />
    : null;

  return <div style={theme ? { ...scope.style, backgroundColor: theme.backgroundColor, color: theme.textColor } : undefined} className={cn('relative h-full w-full overflow-hidden rounded-xl bg-stone-200 p-3 dark:bg-stone-900', theme && scope.className, className)}>
    <div aria-hidden="true" className="mx-auto flex h-full max-w-[230px] flex-col overflow-hidden rounded-xl bg-background shadow-xl ring-1 ring-black/5">
      {profile && <div className="relative shrink-0 overflow-hidden pb-2">
        {typeof profile.coverImage === 'string' && profile.coverImage && <div className="h-12 overflow-hidden">{thumbnail(profile.coverImage, '')}</div>}
        <div className="flex items-center gap-2 px-3 pt-2">
          {typeof profile.avatar === 'string' && profile.avatar
            ? <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full">{thumbnail(profile.avatar, '')}</div>
            : <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{text(profile.name).slice(0, 1)}</div>}
          <div className="min-w-0"><p className="truncate text-[9px] font-semibold leading-tight">{text(profile.name)}</p><p className="mt-0.5 line-clamp-2 text-[7px] leading-tight text-muted-foreground">{text(profile.bio)}</p></div>
        </div>
      </div>}
      <div className="flex-1 space-y-1.5 overflow-hidden px-2 pb-2">
        {content.map((block, index) => {
          const items = (Array.isArray(block.items) ? block.items : []) as Record<string, unknown>[];
          const images = (Array.isArray(block.images) ? block.images : []) as Record<string, unknown>[];
          const title = text(block.title || block.name);
          return <div key={index} className="overflow-hidden rounded-md border border-border/50">
            {['image', 'carousel', 'tiles'].includes(block.type) ? <div className="grid h-16 grid-flow-col auto-cols-fr gap-0.5">
              {(block.type === 'image' ? [{ url: block.url, alt: block.alt }] : block.type === 'tiles' ? items.map((item) => ({ url: item.image, alt: item.title })) : images).slice(0, 3)
                .map((item, imageIndex) => <div key={imageIndex} className="overflow-hidden bg-muted">{thumbnail(item.url, '')}</div>)}
            </div> : block.type === 'card' || block.type === 'product' ? <div className="flex min-h-9 items-center gap-2">
              {Boolean(block.image) && <div className="h-12 w-14 shrink-0 overflow-hidden">{thumbnail(block.image, '')}</div>}
              <div className="min-w-0 p-1.5"><p className="line-clamp-1 text-[8px] font-semibold">{title}</p><p className="line-clamp-2 text-[7px] text-muted-foreground">{text(block.text || block.description)}</p></div>
            </div> : block.type === 'catalog' || block.type === 'pricing' ? <div className="space-y-1 p-2">
              {items.slice(0, 2).map((item, itemIndex) => <div key={itemIndex} className="flex justify-between gap-2 text-[7px]"><span className="truncate">{text(item.name)}</span><span className="shrink-0 font-medium">{typeof item.price === 'number' ? item.price.toLocaleString(i18n.language) : ''} {text(item.currency || block.currency)}</span></div>)}
            </div> : block.type === 'link' || block.type === 'button' || block.type === 'messenger' ? <div className="truncate bg-primary px-2 py-2 text-center text-[7px] font-medium text-primary-foreground">{title || t('profile.contact', 'Связаться')}</div>
              : <div className="p-2 text-[7px] leading-relaxed text-foreground/80"><p className="line-clamp-3 whitespace-pre-line">{text(block.content || block.title).replace(/[#*_]/g, '')}</p></div>}
          </div>;
        })}
      </div>
    </div>
    {showBlockCount && list.length > 0 && <span className="absolute bottom-2 right-2 rounded-full border bg-background/90 px-2 py-0.5 text-[9px] text-muted-foreground">{list.length} {t('algorithmBuilder.blocksCreated', 'блоков')}</span>}
  </div>;
});
