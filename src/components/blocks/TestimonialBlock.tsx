import { memo } from 'react';
import Star from 'lucide-react/dist/esm/icons/star';
import Quote from 'lucide-react/dist/esm/icons/quote';
import { useTranslation } from 'react-i18next';
import type { TestimonialBlock as TestimonialBlockType } from '@/types/page';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils/utils';
import { SectionHeader } from './shells/BlockShell';

interface TestimonialBlockProps {
  block: TestimonialBlockType;
}

export const TestimonialBlock = memo(function TestimonialBlock({ block }: TestimonialBlockProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language as SupportedLanguage;

  const title = getI18nText(block.title, currentLang);

  const renderStars = (rating: number = 5) => (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn('h-3.5 w-3.5', i < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30')}
        />
      ))}
    </div>
  );

  // The cell already pads the block when the owner chose a padding (older
  // blocks were created with one); padding here as well doubled it to ~44px.
  const pad = !block.blockStyle?.padding || block.blockStyle.padding === 'none';

  return (
    <div
      className="w-full"
      style={{
        backgroundColor: block.blockStyle?.backgroundColor,
        backgroundImage: block.blockStyle?.backgroundGradient,
      }}
    >
      {title && <SectionHeader className={cn(pad && 'px-5 pt-4', 'mb-1')} icon={<Quote className="h-4 w-4" />} title={title} />}

      {/* One flat list inside the block's own card: every review is visible on
          any device (the old swipe row hid the rest behind a hidden scrollbar). */}
      <ul className={cn("divide-y divide-border/60", pad && "px-5 py-2")}>
        {block.testimonials?.filter(Boolean).map((testimonial, index) => {
          if (!testimonial) return null;
          const name = getI18nText(testimonial.name, currentLang) || '';
          const text = getI18nText(testimonial.text, currentLang);
          const role = getI18nText(testimonial.role, currentLang);

          return (
            <li key={(testimonial as { id?: string }).id ?? index} className="py-4 first:pt-1 last:pb-1">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={testimonial.avatar} alt={name} />
                  <AvatarFallback className="bg-muted text-xs font-semibold text-foreground">
                    {name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-foreground">{name}</div>
                  {role && <div className="truncate text-xs text-muted-foreground">{role}</div>}
                </div>
                {testimonial.rating ? renderStars(testimonial.rating) : null}
              </div>
              {text && (
                <p className="mt-2.5 text-[15px] leading-relaxed text-foreground/85 [text-wrap:pretty]">
                  {i18n.language === "en" ? `“${text}”` : `«${text}»`}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
});
