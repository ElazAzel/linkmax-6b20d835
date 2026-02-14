import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateSocialsBlock } from '@/lib/block-validators';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { EditorSection, EditorField, EditorDivider } from './EditorSection';
import { AlignmentButton } from './EditorUtils';
import { Label } from '@/components/ui/label';
import {
  Share2,
  Palette,
  LayoutGrid,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Trash2,
  GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reorder, useDragControls } from 'framer-motion';

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

  // Default platforms if none exist
  const platforms = data.platforms || [];

  const handleAddPlatform = () => {
    onChange({
      ...data,
      platforms: [
        ...platforms,
        { id: crypto.randomUUID(), platform: 'instagram', url: '' }
      ]
    });
  };

  const handleRemovePlatform = (id: string) => {
    onChange({
      ...data,
      platforms: platforms.filter((p) => p.id !== id)
    });
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

                  <div className="flex-1 space-y-2">
                    <Select
                      value={item.platform}
                      onValueChange={(value: string) => handleUpdatePlatform(item.id!, { platform: value })}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="twitter">X (Twitter)</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="telegram">Telegram</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="discord">Discord</SelectItem>
                        <SelectItem value="twitch">Twitch</SelectItem>
                        <SelectItem value="pinterest">Pinterest</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                      </SelectContent>
                    </Select>

                    <Input
                      value={item.url}
                      onChange={(e) => handleUpdatePlatform(item.id!, { url: e.target.value })}
                      placeholder="https://"
                      className="h-10"
                    />
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
            value={formData.layout || 'list'}
            onValueChange={(value: string) => onChange({ ...formData, layout: value })}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">
                <span className="flex items-center gap-2"><LayoutGrid className="h-4 w-4 rotate-90" /> {t('layouts.list', 'List')}</span>
              </SelectItem>
              <SelectItem value="grid">
                <span className="flex items-center gap-2"><LayoutGrid className="h-4 w-4" /> {t('layouts.grid', 'Grid')}</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </EditorField>

        <EditorField label={t('fields.iconStyle', 'Icon Style')}>
          <Select
            value={formData.iconStyle || 'brand'}
            onValueChange={(value: string) => onChange({ ...formData, iconStyle: value })}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="brand">{t('styles.brandColors', 'Brand Colors')}</SelectItem>
              <SelectItem value="black">{t('styles.black', 'Black')}</SelectItem>
              <SelectItem value="white">{t('styles.white', 'White')}</SelectItem>
              <SelectItem value="outline">{t('styles.outline', 'Outline')}</SelectItem>
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
