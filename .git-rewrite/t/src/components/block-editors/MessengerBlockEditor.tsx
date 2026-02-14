import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateMessengerBlock } from '@/lib/block-validators';
import { ArrayFieldList } from '@/components/form-fields/ArrayFieldList';
import { ArrayFieldItem } from '@/components/form-fields/ArrayFieldItem';

function MessengerBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const messengers = formData.messengers || [];

  const addMessenger = () => {
    onChange({
      ...formData,
      messengers: [...messengers, { platform: 'whatsapp', username: '', message: '' }],
    });
  };

  const removeMessenger = (index: number) => {
    onChange({
      ...formData,
      messengers: messengers.filter((_: any, i: number) => i !== index),
    });
  };

  const updateMessenger = (index: number, field: string, value: string) => {
    const updated = [...messengers];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...formData, messengers: updated });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Title (optional)</Label>
        <Input
          value={formData.title || ''}
          onChange={(e) => onChange({ ...formData, title: e.target.value })}
          placeholder="Contact me"
        />
      </div>

      <ArrayFieldList label="Messengers" items={messengers} onAdd={addMessenger}>
        {messengers.map((messenger: any, index: number) => (
          <ArrayFieldItem
            key={index}
            index={index}
            label="Messenger"
            onRemove={() => removeMessenger(index)}
          >
            <div>
              <Label className="text-xs">Platform</Label>
              <Select
                value={messenger.platform}
                onValueChange={(value) => updateMessenger(index, 'platform', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                  <SelectItem value="viber">Viber</SelectItem>
                  <SelectItem value="wechat">WeChat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Username/Phone</Label>
              <Input
                value={messenger.username}
                onChange={(e) => updateMessenger(index, 'username', e.target.value)}
                placeholder="username or phone number"
              />
            </div>

            <div>
              <Label className="text-xs">Pre-filled Message (optional)</Label>
              <Textarea
                value={messenger.message || ''}
                onChange={(e) => updateMessenger(index, 'message', e.target.value)}
                placeholder="Hello! I have a question..."
                rows={2}
              />
            </div>
          </ArrayFieldItem>
        ))}
      </ArrayFieldList>
    </div>
  );
}

export const MessengerBlockEditor = withBlockEditor(MessengerBlockEditorComponent, {
  hint: 'Add messenger links for quick contact (WhatsApp, Telegram, Viber, WeChat)',
  validate: validateMessengerBlock,
});
