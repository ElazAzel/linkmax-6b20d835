import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { CurrencySelect } from '@/components/form-fields/CurrencySelect';
import { createMultilingualString } from '@/lib/i18n-helpers';
import { validateEventBlock } from '@/lib/block-validators';
import { withBlockEditor, type BaseBlockEditorProps } from './BlockEditorWrapper';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { GoogleFormImport } from '@/components/crm/GoogleFormImport';
import { EventFormBuilder } from '@/components/event-forms/EventFormBuilder';
import { FileText, Settings, ListChecks, Info } from 'lucide-react';
import type { EventFormField } from '@/types/page';

const toLocalInputValue = (value?: string) => {
  if (!value) return '';
  try {
    return new Date(value).toISOString().slice(0, 16);
  } catch {
    return '';
  }
};

const fromLocalInputValue = (value: string) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toISOString();
};

function EventBlockEditorComponent({ formData, onChange }: BaseBlockEditorProps) {
  const { t } = useTranslation();
  const { isPremium } = usePremiumStatus();
  const [showGoogleImport, setShowGoogleImport] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'form' | 'settings'>('info');

  const fields = formData.formFields || [];

  const handleFieldsChange = (newFields: EventFormField[]) => {
    onChange({ ...formData, formFields: newFields });
  };

  const handleGoogleFormImport = (importedFields: EventFormField[], title?: string) => {
    const updatedFields = [...fields, ...importedFields];
    const updates: Record<string, unknown> = { formFields: updatedFields };
    
    if (title && (!formData.title || !formData.title.ru)) {
      updates.title = createMultilingualString(title);
    }
    
    onChange({ ...formData, ...updates });
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          {t('eventBuilder.emailRequired', 'Email поле всегда добавляется автоматически и является обязательным.')}
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info" className="text-xs">
            <Info className="h-3.5 w-3.5 mr-1.5" />
            {t('eventBuilder.tabInfo', 'Инфо')}
          </TabsTrigger>
          <TabsTrigger value="form" className="text-xs">
            <ListChecks className="h-3.5 w-3.5 mr-1.5" />
            {t('eventBuilder.tabForm', 'Форма')}
          </TabsTrigger>
          <TabsTrigger value="settings" className="text-xs">
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            {t('eventBuilder.tabSettings', 'Настройки')}
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4 mt-4">
          <MultilingualInput
            label={t('eventBuilder.title', 'Название события')}
            value={formData.title || createMultilingualString('')}
            onChange={(value) => onChange({ ...formData, title: value })}
            placeholder={t('eventBuilder.titlePlaceholder', 'Введите название')}
          />

          <MultilingualInput
            label={t('eventBuilder.description', 'Описание')}
            value={formData.description || createMultilingualString('')}
            onChange={(value) => onChange({ ...formData, description: value })}
            placeholder={t('eventBuilder.descriptionPlaceholder', 'Кратко опишите ивент')}
          />

          <div>
            <Label>{t('eventBuilder.coverUrl', 'Обложка (URL)')}</Label>
            <Input
              value={formData.coverUrl || ''}
              onChange={(e) => onChange({ ...formData, coverUrl: e.target.value })}
              placeholder="https://"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t('eventBuilder.startAt', 'Начало')}</Label>
              <Input
                type="datetime-local"
                value={toLocalInputValue(formData.startAt)}
                onChange={(e) => onChange({ ...formData, startAt: fromLocalInputValue(e.target.value) })}
              />
            </div>
            <div>
              <Label>{t('eventBuilder.endAt', 'Окончание')}</Label>
              <Input
                type="datetime-local"
                value={toLocalInputValue(formData.endAt)}
                onChange={(e) => onChange({ ...formData, endAt: fromLocalInputValue(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label>{t('eventBuilder.registrationClosesAt', 'Закрытие регистрации')}</Label>
            <Input
              type="datetime-local"
              value={toLocalInputValue(formData.registrationClosesAt)}
              onChange={(e) => onChange({ ...formData, registrationClosesAt: fromLocalInputValue(e.target.value) })}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t('eventBuilder.locationType', 'Тип локации')}</Label>
              <Select
                value={formData.locationType || 'online'}
                onValueChange={(value) => onChange({ ...formData, locationType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">{t('eventBuilder.locationOnline', 'Онлайн')}</SelectItem>
                  <SelectItem value="offline">{t('eventBuilder.locationOffline', 'Офлайн')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t('eventBuilder.locationValue', 'Адрес или ссылка')}</Label>
              <Input
                value={formData.locationValue || ''}
                onChange={(e) => onChange({ ...formData, locationValue: e.target.value })}
                placeholder="https://"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>{t('eventBuilder.capacity', 'Вместимость')}</Label>
              <Input
                type="number"
                min={1}
                value={formData.capacity ?? ''}
                onChange={(e) => onChange({ ...formData, capacity: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>{t('eventBuilder.status', 'Статус')}</Label>
              <Select
                value={formData.status || 'draft'}
                onValueChange={(value) => onChange({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t('eventBuilder.statusDraft', 'Черновик')}</SelectItem>
                  <SelectItem value="published">{t('eventBuilder.statusPublished', 'Опубликован')}</SelectItem>
                  <SelectItem value="closed">{t('eventBuilder.statusClosed', 'Закрыт')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        {/* Form Tab */}
        <TabsContent value="form" className="space-y-4 mt-4">
          <div className="flex gap-2 flex-wrap">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => setShowGoogleImport(true)}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              {t('eventBuilder.importFromGoogleForms', 'Импорт из Google Forms')}
            </Button>
          </div>

          <GoogleFormImport
            open={showGoogleImport}
            onOpenChange={setShowGoogleImport}
            onImport={handleGoogleFormImport}
          />

          <EventFormBuilder
            fields={fields}
            onChange={handleFieldsChange}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 mt-4">
          {/* Paid event settings */}
          <div className="space-y-3 rounded-xl border border-border/60 p-4">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={Boolean(formData.isPaid)}
                onCheckedChange={(checked) => {
                  if (!isPremium) return;
                  onChange({ ...formData, isPaid: Boolean(checked) });
                }}
                disabled={!isPremium}
              />
              <Label className="text-sm">
                {t('eventBuilder.paidEvent', 'Платный ивент (Pro)')}
              </Label>
            </div>
            {!isPremium && (
              <p className="text-xs text-muted-foreground">
                {t('eventBuilder.paidEventProOnly', 'Оплаты доступны только в Pro.')}
              </p>
            )}
            {Boolean(formData.isPaid) && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>{t('eventBuilder.price', 'Цена')}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.price ?? ''}
                    onChange={(e) => onChange({ ...formData, price: Number(e.target.value) })}
                    disabled={!isPremium}
                  />
                </div>
                <div>
                  <Label>{t('eventBuilder.currency', 'Валюта')}</Label>
                  {isPremium ? (
                    <CurrencySelect
                      value={formData.currency || 'KZT'}
                      onValueChange={(value) => onChange({ ...formData, currency: value })}
                    />
                  ) : (
                    <Input value={formData.currency || 'KZT'} disabled />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Registration settings */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('eventBuilder.registrationSettings', 'Настройки регистрации')}</Label>
            
            <div className="grid gap-3">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={Boolean(formData.settings?.requireApproval)}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...formData,
                      settings: { ...(formData.settings || {}), requireApproval: Boolean(checked) },
                    })
                  }
                />
                {t('eventBuilder.requireApproval', 'Требовать подтверждение')}
              </label>
              
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={Boolean(formData.settings?.allowDuplicateEmail)}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...formData,
                      settings: { ...(formData.settings || {}), allowDuplicateEmail: Boolean(checked) },
                    })
                  }
                />
                {t('eventBuilder.allowDuplicateEmail', 'Разрешить повторные email')}
              </label>

              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={Boolean(formData.settings?.showProgressBar)}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...formData,
                      settings: { ...(formData.settings || {}), showProgressBar: Boolean(checked) },
                    })
                  }
                />
                {t('eventBuilder.showProgressBar', 'Показывать прогресс заполнения')}
              </label>
            </div>
          </div>

          {/* Note */}
          <div>
            <Label>{t('eventBuilder.shortNote', 'Короткая заметка')}</Label>
            <Textarea
              value={formData.settings?.note || ''}
              onChange={(e) =>
                onChange({
                  ...formData,
                  settings: { ...(formData.settings || {}), note: e.target.value },
                })
              }
              placeholder={t('eventBuilder.shortNotePlaceholder', 'Внутренняя заметка для организатора')}
            />
          </div>

          {/* Confirmation message */}
          <MultilingualInput
            label={t('eventBuilder.confirmationMessage', 'Сообщение после регистрации')}
            value={formData.settings?.confirmationMessage_i18n || createMultilingualString('')}
            onChange={(value) =>
              onChange({
                ...formData,
                settings: { ...(formData.settings || {}), confirmationMessage_i18n: value },
              })
            }
            placeholder={t('eventBuilder.confirmationMessagePlaceholder', 'Спасибо за регистрацию!')}
          />

          {/* Custom button text */}
          <MultilingualInput
            label={t('eventBuilder.buttonText', 'Текст кнопки')}
            value={formData.buttonText || createMultilingualString('')}
            onChange={(value) => onChange({ ...formData, buttonText: value })}
            placeholder={t('eventBuilder.buttonTextPlaceholder', 'Зарегистрироваться')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const EventBlockEditor = withBlockEditor(EventBlockEditorComponent, {
  hint: 'Создайте событие с формой регистрации и параметрами.',
  validate: validateEventBlock,
});
