import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { FrameGridSelector } from '@/components/editor/FramePreview';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Crown, Lock } from 'lucide-react';
import { useState } from 'react';
import { AVATAR_ICON_OPTIONS, VERIFICATION_COLOR_OPTIONS, VERIFICATION_POSITION_OPTIONS, VERIFICATION_ICON_OPTIONS } from '@/lib/avatar-frame-utils';
import { getLucideIcon } from '@/lib/icon-utils';
import type { ProfileFrameStyle } from '@/types/page';
import { useFreemiumLimits } from '@/hooks/useFreemiumLimits';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

function ProfileBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [frameOpen, setFrameOpen] = useState(false);
  const { canUseVerificationBadge, canUsePremiumFrames, canUseAdvancedThemes, currentTier } = useFreemiumLimits();
  
  const isPremiumFrameType = (frame: string) => {
    const freeFrames = ['default', 'circle', 'rounded', 'square'];
    return !freeFrames.includes(frame);
  };
  
  
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
        placeholder={t('placeholders.yourName', 'Your Name')}
      />
      
      <MultilingualInput
        label={t('fields.bio', 'Bio')}
        value={migrateToMultilingual(formData.bio)}
        onChange={(value) => onChange({ ...formData, bio: value })}
        type="textarea"
        placeholder={t('placeholders.tellAboutYourself', 'Tell people about yourself...')}
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
            <span className="flex items-center gap-2">
              {t('fields.avatarFrame', 'Avatar Frame Style')}
              {!canUsePremiumFrames() && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-violet-500 text-violet-500">
                  <Crown className="h-2.5 w-2.5 mr-0.5" />
                  PRO
                </Badge>
              )}
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${frameOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="border rounded-lg bg-muted/30 mt-2">
              {!canUsePremiumFrames() && isPremiumFrameType(formData.avatarFrame || 'default') && (
                <div className="p-3 bg-violet-50 dark:bg-violet-900/20 border-b border-violet-200 dark:border-violet-800 rounded-t-lg">
                  <p className="text-xs text-violet-600 dark:text-violet-400 flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    {t('premium.premiumFramesLocked', 'Premium frames require PRO subscription')}
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

      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label className="font-medium">{t('fields.verificationBadge', 'Verification Badge')}</Label>
          {!canUseVerificationBadge() && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-violet-500 text-violet-500">
              <Crown className="h-2.5 w-2.5 mr-0.5" />
              PRO
            </Badge>
          )}
        </div>
        
        {!canUseVerificationBadge() ? (
          <div className="p-3 bg-muted/50 rounded-lg border border-dashed">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Lock className="h-4 w-4" />
              {t('premium.verificationRequiresPro', 'Verification badge is available for PRO users')}
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="mt-2 text-xs text-primary hover:underline"
            >
              {t('premium.upgradeToPro', 'Upgrade to PRO →')}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoVerifyPremium"
                checked={formData.autoVerifyPremium || false}
                onChange={(e) => onChange({ ...formData, autoVerifyPremium: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="autoVerifyPremium" className="cursor-pointer text-sm">
                {t('fields.autoVerifyPremium', 'Auto-verify for Premium users')}
              </Label>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="verified"
                checked={formData.verified || false}
                onChange={(e) => onChange({ ...formData, verified: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="verified" className="cursor-pointer">{t('fields.verified', 'Manual verified badge')}</Label>
            </div>
          </>
        )}

        {canUseVerificationBadge() && (formData.verified || formData.autoVerifyPremium) && (
          <div className="space-y-3 pl-6">
            {/* Custom icon upload */}
            <div>
              <Label className="text-xs">{t('fields.verifiedCustomIcon', 'Custom Icon (PNG/SVG/GIF)')}</Label>
              <div className="mt-1">
                <MediaUpload
                  value={formData.verifiedCustomIcon || ''}
                  onChange={(value) => onChange({ ...formData, verifiedCustomIcon: value })}
                  accept="image/png,image/svg+xml,image/gif"
                  allowGif={true}
                />
              </div>
              {formData.verifiedCustomIcon && (
                <button
                  type="button"
                  onClick={() => onChange({ ...formData, verifiedCustomIcon: undefined })}
                  className="text-xs text-destructive hover:underline mt-1"
                >
                  {t('actions.removeCustomIcon', 'Remove custom icon')}
                </button>
              )}
            </div>

            {/* Preset icon selector - only show if no custom icon */}
            {!formData.verifiedCustomIcon && (
              <div>
                <Label className="text-xs">{t('fields.verifiedIcon', 'Preset Icon')}</Label>
                <Select
                  value={formData.verifiedIcon || 'check-circle'}
                  onValueChange={(value) => onChange({ ...formData, verifiedIcon: value })}
                >
                  <SelectTrigger className="h-9">
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
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{t('fields.verifiedColor', 'Badge Background')}</Label>
                <Select
                  value={formData.verifiedColor || 'blue'}
                  onValueChange={(value) => onChange({ ...formData, verifiedColor: value })}
                >
                  <SelectTrigger className="h-9">
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
              </div>
              
              <div>
                <Label className="text-xs">{t('fields.verifiedPosition', 'Badge Position')}</Label>
                <Select
                  value={formData.verifiedPosition || 'bottom-right'}
                  onValueChange={(value) => onChange({ ...formData, verifiedPosition: value })}
                >
                  <SelectTrigger className="h-9">
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
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Proof of Human Section */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center justify-between">
          <Label className="font-medium">{t('fields.proofOfHuman', 'Proof of Human')}</Label>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500 text-green-600">
            {t('fields.boostTrust', '📈 +Trust')}
          </Badge>
        </div>
        
        <p className="text-xs text-muted-foreground">
          {t('fields.proofOfHumanDescription', 'Add a short video or voice greeting to show visitors you\'re a real person and boost conversions')}
        </p>

        <MediaUpload
          label={t('fields.introVideo', 'Video Greeting (max 30s)')}
          value={formData.introVideo || ''}
          onChange={(introVideo) => onChange({ ...formData, introVideo })}
          accept="video/mp4,video/webm,video/quicktime"
        />

        <MediaUpload
          label={t('fields.introAudio', 'Voice Greeting')}
          value={formData.introAudio || ''}
          onChange={(introAudio) => onChange({ ...formData, introAudio })}
          accept="audio/mpeg,audio/wav,audio/ogg,audio/m4a"
        />

        {(formData.introVideo || formData.introAudio) && (
          <p className="text-xs text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
            ✓ {t('fields.proofOfHumanActive', 'Your profile now shows a verified human badge with media')}
          </p>
        )}
      </div>
    </div>
  );
}

export const ProfileBlockEditor = withBlockEditor(ProfileBlockEditorComponent, {
  hint: 'Customize your profile with avatar, name, bio, cover image, animated frames, and shadow effects',
});
