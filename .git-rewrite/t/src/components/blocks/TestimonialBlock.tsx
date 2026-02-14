import { memo } from 'react';
import { Star, Quote } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TestimonialBlock as TestimonialBlockType } from '@/types/page';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import { cn } from '@/lib/utils';

interface TestimonialBlockProps {
  block: TestimonialBlockType;
}

export const TestimonialBlock = memo(function TestimonialBlock({ block }: TestimonialBlockProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language as SupportedLanguage;
  
  const title = getTranslatedString(block.title, currentLang);

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
        <div className="flex items-center gap-2 px-1">
          <Quote className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
      )}
      
      {/* Horizontal scroll on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
        {block.testimonials.map((testimonial, index) => {
          const name = getTranslatedString(testimonial.name, currentLang);
          const text = getTranslatedString(testimonial.text, currentLang);
          const role = getTranslatedString(testimonial.role, currentLang);
          
          return (
            <div 
              key={index} 
              className={cn(
                "flex-shrink-0 w-[85%] min-w-[260px] max-w-[320px]",
                "p-5 rounded-xl",
                "bg-card border border-border",
                "shadow-sm snap-start"
              )}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={testimonial.avatar} alt={name} />
                  <AvatarFallback className="text-xs">{name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <div className="font-medium text-sm truncate">{name}</div>
                      {role && (
                        <div className="text-xs text-muted-foreground truncate">{role}</div>
                      )}
                    </div>
                    {testimonial.rating && renderStars(testimonial.rating)}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
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
