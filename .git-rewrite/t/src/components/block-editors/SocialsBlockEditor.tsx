import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateSocialsBlock } from '@/lib/block-validators';
import { ArrayFieldList } from '@/components/form-fields/ArrayFieldList';
import { ArrayFieldItem } from '@/components/form-fields/ArrayFieldItem';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';

function SocialsBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  const platforms = formData.platforms || [];

  const addPlatform = () => {
    onChange({
      ...formData,
      platforms: [...platforms, { name: '', url: '', icon: 'globe' }],
    });
  };

  const removePlatform = (index: number) => {
    onChange({
      ...formData,
      platforms: platforms.filter((_: unknown, i: number) => i !== index),
    });
  };

  const updatePlatform = (index: number, field: string, value: unknown) => {
    const updated = [...platforms];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...formData, platforms: updated });
  };

  return (
    <div className="space-y-4">
      <MultilingualInput
        label={`${t('fields.title', 'Title')} (${t('fields.optional', 'optional')})`}
        value={migrateToMultilingual(formData.title)}
        onChange={(value) => onChange({ ...formData, title: value })}
        placeholder={t('fields.followMe', 'Follow me on')}
      />

      <ArrayFieldList label={t('fields.socialPlatforms', 'Social Platforms')} items={platforms} onAdd={addPlatform}>
        {platforms.map((platform: any, index: number) => (
          <ArrayFieldItem
            key={index}
            index={index}
            label={t('fields.platform', 'Platform')}
            onRemove={() => removePlatform(index)}
          >
            <div>
              <Label className="text-xs">{t('fields.icon', 'Icon')}</Label>
              <Select
                value={platform.icon}
                onValueChange={(value) => updatePlatform(index, 'icon', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="twitter">Twitter</SelectItem>
                  <SelectItem value="github">GitHub</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="threads">Threads</SelectItem>
                  <SelectItem value="globe">Website</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <MultilingualInput
              label={t('fields.platformName', 'Platform Name')}
              value={migrateToMultilingual(platform.name)}
              onChange={(value) => updatePlatform(index, 'name', value)}
              placeholder="Instagram"
            />

            <div>
              <Label className="text-xs">URL</Label>
              <Input
                type="url"
                value={platform.url}
                onChange={(e) => updatePlatform(index, 'url', e.target.value)}
                placeholder="https://instagram.com/username"
              />
            </div>
          </ArrayFieldItem>
        ))}
      </ArrayFieldList>

      <div>
        <Label>{t('fields.alignment', 'Alignment')}</Label>
        <Select
          value={formData.alignment || 'center'}
          onValueChange={(value) => onChange({ ...formData, alignment: value })}
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
    </div>
  );
}

export const SocialsBlockEditor = withBlockEditor(SocialsBlockEditorComponent, {
  hint: 'Add social media icons with links to your profiles',
  validate: validateSocialsBlock,
});
