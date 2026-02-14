import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateTestimonialBlock } from '@/lib/block-validators';
import { ArrayFieldList } from '@/components/form-fields/ArrayFieldList';
import { ArrayFieldItem } from '@/components/form-fields/ArrayFieldItem';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';

function TestimonialBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  const testimonials = formData.testimonials || [];

  const addTestimonial = () => {
    onChange({
      ...formData,
      testimonials: [...testimonials, { name: '', role: '', avatar: '', text: '', rating: 5 }],
    });
  };

  const removeTestimonial = (index: number) => {
    onChange({
      ...formData,
      testimonials: testimonials.filter((_: any, i: number) => i !== index),
    });
  };

  const updateTestimonial = (index: number, field: string, value: any) => {
    const updated = [...testimonials];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...formData, testimonials: updated });
  };

  return (
    <div className="space-y-4">
      <MultilingualInput
        label={t('fields.title', 'Title')}
        value={migrateToMultilingual(formData.title)}
        onChange={(value) => onChange({ ...formData, title: value })}
        placeholder="What People Say"
      />

      <ArrayFieldList label={t('fields.testimonials', 'Testimonials')} items={testimonials} onAdd={addTestimonial}>
        {testimonials.map((testimonial: any, index: number) => (
          <ArrayFieldItem
            key={index}
            index={index}
            label={t('fields.testimonial', 'Testimonial')}
            onRemove={() => removeTestimonial(index)}
          >
            <div>
              <Label className="text-xs">{t('fields.name', 'Name')}</Label>
              <Input
                value={testimonial.name}
                onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div>
              <Label className="text-xs">{t('fields.role', 'Role')} {t('fields.optional', '(optional)')}</Label>
              <Input
                value={testimonial.role || ''}
                onChange={(e) => updateTestimonial(index, 'role', e.target.value)}
                placeholder="CEO, Company"
              />
            </div>

            <div>
              <Label className="text-xs">{t('fields.avatarUrl', 'Avatar URL')} {t('fields.optional', '(optional)')}</Label>
              <Input
                type="url"
                value={testimonial.avatar || ''}
                onChange={(e) => updateTestimonial(index, 'avatar', e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <div>
              <Label className="text-xs">{t('fields.testimonialText', 'Testimonial Text')}</Label>
              <Textarea
                value={testimonial.text}
                onChange={(e) => updateTestimonial(index, 'text', e.target.value)}
                placeholder="This is an amazing product!"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-xs">{t('fields.rating', 'Rating')} (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={testimonial.rating || 5}
                onChange={(e) => updateTestimonial(index, 'rating', parseInt(e.target.value))}
              />
            </div>
          </ArrayFieldItem>
        ))}
      </ArrayFieldList>
    </div>
  );
}

export const TestimonialBlockEditor = withBlockEditor(TestimonialBlockEditorComponent, {
  hint: 'Display customer reviews and testimonials with ratings',
  validate: validateTestimonialBlock,
  isPremium: true,
  description: 'Showcase social proof with customer testimonials',
});
