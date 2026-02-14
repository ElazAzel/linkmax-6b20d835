import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      testimonials: [...testimonials, { 
        name: { ru: '', en: '', kk: '' }, 
        role: { ru: '', en: '', kk: '' }, 
        avatar: '', 
        text: { ru: '', en: '', kk: '' }, 
        rating: 5 
      }],
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
        placeholder={t('fields.whatPeopleSay', 'What People Say')}
      />

      <ArrayFieldList label={t('fields.testimonials', 'Testimonials')} items={testimonials} onAdd={addTestimonial}>
        {testimonials.map((testimonial: any, index: number) => (
          <ArrayFieldItem
            key={index}
            index={index}
            label={t('fields.testimonial', 'Testimonial')}
            onRemove={() => removeTestimonial(index)}
          >
            <MultilingualInput
              label={t('fields.name', 'Name')}
              value={migrateToMultilingual(testimonial.name)}
              onChange={(value) => updateTestimonial(index, 'name', value)}
              placeholder="John Doe"
            />

            <MultilingualInput
              label={`${t('fields.role', 'Role')} (${t('fields.optional', 'optional')})`}
              value={migrateToMultilingual(testimonial.role)}
              onChange={(value) => updateTestimonial(index, 'role', value)}
              placeholder="CEO, Company"
            />

            <div>
              <Label className="text-xs">{t('fields.avatarUrl', 'Avatar URL')} ({t('fields.optional', 'optional')})</Label>
              <Input
                type="url"
                value={testimonial.avatar || ''}
                onChange={(e) => updateTestimonial(index, 'avatar', e.target.value)}
                placeholder="https://example.com/avatar.jpg"
              />
            </div>

            <MultilingualInput
              label={t('fields.testimonialText', 'Testimonial Text')}
              value={migrateToMultilingual(testimonial.text)}
              onChange={(value) => updateTestimonial(index, 'text', value)}
              type="textarea"
              placeholder={t('fields.testimonialPlaceholder', 'This is an amazing product!')}
            />

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
