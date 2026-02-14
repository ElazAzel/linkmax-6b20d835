import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencySelect } from '@/components/form-fields/CurrencySelect';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { Clock, Plus, Trash2, CalendarDays, Wallet, Bell, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BlockEditorWrapper } from './BlockEditorWrapper';
import type { BookingBlock } from '@/types/page';
import { createMultilingualString, isMultilingualString, type MultilingualString } from '@/lib/i18n-helpers';

interface BookingBlockEditorProps {
  formData: BookingBlock;
  onChange: (updates: Partial<BookingBlock>) => void;
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

const DAYS_OF_WEEK = [
  { value: 0, key: 'sunday' },
  { value: 1, key: 'monday' },
  { value: 2, key: 'tuesday' },
  { value: 3, key: 'wednesday' },
  { value: 4, key: 'thursday' },
  { value: 5, key: 'friday' },
  { value: 6, key: 'saturday' },
];

export function BookingBlockEditor({ formData, onChange }: BookingBlockEditorProps) {
  const { t } = useTranslation();
  const block = formData;

  // Ensure title and description are MultilingualString
  const titleValue: MultilingualString = isMultilingualString(block.title) 
    ? block.title 
    : createMultilingualString(typeof block.title === 'string' ? block.title : '');
  
  const descriptionValue: MultilingualString = isMultilingualString(block.description)
    ? block.description
    : createMultilingualString(typeof block.description === 'string' ? block.description : '');

  // Merge updates with formData
  const handleChange = (updates: Partial<BookingBlock>) => {
    onChange({ ...formData, ...updates } as any);
  };
  const handleAddSlot = () => {
    const newSlot: TimeSlot = {
      id: `slot-${Date.now()}`,
      startTime: '10:00',
      endTime: '11:00',
    };
    handleChange({
      slots: [...(block.slots || []), newSlot],
    });
  };

  const handleRemoveSlot = (slotId: string) => {
    handleChange({
      slots: (block.slots || []).filter(s => s.id !== slotId),
    });
  };

  const handleSlotChange = (slotId: string, field: 'startTime' | 'endTime', value: string) => {
    handleChange({
      slots: (block.slots || []).map(s =>
        s.id === slotId ? { ...s, [field]: value } : s
      ),
    });
  };

  const handleToggleDay = (day: number) => {
    const current = block.disabledWeekdays || [];
    if (current.includes(day)) {
      handleChange({ disabledWeekdays: current.filter(d => d !== day) });
    } else {
      handleChange({ disabledWeekdays: [...current, day] });
    }
  };

  return (
    <BlockEditorWrapper
      isPremium
      description={t('bookingBlock.description', 'Блок для записи на прием с календарем и слотами')}
    >
      <div className="space-y-6">
        {/* Basic Settings */}
        <div className="space-y-4">
          <MultilingualInput
            label={t('bookingBlock.blockTitle', 'Заголовок')}
            value={titleValue}
            onChange={(val) => handleChange({ title: val })}
            type="input"
            placeholder={t('bookingBlock.titlePlaceholder', 'Записаться на прием')}
          />

          <MultilingualInput
            label={t('bookingBlock.blockDescription', 'Описание')}
            value={descriptionValue}
            onChange={(val) => handleChange({ description: val })}
            type="textarea"
            placeholder={t('bookingBlock.descriptionPlaceholder', 'Выберите удобное время для записи')}
          />

          <MultilingualInput
            label={t('bookingBlock.buttonText', 'Текст кнопки')}
            value={isMultilingualString(block.buttonText) 
              ? block.buttonText 
              : createMultilingualString(typeof block.buttonText === 'string' ? block.buttonText : '')}
            onChange={(val) => handleChange({ buttonText: val })}
            type="input"
            placeholder={t('bookingBlock.buttonTextPlaceholder', 'Записаться')}
          />
        </div>

        <Separator />

        {/* Working Hours */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('bookingBlock.workingHours', 'Рабочие часы')}
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('bookingBlock.startHour', 'Начало')}</Label>
              <Select
                value={String(block.workingHoursStart || 9)}
                onValueChange={v => handleChange({ workingHoursStart: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {i.toString().padStart(2, '0')}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('bookingBlock.endHour', 'Конец')}</Label>
              <Select
                value={String(block.workingHoursEnd || 18)}
                onValueChange={v => handleChange({ workingHoursEnd: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {i.toString().padStart(2, '0')}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('bookingBlock.slotDuration', 'Длительность слота (минут)')}</Label>
            <Select
              value={String(block.slotDuration || 60)}
              onValueChange={v => handleChange({ slotDuration: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">{t('bookingBlock.min15', '15 минут')}</SelectItem>
                <SelectItem value="30">{t('bookingBlock.min30', '30 минут')}</SelectItem>
                <SelectItem value="45">{t('bookingBlock.min45', '45 минут')}</SelectItem>
                <SelectItem value="60">{t('bookingBlock.hour1', '1 час')}</SelectItem>
                <SelectItem value="90">{t('bookingBlock.hour1_5', '1.5 часа')}</SelectItem>
                <SelectItem value="120">{t('bookingBlock.hour2', '2 часа')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Disabled Days */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            {t('bookingBlock.workingDays', 'Рабочие дни')}
          </h4>
          
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map(day => {
              const isDisabled = (block.disabledWeekdays || []).includes(day.value);
              return (
                <Badge
                  key={day.value}
                  variant={isDisabled ? "outline" : "default"}
                  className={`cursor-pointer transition-colors ${
                    isDisabled ? 'opacity-50 line-through' : ''
                  }`}
                  onClick={() => handleToggleDay(day.value)}
                >
                  {t(`days.${day.key}`, day.key.substring(0, 2))}
                </Badge>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('bookingBlock.clickToToggle', 'Нажмите на день чтобы включить/выключить')}
          </p>
        </div>

        <Separator />

        {/* Custom Slots */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">{t('bookingBlock.customSlots', 'Кастомные слоты')}</h4>
            <Button size="sm" variant="outline" onClick={handleAddSlot}>
              <Plus className="h-4 w-4 mr-1" />
              {t('bookingBlock.addSlot', 'Добавить')}
            </Button>
          </div>

          {(block.slots || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t('bookingBlock.noCustomSlots', 'Слоты генерируются автоматически на основе рабочих часов')}
            </p>
          ) : (
            <div className="space-y-2">
              {(block.slots || []).map((slot, idx) => (
                <Card key={slot.id} className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">#{idx + 1}</span>
                    <Input
                      type="time"
                      value={slot.startTime}
                      onChange={e => handleSlotChange(slot.id, 'startTime', e.target.value)}
                      className="w-28"
                    />
                    <span className="text-muted-foreground">—</span>
                    <Input
                      type="time"
                      value={slot.endTime}
                      onChange={e => handleSlotChange(slot.id, 'endTime', e.target.value)}
                      className="w-28"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveSlot(slot.id)}
                      className="ml-auto h-8 w-8 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Advanced Settings */}
        <div className="space-y-4">
          <h4 className="font-medium">{t('bookingBlock.advanced', 'Дополнительно')}</h4>
          
          <div className="space-y-2">
            <Label>{t('bookingBlock.maxDays', 'Максимум дней для записи')}</Label>
            <Select
              value={String(block.maxBookingDays || 30)}
              onValueChange={v => handleChange({ maxBookingDays: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">{t('bookingBlock.days7', '7 дней')}</SelectItem>
                <SelectItem value="14">{t('bookingBlock.days14', '14 дней')}</SelectItem>
                <SelectItem value="30">{t('bookingBlock.days30', '30 дней')}</SelectItem>
                <SelectItem value="60">{t('bookingBlock.days60', '60 дней')}</SelectItem>
                <SelectItem value="90">{t('bookingBlock.days90', '90 дней')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('bookingBlock.requirePhone', 'Телефон обязателен')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('bookingBlock.requirePhoneDesc', 'Клиент должен указать телефон')}
              </p>
            </div>
            <Switch
              checked={block.requirePhone || false}
              onCheckedChange={v => handleChange({ requirePhone: v })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('bookingBlock.requireEmail', 'Email обязателен')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('bookingBlock.requireEmailDesc', 'Клиент должен указать email')}
              </p>
            </div>
            <Switch
              checked={block.requireEmail || false}
              onCheckedChange={v => handleChange({ requireEmail: v })}
            />
          </div>
        </div>

        <Separator />

        {/* Prepayment Settings */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            {t('bookingBlock.prepayment', 'Предоплата')}
          </h4>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('bookingBlock.requirePrepayment', 'Требовать предоплату')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('bookingBlock.prepaymentDesc', 'После записи клиент перейдёт в WhatsApp для оплаты')}
              </p>
            </div>
            <Switch
              checked={block.requirePrepayment || false}
              onCheckedChange={v => handleChange({ requirePrepayment: v })}
            />
          </div>

          {block.requirePrepayment && (
            <>
              <div className="space-y-2">
                <Label>{t('bookingBlock.prepaymentPhone', 'WhatsApp для оплаты')}</Label>
                <Input
                  value={block.prepaymentPhone || ''}
                  onChange={e => handleChange({ prepaymentPhone: e.target.value })}
                  placeholder="+7 777 123 45 67"
                  type="tel"
                />
                <p className="text-xs text-muted-foreground">
                  {t('bookingBlock.phoneHint', 'Номер телефона с WhatsApp для приёма оплаты')}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('bookingBlock.prepaymentAmount', 'Сумма предоплаты')}</Label>
                  <Input
                    type="number"
                    value={block.prepaymentAmount || ''}
                    onChange={e => handleChange({ prepaymentAmount: Number(e.target.value) || undefined })}
                    placeholder="5000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('bookingBlock.currency', 'Валюта')}</Label>
                  <CurrencySelect
                    value={block.prepaymentCurrency || 'KZT'}
                    onValueChange={v => handleChange({ prepaymentCurrency: v as any })}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Telegram Notifications */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t('bookingBlock.notifications', 'Уведомления в Telegram')}
          </h4>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('bookingBlock.dailyReminder', 'Утреннее напоминание')}</Label>
                <p className="text-xs text-muted-foreground">
                  {t('bookingBlock.dailyReminderDesc', 'Получите список записей на сегодня')}
                </p>
              </div>
              <Switch
                checked={block.dailyReminderEnabled || false}
                onCheckedChange={v => handleChange({ dailyReminderEnabled: v })}
              />
            </div>

            {block.dailyReminderEnabled && (
              <div className="flex items-center gap-2 ml-0">
                <Label className="text-sm text-muted-foreground whitespace-nowrap">
                  {t('bookingBlock.reminderTime', 'Время напоминания')}:
                </Label>
                <Input
                  type="time"
                  value={block.dailyReminderTime || '08:50'}
                  onChange={e => handleChange({ dailyReminderTime: e.target.value })}
                  className="w-28"
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                {t('bookingBlock.weeklyMotivation', 'Мотивация на неделю')}
              </Label>
              <p className="text-xs text-muted-foreground">
                {t('bookingBlock.weeklyMotivationDesc', 'Понедельник в 9:00 — персональное вдохновение')}
              </p>
            </div>
            <Switch
              checked={block.weeklyMotivationEnabled || false}
              onCheckedChange={v => handleChange({ weeklyMotivationEnabled: v })}
            />
          </div>
        </div>
      </div>
    </BlockEditorWrapper>
  );
}
