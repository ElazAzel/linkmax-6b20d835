import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { FrameGridSelector } from '@/components/editor/FramePreview';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { AVATAR_ICON_OPTIONS } from '@/lib/avatar-frame-utils';
import type { ProfileFrameStyle } from '@/types/page';

function ProfileBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  const [frameOpen, setFrameOpen] = useState(false);
  
  return (
    <div className="space-y-4">
      <MediaUpload
        label={t('fields.avatarUrl', 'Avatar')}
        value={formData.avatar || ''}
        onChange={(avatar) => onChange({ ...formData, avatar })}
        accept="image/*"
        allowGif={true}
      />
      
      <MultilingualInput
        label={t('fields.name', 'Name')}
        value={migrateToMultilingual(formData.name)}
        onChange={(value) => onChange({ ...formData, name: value })}
        placeholder="Your Name"
      />
      
      <MultilingualInput
        label={t('fields.bio', 'Bio')}
        value={migrateToMultilingual(formData.bio)}
        onChange={(value) => onChange({ ...formData, bio: value })}
        type="textarea"
        placeholder="Tell people about yourself..."
        enableRichText={true}
      />
      
      <div className="border-t pt-4 space-y-4">
        <MediaUpload
          label={t('fields.coverImage', 'Cover Image')}
          value={formData.coverImage || ''}
          onChange={(coverImage) => onChange({ ...formData, coverImage })}
          accept="image/*"
          allowGif={true}
        />

        <div>
          <Label>{t('fields.coverGradient', 'Cover Gradient Overlay')}</Label>
          <Select
            value={formData.coverGradient || 'none'}
            onValueChange={(value) => onChange({ ...formData, coverGradient: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('gradients.none', 'No Gradient')}</SelectItem>
              <SelectItem value="dark">{t('gradients.dark', 'Dark Overlay')}</SelectItem>
              <SelectItem value="light">{t('gradients.light', 'Light Overlay')}</SelectItem>
              <SelectItem value="primary">{t('gradients.primary', 'Primary Color')}</SelectItem>
              <SelectItem value="sunset">{t('gradients.sunset', 'Sunset Gradient')}</SelectItem>
              <SelectItem value="ocean">{t('gradients.ocean', 'Ocean Gradient')}</SelectItem>
              <SelectItem value="purple">{t('gradients.purple', 'Purple Dream')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>{t('fields.coverHeight', 'Cover Height')}</Label>
          <Select
            value={formData.coverHeight || 'medium'}
            onValueChange={(value) => onChange({ ...formData, coverHeight: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">{t('heights.small', 'Small - 120px')}</SelectItem>
              <SelectItem value="medium">{t('heights.medium', 'Medium - 200px')}</SelectItem>
              <SelectItem value="large">{t('heights.large', 'Large - 320px')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>{t('fields.avatarSize', 'Avatar Size')}</Label>
          <Select
            value={formData.avatarSize || 'large'}
            onValueChange={(value) => onChange({ ...formData, avatarSize: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">{t('avatarSizes.small', 'Small - 64px')}</SelectItem>
              <SelectItem value="medium">{t('avatarSizes.medium', 'Medium - 96px')}</SelectItem>
              <SelectItem value="large">{t('avatarSizes.large', 'Large - 128px')}</SelectItem>
              <SelectItem value="xlarge">{t('avatarSizes.xlarge', 'Extra Large - 160px')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>{t('fields.avatarPosition', 'Avatar Position')}</Label>
          <Select
            value={formData.avatarPosition || 'center'}
            onValueChange={(value) => onChange({ ...formData, avatarPosition: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="left">{t('fields.left', 'Left')}</SelectItem>
              <SelectItem value="center">{t('fields.center', 'Center')}</SelectItem>
              <SelectItem value="right">{t('fields.right', 'Right')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Collapsible open={frameOpen} onOpenChange={setFrameOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium">
            <span>{t('fields.avatarFrame', 'Avatar Frame Style')}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${frameOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border rounded-lg bg-muted/30 mt-2">
              <FrameGridSelector
                value={(formData.avatarFrame || 'default') as ProfileFrameStyle}
                onChange={(value) => onChange({ ...formData, avatarFrame: value as ProfileFrameStyle })}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div>
          <Label>{t('fields.avatarIcon', 'Avatar Icon')}</Label>
          <Select
            value={formData.avatarIcon || ''}
            onValueChange={(value) => onChange({ ...formData, avatarIcon: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('fields.selectIcon', 'Select icon')} />
            </SelectTrigger>
            <SelectContent>
              {AVATAR_ICON_OPTIONS.map((icon) => (
                <SelectItem key={icon.value} value={icon.value || 'none'}>
                  {icon.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>{t('fields.shadowStyle', 'Shadow Style')}</Label>
          <Select
            value={formData.shadowStyle || 'soft'}
            onValueChange={(value) => onChange({ ...formData, shadowStyle: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('shadows.none', 'No Shadow')}</SelectItem>
              <SelectItem value="soft">{t('shadows.soft', 'Soft Shadow')}</SelectItem>
              <SelectItem value="medium">{t('shadows.medium', 'Medium Shadow')}</SelectItem>
              <SelectItem value="strong">{t('shadows.strong', 'Strong Shadow')}</SelectItem>
              <SelectItem value="glow">{t('shadows.glow', 'Colored Glow')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="verified"
          checked={formData.verified || false}
          onChange={(e) => onChange({ ...formData, verified: e.target.checked })}
          className="h-4 w-4"
        />
        <Label htmlFor="verified" className="cursor-pointer">{t('fields.verified', 'Verified badge')}</Label>
      </div>
    </div>
  );
}

export const ProfileBlockEditor = withBlockEditor(ProfileBlockEditorComponent, {
  hint: 'Customize your profile with avatar, name, bio, cover image, animated frames, and shadow effects',
});
