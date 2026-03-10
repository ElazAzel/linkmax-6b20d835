import { memo } from 'react';
import Star from 'lucide-react/dist/esm/icons/star';
import Quote from 'lucide-react/dist/esm/icons/quote';
import { useTranslation } from 'react-i18next';
import type { TestimonialBlock as TestimonialBlockType } from '@/types/page';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils/utils';

interface TestimonialBlockProps {
  block: TestimonialBlockType;
}

export const TestimonialBlock = memo(function TestimonialBlock({ block }: TestimonialBlockProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language as SupportedLanguage;

  const title = getI18nText(block.title, currentLang);

  const renderStars = (rating: number = 5) => {
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3 w-3",
              i < rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      className="w-full space-y-3"
      style={{
        backgroundColor: block.blockStyle?.backgroundColor,
        backgroundImage: block.blockStyle?.backgroundGradient,
      }}
    >
      {title && (
        <div className="flex items-center gap-3 px-2 mb-4">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Quote className="h-4 w-4" />
          </div>
          <h3 className="font-bold text-sm text-gradient">{title}</h3>
        </div>
      )}

      {/* Horizontal scroll on mobile */}
      <div className="flex gap-4 overflow-x-auto pb-6 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
        {block.testimonials?.filter(Boolean).map((testimonial, index) => {
          if (!testimonial) return null;
          const name = getI18nText(testimonial.name, currentLang) || '';
          const text = getI18nText(testimonial.text, currentLang);
          const role = getI18nText(testimonial.role, currentLang);

          return (
            <div
              key={index}
              className={cn(
                "flex-shrink-0 w-[85%] min-w-[280px] max-w-[340px]",
                "p-5 rounded-2xl",
                "glass-card backdrop-blur-md border-white/10",
                "shadow-glass hover:shadow-glass-lg transition-all duration-300",
                "snap-start hover:scale-[1.02] active:scale-[0.98]"
              )}
            >
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-primary/20 shadow-sm">
                  <AvatarImage src={testimonial.avatar} alt={name} />
                  <AvatarFallback className="text-xs font-bold bg-primary/5 text-primary">{name?.[0] || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate text-foreground">{name}</div>
                      {role && (
                        <div className="text-xs font-bold text-primary/60 uppercase tracking-widest truncate">{role}</div>
                      )}
                    </div>
                    {testimonial.rating && renderStars(testimonial.rating)}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed italic opacity-90">
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
