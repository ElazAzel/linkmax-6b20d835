import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import ArrowUpRight from 'lucide-react/dist/esm/icons/arrow-up-right';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import type { CardBlock as CardBlockType } from '@/types/page';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { getSafeHref } from '@/lib/blocks/safe-href';
import { cn } from '@/lib/utils/utils';

interface CardBlockProps {
  block: CardBlockType;
  isPreview?: boolean;
  onClick?: () => void;
}

/**
 * Korner-style card: the photo across the whole card on top (cropped to
 * 4:3), then copy and one button. The old "photo on the right" option left a
 * small square thumbnail, so saved cards render this way too.
 */
export const CardBlock = memo(function CardBlock({ block, isPreview, onClick }: CardBlockProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language as SupportedLanguage;
  const title = getI18nText(block.title, lang);
  const text = getI18nText(block.text, lang);
  const buttonText = getI18nText(block.buttonText, lang);
  const href = getSafeHref(block.url);
  const outline = block.buttonStyle === 'outline';

  const photo = (
    <div
      className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-t-[var(--lm-block-surface-radius,var(--lm-block-radius,24px))] bg-muted"
    >
      {block.image ? (
        <img src={block.image} alt={title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/60" aria-hidden>
          <ImageIcon className="h-7 w-7" />
        </div>
      )}
    </div>
  );

  // Without a button label the whole card is the link.
  const wholeCardLink = !!href && !buttonText;
  const body = (
    <div className="flex w-full min-w-0 flex-col text-left">
      {(block.image || isPreview) && photo}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 p-4 sm:p-5">
        {title && <h3 className="break-words text-lg font-bold leading-snug tracking-tight text-foreground [text-wrap:balance]">{title}</h3>}
        {text && <p className="whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">{text}</p>}
        {buttonText && (
          href ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClick}
              className={cn(
                'mt-1 inline-flex h-10 w-fit max-w-full items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-transform active:scale-[0.97]',
                outline ? 'border border-foreground text-foreground hover:bg-foreground/5' : 'bg-foreground text-background hover:bg-foreground/90',
              )}
            >
              <span className="truncate">{buttonText}</span>
              <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
            </a>
          ) : (
            <span className={cn(
              'mt-1 inline-flex h-10 w-fit max-w-full items-center rounded-full px-4 text-sm font-semibold opacity-60',
              outline ? 'border border-foreground text-foreground' : 'bg-foreground text-background',
            )}>
              <span className="truncate">{buttonText}</span>
            </span>
          )
        )}
      </div>
    </div>
  );

  return wholeCardLink ? (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={onClick} className="block w-full rounded-[inherit] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {body}
    </a>
  ) : body;
});
