import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateSocialsBlock } from '@/lib/blocks/block-validators';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { EditorSection, EditorField, EditorDivider } from './EditorSection';
import { AlignmentButton } from './EditorUtils';
import { Label } from '@/components/ui/label';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import Palette from 'lucide-react/dist/esm/icons/palette';
import LayoutGrid from 'lucide-react/dist/esm/icons/layout-grid';
import AlignLeft from 'lucide-react/dist/esm/icons/align-left';
import AlignCenter from 'lucide-react/dist/esm/icons/align-center';
import AlignRight from 'lucide-react/dist/esm/icons/align-right';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import GripVertical from 'lucide-react/dist/esm/icons/grip-vertical';
import { Button } from '@/components/ui/button';
import { Reorder, useDragControls } from 'framer-motion';
import { useState } from 'react';
import ImagePlus from 'lucide-react/dist/esm/icons/image-plus';
import RotateCcw from 'lucide-react/dist/esm/icons/rotate-ccw';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { SocialIcon } from '@/components/icons/SocialIcon';
import { SOCIAL_PLATFORMS, detectSocialPlatform, normalizePlatformId } from '@/lib/social/platforms';

// Helper for drag handle
const DragHandle = () => {
  const controls = useDragControls();
  return (
    <span
      onPointerDown={(e) => controls.start(e)}
      className="cursor-move p-2 text-muted-foreground hover:text-foreground touch-none"
    >
      <GripVertical className="h-5 w-5" />
    </span>
  );
};

import { SocialsBlock } from '@/types/page';

type SocialPlatform = SocialsBlock['platforms'][0];

function SocialsBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  const data = formData as Partial<SocialsBlock>;

  // Ensure all platforms have IDs
  const platforms = (data.platforms || []).map(p => 
    p.id ? p : { ...p, id: crypto.randomUUID() }
  );

  const handleAddPlatform = () => {
    onChange({
      ...data,
      platforms: [
        ...platforms,
        { id: crypto.randomUUID(), url: '' }
      ]
    });
  };

  const handleRemovePlatform = (id: string) => {
    onChange({
      ...data,
      platforms: platforms.filter((p) => p.id !== id)
    });
  };

  const [customIconOpen, setCustomIconOpen] = useState<Record<string, boolean>>({});

  // The network follows the link: pasting t.me/… selects Telegram.
  const handleUrlChange = (id: string, url: string) => {
    const detected = detectSocialPlatform(url);
    handleUpdatePlatform(id, detected ? { url, platform: detected, icon: undefined } : { url });
  };

  const handleUpdatePlatform = (id: string, updates: Partial<SocialPlatform>) => {
    onChange({
      ...data,
      platforms: platforms.map((p) => p.id === id ? { ...p, ...updates } : p)
    });
  };

  // Content filled calculation
  const contentFilled = platforms.filter((p) => p.url).length;
  const totalItems = Math.max(platforms.length, 1);

  return (
    <div className="space-y-4">
      {/* Content Section */}
      <EditorSection
        title={t('editor.sections.content', 'Social Links')}
        icon={<Share2 className="h-5 w-5 text-primary" />}
        collapsible={false}
        filledCount={contentFilled}
        totalCount={totalItems}
      >
        <MultilingualInput
          label={t('fields.title', 'Title')}
          value={migrateToMultilingual(data.title)}
          onChange={(value) => onChange({ ...data, title: value })}
          placeholder={t('fields.socialsTitle', 'Social Media')}
        />

        <div className="space-y-3 mt-4">
          <Label>{t('fields.platforms', 'Platforms')}</Label>

          <Reorder.Group
            axis="y"
            values={platforms}
            onReorder={(newOrder) => onChange({ ...data, platforms: newOrder })}
            className="space-y-2"
          >
            {platforms.map((item) => (
              <Reorder.Item key={item.id} value={item}>
                <div className="flex gap-2 items-start p-3 bg-muted/30 rounded-xl border border-border/10 group">
                  <DragHandle />

                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-border bg-card text-foreground">
                        <SocialIcon
                          platformId={detectSocialPlatform(item.url) ?? normalizePlatformId(item.platform) ?? normalizePlatformId(item.icon)}
                          url={item.url}
                          customIconUrl={item.customIconUrl}
                          className="h-5 w-5"
                        />
                      </span>
                      <Input
                        value={item.url}
                        onChange={(e) => handleUrlChange(item.id!, e.target.value)}
                        placeholder={t('socials.urlPlaceholder', 'Вставьте ссылку: instagram.com/…, t.me/…')}
                        className="h-10 min-w-0"
                        inputMode="url"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={normalizePlatformId(item.platform) ?? normalizePlatformId(item.icon) ?? 'website'}
                        onValueChange={(value: string) => handleUpdatePlatform(item.id!, { platform: value, icon: undefined })}
                      >
                        <SelectTrigger className="h-10 min-w-0 flex-1" aria-label={t('socials.network', 'Соцсеть')}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SOCIAL_PLATFORMS.map((platform) => (
                            <SelectItem key={platform.id} value={platform.id}>
                              <span className="flex items-center gap-2">
                                <SocialIcon platformId={platform.id} className="h-4 w-4" />
                                {platform.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant={item.customIconUrl || customIconOpen[item.id!] ? 'secondary' : 'outline'}
                        size="icon"
                        className="h-10 w-10 shrink-0"
                        onClick={() => setCustomIconOpen((open) => ({ ...open, [item.id!]: !open[item.id!] }))}
                        aria-label={t('socials.customIcon', 'Своя иконка')}
                        aria-expanded={!!customIconOpen[item.id!]}
                        title={t('socials.customIcon', 'Своя иконка')}
                      >
                        <ImagePlus className="h-4 w-4" />
                      </Button>
                    </div>

                    {customIconOpen[item.id!] ? (
                      <div className="space-y-2 rounded-control border border-border bg-card p-3">
                        <MediaUpload
                          value={item.customIconUrl || ''}
                          onChange={(url) => handleUpdatePlatform(item.id!, { customIconUrl: url || undefined })}
                          accept="image/*"
                          label={t('socials.customIcon', 'Своя иконка')}
                          placeholder="https://…/icon.png"
                        />
                        {item.customIconUrl ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdatePlatform(item.id!, { customIconUrl: undefined })}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            {t('socials.autoIcon', 'Вернуть автоматическую иконку')}
                          </Button>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {t('socials.customIconHint', 'Квадратная картинка PNG или SVG, от 64×64. Без своей иконки ставится значок соцсети по ссылке.')}
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePlatform(item.id!)}
                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          <Button
            type="button"
            variant="outline"
            onClick={handleAddPlatform}
            className="w-full h-12 rounded-xl border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 gap-2"
          >
            <Plus className="h-4 w-4" />
            {t('actions.addPlatform', 'Add Platform')}
          </Button>
        </div>
      </EditorSection>

      {/* Style Section */}
      <EditorSection
        title={t('editor.sections.style', 'Style')}
        icon={<Palette className="h-5 w-5 text-primary" />}
        defaultOpen={true}
      >
        <EditorField label={t('fields.layout', 'Layout')}>
          <Select
            value={formData.layout || 'grid'}
            onValueChange={(value: string) => onChange({ ...formData, layout: value })}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">
                <span className="flex items-center gap-2"><LayoutGrid className="h-4 w-4 rotate-90" /> {t('socials.layoutList', 'Список с названиями')}</span>
              </SelectItem>
              <SelectItem value="grid">
                <span className="flex items-center gap-2"><LayoutGrid className="h-4 w-4" /> {t('socials.layoutRow', 'Ряд иконок')}</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </EditorField>

        <EditorField label={t('fields.iconStyle', 'Icon Style')}>
          <Select
            value={formData.iconStyle === 'brand' || formData.iconStyle === 'outline' ? formData.iconStyle : 'theme'}
            onValueChange={(value: string) => onChange({ ...formData, iconStyle: value })}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="theme">{t('socials.styleTheme', 'Как на странице')}</SelectItem>
              <SelectItem value="brand">{t('styles.brandColors', 'Цвета брендов')}</SelectItem>
              <SelectItem value="outline">{t('styles.outline', 'Контур')}</SelectItem>
            </SelectContent>
          </Select>
        </EditorField>

        <EditorDivider />

        <EditorField label={t('fields.alignment', 'Alignment')}>
          <div className="flex gap-2 p-1 bg-muted/30 rounded-xl">
            <AlignmentButton
              value="left"
              current={formData.alignment || 'center'}
              icon={<AlignLeft className="h-5 w-5" />}
              label={t('fields.left', 'Left')}
              onClick={(v) => onChange({ ...formData, alignment: v })}
            />
            <AlignmentButton
              value="center"
              current={formData.alignment || 'center'}
              icon={<AlignCenter className="h-5 w-5" />}
              label={t('fields.center', 'Center')}
              onClick={(v) => onChange({ ...formData, alignment: v })}
            />
            <AlignmentButton
              value="right"
              current={formData.alignment || 'center'}
              icon={<AlignRight className="h-5 w-5" />}
              label={t('fields.right', 'Right')}
              onClick={(v) => onChange({ ...formData, alignment: v })}
            />
          </div>
        </EditorField>
      </EditorSection>
    </div>
  );
}

export const SocialsBlockEditor = withBlockEditor(SocialsBlockEditorComponent, {
  hint: 'Add links to your social media profiles',
  validate: validateSocialsBlock
});
