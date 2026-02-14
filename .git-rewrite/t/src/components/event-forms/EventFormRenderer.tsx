/**
 * EventFormRenderer - Renders event form fields for public registration
 * Supports all Google Forms-like field types with proper validation
 */
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { Star, Crown } from 'lucide-react';
import { EventFileUpload } from './EventFileUpload';
import type { EventFormField } from '@/types/page';
import { cn } from '@/lib/utils';

type FormValue = string | string[] | boolean | number;

interface EventFormRendererProps {
  field: EventFormField;
  value: FormValue;
  onChange: (value: FormValue) => void;
  language: SupportedLanguage;
  disabled?: boolean;
  isPremium?: boolean;
  eventId?: string;
}

export const EventFormRenderer = memo(function EventFormRenderer({
  field,
  value,
  onChange,
  language,
  disabled = false,
  isPremium = false,
  eventId,
}: EventFormRendererProps) {
  const { t } = useTranslation();

  const label = getI18nText(field.label_i18n, language);
  const placeholder = field.placeholder_i18n
    ? getI18nText(field.placeholder_i18n, language)
    : undefined;
  const helpText = field.helpText_i18n
    ? getI18nText(field.helpText_i18n, language)
    : undefined;

  const isRequired = field.required || field.type === 'email';

  // Wrapper for consistent layout
  const FieldWrapper = useCallback(({ children, noLabel = false }: { children: React.ReactNode; noLabel?: boolean }) => (
    <div className="space-y-1.5">
      {!noLabel && label && (
        <Label className="text-sm font-medium">
          {label}
          {isRequired && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children}
      {helpText && (
        <p className="text-xs text-muted-foreground">{helpText}</p>
      )}
    </div>
  ), [label, helpText, isRequired]);

  // Layout-only fields
  if (field.type === 'section_header') {
    return (
      <div className="pt-4 pb-2">
        <h3 className="text-lg font-semibold">{label}</h3>
        {helpText && <p className="text-sm text-muted-foreground mt-1">{helpText}</p>}
      </div>
    );
  }

  if (field.type === 'description') {
    return (
      <div className="py-2 text-sm text-muted-foreground">
        {label}
      </div>
    );
  }

  // Media placeholders (Pro-only)
  if (field.type === 'media') {
    if (!isPremium) {
      return (
        <div className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
          <Crown className="h-4 w-4" />
          {t('event.mediaSection', 'Медиа-секция доступна в Pro')}
        </div>
      );
    }
    // For Pro users, show file upload for media
    return (
      <EventFileUpload
        value={typeof value === 'string' ? value : ''}
        onChange={(url) => onChange(url)}
        label={label || t('event.mediaUpload', 'Загрузить медиа')}
        helpText={helpText}
        required={isRequired}
        disabled={disabled}
        accept="image/*,video/*"
        maxSizeMB={25}
        eventId={eventId}
      />
    );
  }

  // File upload (Pro-only)
  if (field.type === 'file') {
    if (!isPremium) {
      return (
        <FieldWrapper>
          <div className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground text-center flex items-center justify-center gap-2">
            <Crown className="h-4 w-4" />
            {t('event.fileUploadPro', 'Загрузка файлов доступна в Pro')}
          </div>
        </FieldWrapper>
      );
    }
    return (
      <EventFileUpload
        value={typeof value === 'string' ? value : ''}
        onChange={(url) => onChange(url)}
        label={label || t('event.fileUpload', 'Загрузить файл')}
        helpText={helpText}
        required={isRequired}
        disabled={disabled}
        accept="*/*"
        maxSizeMB={10}
        eventId={eventId}
      />
    );
  }

  // Text inputs
  if (field.type === 'short_text' || field.type === 'email' || field.type === 'phone' || field.type === 'url') {
    const inputType = {
      short_text: 'text',
      email: 'email',
      phone: 'tel',
      url: 'url',
    }[field.type];

    return (
      <FieldWrapper>
        <Input
          type={inputType}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={isRequired}
        />
      </FieldWrapper>
    );
  }

  if (field.type === 'long_text') {
    return (
      <FieldWrapper>
        <Textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
        />
      </FieldWrapper>
    );
  }

  if (field.type === 'number') {
    return (
      <FieldWrapper>
        <Input
          type="number"
          value={typeof value === 'string' || typeof value === 'number' ? String(value) : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          min={field.validation?.min}
          max={field.validation?.max}
        />
      </FieldWrapper>
    );
  }

  // Date/Time inputs
  if (field.type === 'date') {
    return (
      <FieldWrapper>
        <Input
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </FieldWrapper>
    );
  }

  if (field.type === 'time') {
    return (
      <FieldWrapper>
        <Input
          type="time"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </FieldWrapper>
    );
  }

  if (field.type === 'datetime') {
    return (
      <FieldWrapper>
        <Input
          type="datetime-local"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </FieldWrapper>
    );
  }

  // Choice inputs
  if (field.type === 'dropdown') {
    return (
      <FieldWrapper>
        <Select
          value={typeof value === 'string' ? value : ''}
          onValueChange={(val) => onChange(val)}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder={placeholder || t('event.selectOption', 'Выберите вариант')} />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {getI18nText(option.label_i18n, language)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldWrapper>
    );
  }

  if (field.type === 'single_choice') {
    return (
      <FieldWrapper>
        <RadioGroup
          value={typeof value === 'string' ? value : ''}
          onValueChange={(val) => onChange(val)}
          disabled={disabled}
        >
          {(field.options || []).map((option) => (
            <div key={option.id} className="flex items-center space-x-2">
              <RadioGroupItem value={option.id} id={`${field.id}-${option.id}`} />
              <Label htmlFor={`${field.id}-${option.id}`} className="text-sm font-normal cursor-pointer">
                {getI18nText(option.label_i18n, language)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </FieldWrapper>
    );
  }

  if (field.type === 'multiple_choice') {
    const currentValues = Array.isArray(value) ? value : [];
    return (
      <FieldWrapper>
        <div className="space-y-2">
          {(field.options || []).map((option) => {
            const isChecked = currentValues.includes(option.id);
            return (
              <label key={option.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    const newValue = checked
                      ? [...currentValues, option.id]
                      : currentValues.filter((id) => id !== option.id);
                    onChange(newValue);
                  }}
                  disabled={disabled}
                />
                {getI18nText(option.label_i18n, language)}
              </label>
            );
          })}
        </div>
      </FieldWrapper>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <Checkbox
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(Boolean(checked))}
          disabled={disabled}
        />
        <span>
          {label}
          {isRequired && <span className="text-destructive ml-1">*</span>}
        </span>
      </label>
    );
  }

  // Linear scale
  if (field.type === 'linear_scale') {
    const min = field.linearScale?.min ?? 1;
    const max = field.linearScale?.max ?? 10;
    const currentValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : min;
    const minLabel = field.linearScale?.minLabel_i18n
      ? getI18nText(field.linearScale.minLabel_i18n, language)
      : String(min);
    const maxLabel = field.linearScale?.maxLabel_i18n
      ? getI18nText(field.linearScale.maxLabel_i18n, language)
      : String(max);

    return (
      <FieldWrapper>
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{minLabel}</span>
            <span className="font-medium text-foreground text-sm">{currentValue}</span>
            <span>{maxLabel}</span>
          </div>
          <Slider
            value={[currentValue]}
            onValueChange={([val]) => onChange(val)}
            min={min}
            max={max}
            step={1}
            disabled={disabled}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((n) => (
              <span key={n} className="w-4 text-center">{n}</span>
            ))}
          </div>
        </div>
      </FieldWrapper>
    );
  }

  // Star rating
  if (field.type === 'rating') {
    const currentRating = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : 0;
    return (
      <FieldWrapper>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              disabled={disabled}
              className="p-1 hover:scale-110 transition-transform focus:outline-none"
            >
              <Star
                className={cn(
                  'h-7 w-7 transition-colors',
                  star <= currentRating
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-muted-foreground/40'
                )}
              />
            </button>
          ))}
        </div>
      </FieldWrapper>
    );
  }

  // Grid types (simplified for now)
  if (field.type === 'grid' || field.type === 'checkbox_grid') {
    return (
      <FieldWrapper>
        <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-4 text-center">
          {t('event.gridComingSoon', 'Сетка вопросов скоро будет доступна')}
        </div>
      </FieldWrapper>
    );
  }

  // Default fallback
  return (
    <FieldWrapper>
      <Input
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />
    </FieldWrapper>
  );
});
