import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateMessengerBlock } from '@/lib/block-validators';
import { ArrayFieldList } from '@/components/form-fields/ArrayFieldList';
import { ArrayFieldItem } from '@/components/form-fields/ArrayFieldItem';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';

function MessengerBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  const messengers = formData.messengers || [];

  const addMessenger = () => {
    onChange({
      ...formData,
      messengers: [...messengers, { platform: 'whatsapp', username: '', message: { ru: '', en: '', kk: '' } }],
    });
  };

  const removeMessenger = (index: number) => {
    onChange({
      ...formData,
      messengers: messengers.filter((_: unknown, i: number) => i !== index),
    });
  };

  const updateMessenger = (index: number, field: string, value: unknown) => {
    const updated = [...messengers];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...formData, messengers: updated });
  };

  return (
    <div className="space-y-4">
      <MultilingualInput
        label={`${t('fields.title', 'Title')} (${t('fields.optional', 'optional')})`}
        value={migrateToMultilingual(formData.title)}
        onChange={(value) => onChange({ ...formData, title: value })}
        placeholder={t('fields.contactMe', 'Contact me')}
      />

      <ArrayFieldList label={t('fields.messengers', 'Messengers')} items={messengers} onAdd={addMessenger}>
        {messengers.map((messenger: any, index: number) => (
          <ArrayFieldItem
            key={index}
            index={index}
            label={t('fields.messenger', 'Messenger')}
            onRemove={() => removeMessenger(index)}
          >
            <div>
              <Label className="text-xs">{t('fields.platform', 'Platform')}</Label>
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
              <Label className="text-xs">{t('fields.usernamePhone', 'Username/Phone')}</Label>
              <Input
                value={messenger.username}
                onChange={(e) => updateMessenger(index, 'username', e.target.value)}
                placeholder={t('fields.usernameOrPhone', 'username or phone number')}
              />
            </div>

            <MultilingualInput
              label={`${t('fields.prefilledMessage', 'Pre-filled Message')} (${t('fields.optional', 'optional')})`}
              value={migrateToMultilingual(messenger.message)}
              onChange={(value) => updateMessenger(index, 'message', value)}
              type="textarea"
              placeholder={t('fields.prefilledMessagePlaceholder', 'Hello! I have a question...')}
            />
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
