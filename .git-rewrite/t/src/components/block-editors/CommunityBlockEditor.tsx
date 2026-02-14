import React from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import type { CommunityBlock } from '@/types/page';
import { createMultilingualString } from '@/lib/i18n-helpers';
import { Users, Crown, Star, Heart, Zap, Lock, MessageCircle, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CommunityBlockEditorProps {
  formData: Partial<CommunityBlock>;
  onChange: (data: Partial<CommunityBlock>) => void;
}

const iconsList = [
  { value: 'users', labelKey: 'iconUsers', icon: Users },
  { value: 'crown', labelKey: 'iconCrown', icon: Crown },
  { value: 'star', labelKey: 'iconStar', icon: Star },
  { value: 'heart', labelKey: 'iconHeart', icon: Heart },
  { value: 'zap', labelKey: 'iconZap', icon: Zap },
  { value: 'lock', labelKey: 'iconLock', icon: Lock },
] as const;

const stylesList = [
  { value: 'default', labelKey: 'styleDefault', descKey: 'styleDefaultDesc' },
  { value: 'premium', labelKey: 'stylePremium', descKey: 'stylePremiumDesc' },
  { value: 'exclusive', labelKey: 'styleExclusive', descKey: 'styleExclusiveDesc' },
] as const;

export function CommunityBlockEditor({ formData, onChange }: CommunityBlockEditorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          {t('blocks.community.hint', 'Добавьте ссылку на закрытый Telegram-канал или группу. Это повышает удержание клиентов и создаёт сообщество вокруг вашего бизнеса.')}
        </AlertDescription>
      </Alert>

      {/* Title */}
      <MultilingualInput
        label={t('blocks.community.title', 'Название')}
        value={typeof formData.title === 'string' ? createMultilingualString(formData.title) : (formData.title || createMultilingualString(''))}
        onChange={(value) => onChange({ title: value })}
        placeholder={t('blocks.community.titlePlaceholder', 'Мой закрытый клуб')}
      />

      {/* Description */}
      <MultilingualInput
        label={t('blocks.community.description', 'Описание')}
        value={typeof formData.description === 'string' ? createMultilingualString(formData.description) : (formData.description || createMultilingualString(''))}
        onChange={(value) => onChange({ description: value })}
        placeholder={t('blocks.community.descriptionPlaceholder', 'Эксклюзивный контент, закулисье, ответы на вопросы')}
        type="textarea"
      />

      {/* Telegram Link */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          {t('blocks.community.telegramLink', 'Ссылка на Telegram')}
        </Label>
        <Input
          value={formData.telegramLink || ''}
          onChange={(e) => onChange({ telegramLink: e.target.value })}
          placeholder="https://t.me/+ABC123..."
        />
        <p className="text-xs text-muted-foreground">
          {t('blocks.community.linkHint', 'Используйте инвайт-ссылку на ваш закрытый канал или группу')}
        </p>
      </div>

      {/* Member Count */}
      <div className="space-y-2">
        <Label>{t('blocks.community.memberCount', 'Количество участников')}</Label>
        <Input
          value={formData.memberCount || ''}
          onChange={(e) => onChange({ memberCount: e.target.value })}
          placeholder="500+ участников"
        />
      </div>

      {/* Button Text */}
      <MultilingualInput
        label={t('fields.buttonText', 'Текст кнопки')}
        value={typeof formData.buttonText === 'string' ? createMultilingualString(formData.buttonText) : (formData.buttonText || createMultilingualString(''))}
        onChange={(value) => onChange({ buttonText: value })}
        placeholder={t('blocks.community.join', 'Вступить')}
      />

      {/* Icon */}
      <div className="space-y-2">
        <Label>{t('blocks.community.icon', 'Иконка')}</Label>
        <div className="grid grid-cols-6 gap-2">
          {iconsList.map(({ value, labelKey, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ icon: value })}
              className={`p-3 rounded-lg border transition-all flex items-center justify-center ${
                formData.icon === value 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border hover:border-primary/50'
              }`}
              title={t(`blocks.community.${labelKey}`)}
            >
              <Icon className="h-5 w-5" />
            </button>
          ))}
        </div>
      </div>

      {/* Style */}
      <div className="space-y-2">
        <Label>{t('blocks.community.style', 'Стиль')}</Label>
        <Select
          value={formData.style || 'default'}
          onValueChange={(value) => onChange({ style: value as CommunityBlock['style'] })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {stylesList.map(({ value, labelKey, descKey }) => (
              <SelectItem key={value} value={value}>
                <div className="flex flex-col">
                  <span>{t(`blocks.community.${labelKey}`)}</span>
                  <span className="text-xs text-muted-foreground">{t(`blocks.community.${descKey}`)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
