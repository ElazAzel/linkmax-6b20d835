import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { validateMessengerBlock } from '@/lib/blocks/block-validators';
import { ArrayFieldList } from '@/components/form-fields/ArrayFieldList';
import { ArrayFieldItem } from '@/components/form-fields/ArrayFieldItem';
import { useTranslation } from 'react-i18next';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { useDashboard } from '@/hooks/dashboard/useDashboard';
import { getRandomSuggestion } from '@/lib/intelligence/writing-algorithm';
import { AIButton } from '@/components/form-fields/AIButton';
import { toast } from 'sonner';

function MessengerBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language as 'ru' | 'en' | 'kk';
  const { pageData } = useDashboard();
  const niche = pageData?.niche || 'general';
  const messengers = formData.messengers || [];

  const handleMagicWandMessage = (index: number) => {
    const suggestion = getRandomSuggestion(niche, 'messenger_message');
    const updated = [...messengers];
    const currentM = migrateToMultilingual(updated[index].message);
    updated[index] = { ...updated[index], message: { ...currentM, [currentLang]: suggestion } };
    onChange({ ...formData, messengers: updated });
    toast.success(t('ai.suggestionApplied', 'Предложение примененно'));
  };

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
                onValueChange={(value: string) => updateMessenger(index, 'platform', value)}
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

            <div className="relative">
              <MultilingualInput
                label={`${t('fields.prefilledMessage', 'Pre-filled Message')} (${t('fields.optional', 'optional')})`}
                value={migrateToMultilingual(messenger.message)}
                onChange={(value) => updateMessenger(index, 'message', value)}
                type="textarea"
                placeholder={t('fields.prefilledMessagePlaceholder', 'Hello! I have a question...')}
              />
              <div className="absolute top-0 right-0">
                <AIButton onClick={() => handleMagicWandMessage(index)} loading={false} />
              </div>
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
