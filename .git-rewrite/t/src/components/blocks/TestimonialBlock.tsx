import { memo } from 'react';
import { Star, Crown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TestimonialBlock as TestimonialBlockType } from '@/types/page';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';

interface TestimonialBlockProps {
  block: TestimonialBlockType;
}

export const TestimonialBlock = memo(function TestimonialBlock({ block }: TestimonialBlockProps) {
  const { i18n } = useTranslation();
  
  const title = getTranslatedString(block.title, i18n.language as SupportedLanguage);

  const renderStars = (rating: number = 5) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? 'fill-primary text-primary' : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {title && (
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">{title}</h3>
          <Crown className="h-4 w-4 text-primary" />
        </div>
      )}
      <div className="grid gap-4">
        {block.testimonials.map((testimonial, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    {testimonial.role && (
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    )}
                  </div>
                  {testimonial.rating && renderStars(testimonial.rating)}
                </div>
                <p className="text-sm text-muted-foreground italic">"{testimonial.text}"</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
});
