'use client';
import { useNavigate } from 'react-router-dom';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { EditorSection, EditorField } from './EditorSection';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { FrameGridSelector } from '@/components/editor/FramePreview';
import Crown from 'lucide-react/dist/esm/icons/crown';
import Lock from 'lucide-react/dist/esm/icons/lock';
import User from 'lucide-react/dist/esm/icons/user';
import ImageIcon from 'lucide-react/dist/esm/icons/image';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Video from 'lucide-react/dist/esm/icons/video';
import { AVATAR_ICON_OPTIONS, VERIFICATION_COLOR_OPTIONS, VERIFICATION_POSITION_OPTIONS, VERIFICATION_ICON_OPTIONS } from '@/lib/avatar-frame-utils';
import { getLucideIcon } from '@/lib/utils/icon-utils';
import { Badge } from '@/components/ui/badge';
import { getRandomSuggestion } from '@/lib/intelligence/writing-algorithm';
import { useDashboard } from '@/hooks/dashboard/useDashboard';
import { useFreemiumLimits } from '@/hooks/user/useFreemiumLimits';
import { NAME_ANIMATION_OPTIONS, type NameAnimationType } from '@/lib/profile-frame-system';
import type { ProfileFrameStyle } from '@/types/blocks/content';
import { toast } from 'sonner';

const COUNTRY_OPTIONS = [
  { value: 'KZ', label: '🇰🇿 Казахстан' },
  { value: 'RU', label: '🇷🇺 Россия' },
  { value: 'UZ', label: '🇺🇿 Узбекистан' },
  { value: 'KG', label: '🇰🇬 Кыргызстан' },
  { value: 'BY', label: '🇧🇾 Беларусь' },
  { value: 'UA', label: '🇺🇦 Украина' },
  { value: 'GE', label: '🇬🇪 Грузия' },
  { value: 'AZ', label: '🇦🇿 Азербайджан' },
  { value: 'TJ', label: '🇹🇯 Таджикистан' },
  { value: 'TM', label: '🇹🇲 Туркменистан' },
  { value: 'AM', label: '🇦🇲 Армения' },
  { value: 'MD', label: '🇲🇩 Молдова' },
  { value: 'TR', label: '🇹🇷 Турция' },
  { value: 'AE', label: '🇦🇪 ОАЭ' },
  { value: 'US', label: '🇺🇸 США' },
  { value: 'OTHER', label: '🌍 Другая' },
];

function ProfileBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { canUseVerificationBadge, canUsePremiumFrames, currentTier } = useFreemiumLimits();
  const { pageData, updateEntityFields } = useDashboard();
  const niche = pageData?.niche || 'general';

  const handleMagicWandName = () => {
    const suggestion = getRandomSuggestion(niche, 'heading', {
      profession: t(`niches.${niche}`, niche),
    });
    const currentName = migrateToMultilingual(formData.name);
    onChange({ ...formData, name: { ...currentName, ru: suggestion } });
    toast.success(t('ai.suggestionApplied', 'Предложение применено'));
  };

  const handleMagicWandBio = () => {
    const suggestion = getRandomSuggestion(niche, 'description', {
      profession: t(`niches.${niche}`, niche),
    });
    const currentBio = migrateToMultilingual(formData.bio);
    onChange({ ...formData, bio: { ...currentBio, ru: suggestion } });
    toast.success(t('ai.suggestionApplied', 'Предложение применено'));
  };

  const isPremiumFrameType = (frame: string) => {
    const freeFrames = ['default', 'circle', 'rounded', 'square', 'none', 'solid', 'double', 'dashed'];
    return !freeFrames.includes(frame);
  };

  const isPremiumAnimation = (anim: string) => anim !== 'none';

  // Location from pageData
  const currentCity = (pageData as any)?.city || '';
  const currentCountry = (pageData as any)?.country_code || '';

  const handleLocationChange = (field: string, value: string) => {
    updateEntityFields?.({ [field]: value });
  };

  return (
    <div className="space-y-3">
      {/* Section 1: Basic Info */}
      <EditorSection
        title={t('editor.sections.basicInfo', 'Основное')}
        icon={<User className="h-5 w-5 text-primary" />}
        defaultOpen={true}
      >
        <MediaUpload
          label={t('fields.avatarUrl', 'Аватар')}
          value={formData.avatar || ''}
          onChange={(avatar) => onChange({ ...formData, avatar })}
          accept="image/*"
          allowGif={true}
        />

        <MultilingualInput
          label={t('fields.name', 'Имя')}
          value={migrateToMultilingual(formData.name)}
          onChange={(value) => onChange({ ...formData, name: value })}
          placeholder={t('placeholders.yourName', 'Ваше имя')}
          onMagicWand={handleMagicWandName}
          magicWandTitle={t('ai.generateHeadline', 'Сгенерировать заголовок')}
        />

        {/* Name Animation */}
        <EditorField label={t('fields.nameAnimation', 'Анимация имени')}>
          <Select
            value={formData.nameAnimation || 'none'}
            onValueChange={(value: string) => {
              if (isPremiumAnimation(value) && !canUsePremiumFrames()) {
                navigate('/pricing');
                return;
              }
              onChange({ ...formData, nameAnimation: value as NameAnimationType });
            }}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NAME_ANIMATION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    {t(opt.labelKey, opt.label)}
                    {opt.isPro && (
                      <Crown className="h-3 w-3 text-amber-500" />
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </EditorField>

        <MultilingualInput
          label={t('fields.bio', 'Био')}
          value={migrateToMultilingual(formData.bio)}
          onChange={(value) => onChange({ ...formData, bio: value })}
          type="textarea"
          placeholder={t('placeholders.tellAboutYourself', 'Расскажите о себе...')}
          enableRichText={true}
          onMagicWand={handleMagicWandBio}
          magicWandTitle={t('ai.generateBio', 'Сгенерировать био')}
        />

        {/* Location */}
        <EditorField label={t('fields.country', 'Страна')}>
          <Select
            value={currentCountry || 'none'}
            onValueChange={(value: string) => handleLocationChange('country_code', value === 'none' ? '' : value)}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder={t('fields.selectCountry', 'Выберите страну')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('fields.notSpecified', 'Не указана')}</SelectItem>
              {COUNTRY_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </EditorField>

        <EditorField label={t('fields.city', 'Город')}>
          <Input
            value={currentCity}
            onChange={(e) => handleLocationChange('city', e.target.value)}
            placeholder={t('placeholders.city', 'Алматы, Москва...')}
            className="h-12 rounded-xl"
          />
        </EditorField>
      </EditorSection>

      {/* Section 2: Cover Image */}
      <EditorSection
        title={t('editor.sections.cover', 'Обложка')}
        icon={<ImageIcon className="h-5 w-5 text-primary" />}
        defaultOpen={false}
      >
        <MediaUpload
          label={t('fields.coverImage', 'Изображение обложки')}
          value={formData.coverImage || ''}
          onChange={(coverImage) => onChange({ ...formData, coverImage })}
          accept="image/*"
          allowGif={true}
        />

        <EditorField label={t('fields.coverGradient', 'Градиент обложки')}>
          <Select
            value={formData.coverGradient || 'none'}
            onValueChange={(value: string) => onChange({ ...formData, coverGradient: value })}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('gradients.none', 'Без градиента')}</SelectItem>
              <SelectItem value="dark">{t('gradients.dark', 'Тёмный')}</SelectItem>
              <SelectItem value="light">{t('gradients.light', 'Светлый')}</SelectItem>
              <SelectItem value="primary">{t('gradients.primary', 'Основной цвет')}</SelectItem>
              <SelectItem value="sunset">{t('gradients.sunset', 'Закат')}</SelectItem>
              <SelectItem value="ocean">{t('gradients.ocean', 'Океан')}</SelectItem>
              <SelectItem value="purple">{t('gradients.purple', 'Фиолетовый')}</SelectItem>
            </SelectContent>
          </Select>
        </EditorField>

        <EditorField label={t('fields.coverHeight', 'Высота обложки')}>
          <Select
            value={formData.coverHeight || 'medium'}
            onValueChange={(value: string) => onChange({ ...formData, coverHeight: value })}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">{t('heights.small', 'Маленькая — 120px')}</SelectItem>
              <SelectItem value="medium">{t('heights.medium', 'Средняя — 200px')}</SelectItem>
              <SelectItem value="large">{t('heights.large', 'Большая — 320px')}</SelectItem>
            </SelectContent>
          </Select>
        </EditorField>
      </EditorSection>

      {/* Section 3: Avatar & Frames */}
      <EditorSection
        title={t('editor.sections.avatarFrames', 'Аватар и рамки')}
        icon={<Sparkles className="h-5 w-5 text-primary" />}
        defaultOpen={false}
      >
        <EditorField label={t('fields.avatarSize', 'Размер аватара')}>
          <Select
            value={formData.avatarSize || 'large'}
            onValueChange={(value: string) => onChange({ ...formData, avatarSize: value })}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">{t('avatarSizes.small', 'Маленький — 64px')}</SelectItem>
              <SelectItem value="medium">{t('avatarSizes.medium', 'Средний — 96px')}</SelectItem>
              <SelectItem value="large">{t('avatarSizes.large', 'Большой — 128px')}</SelectItem>
              <SelectItem value="xlarge">{t('avatarSizes.xlarge', 'Очень большой — 160px')}</SelectItem>
            </SelectContent>
          </Select>
        </EditorField>

        <EditorField label={t('fields.avatarPosition', 'Позиция аватара')}>
          <Select
            value={formData.avatarPosition || 'center'}
            onValueChange={(value: string) => onChange({ ...formData, avatarPosition: value })}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">{t('fields.left', 'Слева')}</SelectItem>
              <SelectItem value="center">{t('fields.center', 'По центру')}</SelectItem>
              <SelectItem value="right">{t('fields.right', 'Справа')}</SelectItem>
            </SelectContent>
          </Select>
        </EditorField>

        {/* Frame Selector */}
        <EditorField label={t('fields.avatarFrame', 'Стиль рамки')}>
          <div className="border rounded-xl bg-muted/30">
            {!canUsePremiumFrames() && isPremiumFrameType(formData.avatarFrame || 'default') && (
              <div className="p-3 bg-violet-50 dark:bg-violet-900/20 border-b border-violet-200 dark:border-violet-800 rounded-t-xl">
                <p className="text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  {t('premium.premiumFramesLocked', 'Премиум рамки доступны только PRO')}
                </p>
              </div>
            )}
            <FrameGridSelector
              value={(formData.avatarFrame || 'default') as ProfileFrameStyle}
              onChange={(value) => {
                if (!canUsePremiumFrames() && isPremiumFrameType(value)) {
                  navigate('/pricing');
                  return;
                }
                onChange({ ...formData, avatarFrame: value as ProfileFrameStyle });
              }}
              avatarUrl={formData.avatar}
            />
          </div>
        </EditorField>

        <EditorField label={t('fields.avatarIcon', 'Иконка аватара')}>
          <Select
            value={formData.avatarIcon || ''}
            onValueChange={(value: string) => onChange({ ...formData, avatarIcon: value })}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder={t('fields.selectIcon', 'Выберите иконку')} />
            </SelectTrigger>
            <SelectContent>
              {AVATAR_ICON_OPTIONS.map((icon) => (
                <SelectItem key={icon.value} value={icon.value || 'none'}>
                  {icon.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </EditorField>

        <EditorField label={t('fields.shadowStyle', 'Стиль тени')}>
          <Select
            value={formData.shadowStyle || 'soft'}
            onValueChange={(value: string) => onChange({ ...formData, shadowStyle: value })}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('shadows.none', 'Без тени')}</SelectItem>
              <SelectItem value="soft">{t('shadows.soft', 'Мягкая')}</SelectItem>
              <SelectItem value="medium">{t('shadows.medium', 'Средняя')}</SelectItem>
              <SelectItem value="strong">{t('shadows.strong', 'Сильная')}</SelectItem>
              <SelectItem value="glow">{t('shadows.glow', 'Цветное свечение')}</SelectItem>
            </SelectContent>
          </Select>
        </EditorField>
      </EditorSection>

      {/* Section 4: Verification Badge */}
      <EditorSection
        title={t('fields.verificationBadge', 'Бейдж верификации')}
        icon={<ShieldCheck className="h-5 w-5 text-primary" />}
        badge={!canUseVerificationBadge() ? (
          <Badge variant="outline" className="text-xs px-1.5 py-0 border-violet-500 text-violet-500">
            <Crown className="h-2.5 w-2.5 mr-0.5" />
            PRO
          </Badge>
        ) : undefined}
        defaultOpen={false}
      >
        {!canUseVerificationBadge() ? (
          <div className="p-3 bg-muted/50 rounded-xl border border-dashed">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t('premium.verificationRequiresPro', 'Бейдж верификации доступен для PRO')}
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="mt-2 text-xs text-primary hover:underline"
            >
              {t('premium.upgradeToPro', 'Перейти на PRO →')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Label htmlFor="autoVerifyPremium" className="cursor-pointer text-sm">
                {t('fields.autoVerifyPremium', 'Авто-верификация для Premium')}
              </Label>
              <Switch
                id="autoVerifyPremium"
                checked={formData.autoVerifyPremium || false}
                onCheckedChange={(checked) => onChange({ ...formData, autoVerifyPremium: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="verified" className="cursor-pointer text-sm">
                {t('fields.verified', 'Ручной бейдж верификации')}
              </Label>
              <Switch
                id="verified"
                checked={formData.verified || false}
                onCheckedChange={(checked) => onChange({ ...formData, verified: checked })}
              />
            </div>
          </>
        )}

        {canUseVerificationBadge() && (formData.verified || formData.autoVerifyPremium) && (
          <div className="space-y-3 pl-2 border-l-2 border-primary/20">
            <EditorField label={t('fields.verifiedCustomIcon', 'Кастомная иконка (PNG/SVG/GIF)')}>
              <MediaUpload
                value={formData.verifiedCustomIcon || ''}
                onChange={(value) => onChange({ ...formData, verifiedCustomIcon: value })}
                accept="image/png,image/svg+xml,image/gif"
                allowGif={true}
              />
              {formData.verifiedCustomIcon && (
                <button
                  type="button"
                  onClick={() => onChange({ ...formData, verifiedCustomIcon: undefined })}
                  className="text-xs text-destructive hover:underline mt-1"
                >
                  {t('actions.removeCustomIcon', 'Удалить иконку')}
                </button>
              )}
            </EditorField>

            {!formData.verifiedCustomIcon && (
              <EditorField label={t('fields.verifiedIcon', 'Иконка из набора')}>
                <Select
                  value={formData.verifiedIcon || 'check-circle'}
                  onValueChange={(value: string) => onChange({ ...formData, verifiedIcon: value })}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_ICON_OPTIONS.map((option) => {
                      const IconComponent = getLucideIcon(option.icon);
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </EditorField>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <EditorField label={t('fields.verifiedColor', 'Цвет бейджа')}>
                <Select
                  value={formData.verifiedColor || 'blue'}
                  onValueChange={(value: string) => onChange({ ...formData, verifiedColor: value })}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_COLOR_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full border border-border/50"
                            style={{ backgroundColor: option.color }}
                          />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </EditorField>

              <EditorField label={t('fields.verifiedPosition', 'Позиция бейджа')}>
                <Select
                  value={formData.verifiedPosition || 'bottom-right'}
                  onValueChange={(value: string) => onChange({ ...formData, verifiedPosition: value })}
                >
                  <SelectTrigger className="h-12 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VERIFICATION_POSITION_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </EditorField>
            </div>
          </div>
        )}
      </EditorSection>

      {/* Section 5: Proof of Human (Trust) */}
      <EditorSection
        title={t('fields.proofOfHuman', 'Доверие')}
        icon={<Video className="h-5 w-5 text-primary" />}
        badge={
          <Badge variant="outline" className="text-xs px-1.5 py-0 border-green-500 text-green-600">
            📈 +Trust
          </Badge>
        }
        defaultOpen={false}
      >
        <p className="text-xs text-muted-foreground">
          {t('fields.proofOfHumanDescription', 'Добавьте видео или аудио приветствие чтобы показать что вы реальный человек')}
        </p>

        <MediaUpload
          label={t('fields.introVideo', 'Видео-приветствие (до 30 сек)')}
          value={formData.introVideo || ''}
          onChange={(introVideo) => onChange({ ...formData, introVideo })}
          accept="video/mp4,video/webm,video/quicktime"
        />

        <MediaUpload
          label={t('fields.introAudio', 'Голосовое приветствие')}
          value={formData.introAudio || ''}
          onChange={(introAudio) => onChange({ ...formData, introAudio })}
          accept="audio/mpeg,audio/wav,audio/ogg,audio/m4a"
        />

        {(formData.introVideo || formData.introAudio) && (
          <p className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded-xl">
            ✓ {t('fields.proofOfHumanActive', 'Ваш профиль теперь показывает бейдж верификации с медиа')}
          </p>
        )}
      </EditorSection>
    </div>
  );
}

export const ProfileBlockEditor = withBlockEditor(ProfileBlockEditorComponent, {
  hint: 'Customize your profile with avatar, name, bio, cover image, animated frames, and shadow effects',
});
