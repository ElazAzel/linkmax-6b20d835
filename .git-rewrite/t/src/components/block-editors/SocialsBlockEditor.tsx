import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateSocialsBlock } from '@/lib/block-validators';
import { ArrayFieldList } from '@/components/form-fields/ArrayFieldList';
import { ArrayFieldItem } from '@/components/form-fields/ArrayFieldItem';

function SocialsBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
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
      platforms: platforms.filter((_: any, i: number) => i !== index),
    });
  };

  const updatePlatform = (index: number, field: string, value: string) => {
    const updated = [...platforms];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...formData, platforms: updated });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Title (optional)</Label>
        <Input
          value={formData.title || ''}
          onChange={(e) => onChange({ ...formData, title: e.target.value })}
          placeholder="Follow me on"
        />
      </div>

      <ArrayFieldList label="Social Platforms" items={platforms} onAdd={addPlatform}>
        {platforms.map((platform: any, index: number) => (
          <ArrayFieldItem
            key={index}
            index={index}
            label="Platform"
            onRemove={() => removePlatform(index)}
          >
            <div>
              <Label className="text-xs">Icon</Label>
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

            <div>
              <Label className="text-xs">Platform Name</Label>
              <Input
                value={platform.name}
                onChange={(e) => updatePlatform(index, 'name', e.target.value)}
                placeholder="Instagram"
              />
            </div>

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
        <Label>Alignment</Label>
        <Select
          value={formData.alignment || 'center'}
          onValueChange={(value) => onChange({ ...formData, alignment: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
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
