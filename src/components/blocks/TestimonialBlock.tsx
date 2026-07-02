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
          className={cn('h-3 w-3', i < rating ? 'fill-primary text-primary' : 'text-muted-foreground/30')}
        />
      ))}
    </div>
  );

  return (
    <div
      className="w-full"
      style={{
        backgroundColor: block.blockStyle?.backgroundColor,
        backgroundImage: block.blockStyle?.backgroundGradient,
      }}
    >
      {title && <SectionHeader icon={<Quote className="h-4 w-4" />} title={title} />}

      <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
        {block.testimonials?.filter(Boolean).map((testimonial, index) => {
          if (!testimonial) return null;
          const name = getI18nText(testimonial.name, currentLang) || '';
          const text = getI18nText(testimonial.text, currentLang);
          const role = getI18nText(testimonial.role, currentLang);

          return (
            <div
              key={index}
              className="qb-card qb-card-hover flex-shrink-0 w-[85%] min-w-[280px] max-w-[340px] p-5 snap-start"
            >
              <div className="flex items-start gap-4">
                <Avatar className="h-11 w-11 flex-shrink-0">
                  <AvatarImage src={testimonial.avatar} alt={name} />
                  <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                    {name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate text-foreground">{name}</div>
                      {role && (
                        <div className="text-xs text-muted-foreground truncate">{role}</div>
                      )}
                    </div>
                    {testimonial.rating && renderStars(testimonial.rating)}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    "{text}"
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
