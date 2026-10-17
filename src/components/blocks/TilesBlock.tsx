import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import type { TilesBlock as TilesBlockType, TileItem } from '@/types/page';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { getSafeHref } from '@/lib/blocks/safe-href';
import { cn } from '@/lib/utils/utils';

interface TilesBlockProps {
  block: TilesBlockType;
  onClick?: () => void;
}

/** Korner-style grid of picture tiles with the caption over the photo. */
export const TilesBlock = memo(function TilesBlock({ block, onClick }: TilesBlockProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language as SupportedLanguage;
  const title = getI18nText(block.title, lang);
  const items = Array.isArray(block.items) ? block.items : [];
  const columns = block.columns === 3 ? 'grid-cols-3' : 'grid-cols-2';
  const aspect = block.aspect === 'portrait' ? 'aspect-[4/5]' : 'aspect-square';

  const tile = (item: TileItem) => {
    const caption = getI18nText(item.title, lang);
    const href = getSafeHref(item.url);
    const inner = (
      <>
        {item.image ? (
          <img src={item.image} alt={caption} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground/60" aria-hidden>
            <ImageIcon className="h-7 w-7" />
          </div>
        )}
        {caption && (
          <>
            <div aria-hidden className={cn('absolute inset-x-0 bottom-0 h-2/3', item.image ? 'bg-gradient-to-t from-black/70 via-black/25 to-transparent' : '')} />
            {/* Clamp an inner span: clamping the padded box let a third line show in the padding */}
            <span className={cn(
              'absolute inset-x-0 bottom-0 p-3 text-left text-sm font-semibold leading-snug',
              item.image ? 'text-white' : 'text-foreground',
            )}>
              <span className="line-clamp-2 break-words">{caption}</span>
            </span>
          </>
        )}
      </>
    );
    const className = cn('group relative block overflow-hidden rounded-[calc(var(--lm-block-radius,24px)-4px)] bg-card shadow-[0_1px_3px_rgb(0_0_0/0.08)]', aspect);
    return href ? (
      <a key={item.id} href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className={cn(className, 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')}>
        {inner}
      </a>
    ) : (
      <div key={item.id} className={className}>{inner}</div>
    );
  };

  return (
    <div className="w-full space-y-3">
      {title && <h3 className="px-1 text-lg font-bold tracking-tight text-foreground">{title}</h3>}
      <div className={cn('grid gap-3', columns)}>{items.map(tile)}</div>
    </div>
  );
});
