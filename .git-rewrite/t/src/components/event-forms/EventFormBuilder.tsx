/**
 * EventFormBuilder - Google Forms-like form builder
 * Features: Sections, all field types, drag-drop reorder, conditional logic
 */
import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { createMultilingualString, getI18nText, type SupportedLanguage } from '@/lib/i18n-helpers';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import {
  Plus,
  GripVertical,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Type,
  AlignLeft,
  Mail,
  Phone,
  Hash,
  List,
  CheckSquare,
  Calendar,
  Clock,
  Link as LinkIcon,
  Star,
  BarChart3,
  Grid3X3,
  Upload,
  Image,
  FileText,
  Heading,
  Settings,
  Eye,
  Crown,
} from 'lucide-react';
import type { EventFormField, EventFormSection, EventFieldType, EventFieldOption } from '@/types/page';

// Field type configurations with icons and metadata
const FIELD_TYPES: Array<{
  value: EventFieldType;
  label: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  hasOptions?: boolean;
  proOnly?: boolean;
  category: 'text' | 'choice' | 'date' | 'special' | 'layout';
}> = [
  { value: 'short_text', label: 'Короткий текст', labelKey: 'eventFields.shortText', icon: Type, category: 'text' },
  { value: 'long_text', label: 'Длинный текст', labelKey: 'eventFields.longText', icon: AlignLeft, category: 'text' },
  { value: 'email', label: 'Email', labelKey: 'eventFields.email', icon: Mail, category: 'text' },
  { value: 'phone', label: 'Телефон', labelKey: 'eventFields.phone', icon: Phone, category: 'text' },
  { value: 'number', label: 'Число', labelKey: 'eventFields.number', icon: Hash, category: 'text' },
  { value: 'url', label: 'Ссылка', labelKey: 'eventFields.url', icon: LinkIcon, category: 'text' },
  { value: 'dropdown', label: 'Выпадающий список', labelKey: 'eventFields.dropdown', icon: List, hasOptions: true, category: 'choice' },
  { value: 'single_choice', label: 'Один вариант', labelKey: 'eventFields.singleChoice', icon: CheckSquare, hasOptions: true, category: 'choice' },
  { value: 'multiple_choice', label: 'Несколько вариантов', labelKey: 'eventFields.multipleChoice', icon: CheckSquare, hasOptions: true, category: 'choice' },
  { value: 'checkbox', label: 'Согласие', labelKey: 'eventFields.checkbox', icon: CheckSquare, category: 'choice' },
  { value: 'linear_scale', label: 'Линейная шкала', labelKey: 'eventFields.linearScale', icon: BarChart3, category: 'choice' },
  { value: 'rating', label: 'Рейтинг', labelKey: 'eventFields.rating', icon: Star, category: 'choice' },
  { value: 'date', label: 'Дата', labelKey: 'eventFields.date', icon: Calendar, category: 'date' },
  { value: 'time', label: 'Время', labelKey: 'eventFields.time', icon: Clock, category: 'date' },
  { value: 'datetime', label: 'Дата и время', labelKey: 'eventFields.datetime', icon: Calendar, category: 'date' },
  { value: 'grid', label: 'Сетка выбора', labelKey: 'eventFields.grid', icon: Grid3X3, category: 'choice' },
  { value: 'checkbox_grid', label: 'Сетка флажков', labelKey: 'eventFields.checkboxGrid', icon: Grid3X3, category: 'choice' },
  { value: 'section_header', label: 'Заголовок секции', labelKey: 'eventFields.sectionHeader', icon: Heading, category: 'layout' },
  { value: 'description', label: 'Описание', labelKey: 'eventFields.description', icon: FileText, category: 'layout' },
  { value: 'file', label: 'Файл', labelKey: 'eventFields.file', icon: Upload, proOnly: true, category: 'special' },
  { value: 'media', label: 'Медиа', labelKey: 'eventFields.media', icon: Image, proOnly: true, category: 'special' },
];

interface FieldCardProps {
  field: EventFormField;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<EventFormField>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  isPremium: boolean;
  language: SupportedLanguage;
}

function SortableFieldCard({ field, index, isExpanded, onToggle, onUpdate, onRemove, onDuplicate, isPremium, language }: FieldCardProps) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fieldConfig = FIELD_TYPES.find(f => f.value === field.type);
  const FieldIcon = fieldConfig?.icon || Type;
  const hasOptions = fieldConfig?.hasOptions;
  const isProField = fieldConfig?.proOnly && !isPremium;

  const fieldLabel = getI18nText(field.label_i18n, language) || t('eventBuilder.untitledField', 'Без названия');

  const addOption = useCallback(() => {
    const newOption: EventFieldOption = {
      id: crypto.randomUUID(),
      label_i18n: createMultilingualString(''),
    };
    onUpdate({ options: [...(field.options || []), newOption] });
  }, [field.options, onUpdate]);

  const updateOption = useCallback((optIndex: number, updates: Partial<EventFieldOption>) => {
    const newOptions = [...(field.options || [])];
    newOptions[optIndex] = { ...newOptions[optIndex], ...updates };
    onUpdate({ options: newOptions });
  }, [field.options, onUpdate]);

  const removeOption = useCallback((optIndex: number) => {
    onUpdate({ options: (field.options || []).filter((_, i) => i !== optIndex) });
  }, [field.options, onUpdate]);

  return (
    <div ref={setNodeRef} style={style} className="relative group">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div className={`rounded-xl border transition-all ${isExpanded ? 'border-primary/50 shadow-sm' : 'border-border/60 hover:border-border'} ${isProField ? 'opacity-60' : ''}`}>
          {/* Compact header */}
          <div className="flex items-center gap-2 p-3">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted/50"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            <FieldIcon className="h-4 w-4 text-primary shrink-0" />

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{fieldLabel}</span>
                {field.required && <span className="text-destructive text-xs">*</span>}
                {isProField && <Badge variant="secondary" className="text-[10px] h-4"><Crown className="h-2.5 w-2.5 mr-0.5" />Pro</Badge>}
              </div>
              <span className="text-xs text-muted-foreground">{t(fieldConfig?.labelKey || '', fieldConfig?.label)}</span>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDuplicate}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onRemove}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          {/* Expanded content */}
          <CollapsibleContent>
            <div className="px-3 pb-3 space-y-3 border-t pt-3">
              {/* Label */}
              <MultilingualInput
                label={t('eventBuilder.fieldLabel', 'Вопрос')}
                value={field.label_i18n || createMultilingualString('')}
                onChange={(value) => onUpdate({ label_i18n: value })}
                placeholder={t('eventBuilder.fieldLabelPlaceholder', 'Введите текст вопроса')}
              />

              {/* Type selector */}
              <div>
                <Label className="text-xs">{t('eventBuilder.fieldType', 'Тип поля')}</Label>
                <Select
                  value={field.type}
                  onValueChange={(value: EventFieldType) => {
                    const typeConfig = FIELD_TYPES.find(f => f.value === value);
                    if (typeConfig?.proOnly && !isPremium) return;
                    onUpdate({ type: value });
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(
                      FIELD_TYPES.reduce((acc, ft) => {
                        acc[ft.category] = [...(acc[ft.category] || []), ft];
                        return acc;
                      }, {} as Record<string, typeof FIELD_TYPES>)
                    ).map(([category, types]) => (
                      <div key={category}>
                        <div className="px-2 py-1 text-[10px] text-muted-foreground uppercase font-medium">
                          {t(`eventFields.category.${category}`, category)}
                        </div>
                        {types.map((ft) => {
                          const Icon = ft.icon;
                          return (
                            <SelectItem
                              key={ft.value}
                              value={ft.value}
                              disabled={ft.proOnly && !isPremium}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {t(ft.labelKey, ft.label)}
                                {ft.proOnly && <Badge variant="secondary" className="text-[10px] h-4 ml-1">Pro</Badge>}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Help text */}
              <MultilingualInput
                label={`${t('eventBuilder.fieldHelp', 'Подсказка')} (${t('fields.optional', 'опционально')})`}
                value={field.helpText_i18n || createMultilingualString('')}
                onChange={(value) => onUpdate({ helpText_i18n: value })}
                placeholder={t('eventBuilder.fieldHelpPlaceholder', 'Дополнительное пояснение')}
              />

              {/* Options for choice fields */}
              {hasOptions && (
                <div className="space-y-2">
                  <Label className="text-xs">{t('eventBuilder.options', 'Варианты ответа')}</Label>
                  {(field.options || []).map((option, optIndex) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <span className="w-6 text-center text-xs text-muted-foreground">{optIndex + 1}.</span>
                      <Input
                        value={getI18nText(option.label_i18n, language)}
                        onChange={(e) => updateOption(optIndex, { label_i18n: createMultilingualString(e.target.value) })}
                        placeholder={t('eventBuilder.optionPlaceholder', 'Вариант ответа')}
                        className="h-8 text-sm flex-1"
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeOption(optIndex)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addOption} className="w-full h-8 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    {t('eventBuilder.addOption', 'Добавить вариант')}
                  </Button>
                </div>
              )}

              {/* Linear scale config */}
              {field.type === 'linear_scale' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">{t('eventBuilder.scaleMin', 'От')}</Label>
                    <Input
                      type="number"
                      min={0}
                      max={1}
                      value={field.linearScale?.min ?? 1}
                      onChange={(e) => onUpdate({ linearScale: { ...field.linearScale, min: Number(e.target.value), max: field.linearScale?.max ?? 10 } })}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t('eventBuilder.scaleMax', 'До')}</Label>
                    <Input
                      type="number"
                      min={2}
                      max={10}
                      value={field.linearScale?.max ?? 10}
                      onChange={(e) => onUpdate({ linearScale: { ...field.linearScale, min: field.linearScale?.min ?? 1, max: Number(e.target.value) } })}
                      className="h-8"
                    />
                  </div>
                </div>
              )}

              {/* Required toggle */}
              <div className="flex items-center justify-between pt-2">
                <Label className="text-xs cursor-pointer" htmlFor={`required-${field.id}`}>
                  {t('eventBuilder.requiredField', 'Обязательное поле')}
                </Label>
                <Switch
                  id={`required-${field.id}`}
                  checked={field.required || field.type === 'email'}
                  onCheckedChange={(checked) => onUpdate({ required: checked })}
                  disabled={field.type === 'email'}
                />
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
}

interface EventFormBuilderProps {
  fields: EventFormField[];
  sections?: EventFormSection[];
  onChange: (fields: EventFormField[], sections?: EventFormSection[]) => void;
}

export function EventFormBuilder({ fields, sections, onChange }: EventFormBuilderProps) {
  const { t, i18n } = useTranslation();
  const { isPremium } = usePremiumStatus();
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const language = (i18n.language || 'ru') as SupportedLanguage;

  const createField = useCallback((type: EventFieldType = 'short_text'): EventFormField => ({
    id: crypto.randomUUID(),
    type,
    label_i18n: createMultilingualString(''),
    required: type === 'email',
    options: ['dropdown', 'single_choice', 'multiple_choice'].includes(type)
      ? [{ id: crypto.randomUUID(), label_i18n: createMultilingualString(t('eventBuilder.option1', 'Вариант 1')) }]
      : undefined,
  }), [t]);

  const addField = useCallback((type: EventFieldType = 'short_text') => {
    const newField = createField(type);
    onChange([...fields, newField]);
    setExpandedFieldId(newField.id);
    setShowAddMenu(false);
  }, [fields, onChange, createField]);

  const updateField = useCallback((index: number, updates: Partial<EventFormField>) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  }, [fields, onChange]);

  const removeField = useCallback((index: number) => {
    onChange(fields.filter((_, i) => i !== index));
  }, [fields, onChange]);

  const duplicateField = useCallback((index: number) => {
    const original = fields[index];
    const duplicate: EventFormField = {
      ...original,
      id: crypto.randomUUID(),
      label_i18n: {
        ru: `${getI18nText(original.label_i18n, 'ru')} (копия)`,
        en: `${getI18nText(original.label_i18n, 'en')} (copy)`,
        kk: `${getI18nText(original.label_i18n, 'kk')} (көшірме)`,
      },
      options: original.options?.map(opt => ({ ...opt, id: crypto.randomUUID() })),
    };
    const updated = [...fields];
    updated.splice(index + 1, 0, duplicate);
    onChange(updated);
    setExpandedFieldId(duplicate.id);
  }, [fields, onChange]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fields.findIndex(f => f.id === active.id);
    const newIndex = fields.findIndex(f => f.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const updated = [...fields];
    const [removed] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, removed);
    onChange(updated);
  }, [fields, onChange]);

  const fieldIds = useMemo(() => fields.map(f => f.id), [fields]);

  return (
    <div className="space-y-3">
      {/* Quick add buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => addField('short_text')} className="h-8 text-xs">
          <Type className="h-3 w-3 mr-1" />
          {t('eventFields.shortText', 'Текст')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => addField('single_choice')} className="h-8 text-xs">
          <CheckSquare className="h-3 w-3 mr-1" />
          {t('eventFields.choice', 'Выбор')}
        </Button>
        <Button variant="outline" size="sm" onClick={() => addField('rating')} className="h-8 text-xs">
          <Star className="h-3 w-3 mr-1" />
          {t('eventFields.rating', 'Рейтинг')}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setShowAddMenu(!showAddMenu)} className="h-8 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          {t('eventBuilder.moreTypes', 'Ещё')}
        </Button>
      </div>

      {/* Extended add menu */}
      {showAddMenu && (
        <div className="p-3 rounded-xl border bg-muted/50 space-y-3">
          <div className="text-xs font-medium text-muted-foreground uppercase">
            {t('eventBuilder.allFieldTypes', 'Все типы полей')}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {FIELD_TYPES.map((ft) => {
              const Icon = ft.icon;
              const isDisabled = ft.proOnly && !isPremium;
              return (
                <Button
                  key={ft.value}
                  variant="ghost"
                  size="sm"
                  disabled={isDisabled}
                  onClick={() => addField(ft.value)}
                  className="h-auto py-2 px-2 justify-start text-xs"
                >
                  <Icon className="h-4 w-4 mr-2 shrink-0" />
                  <span className="truncate">{t(ft.labelKey, ft.label)}</span>
                  {ft.proOnly && <Crown className="h-3 w-3 ml-auto text-amber-500" />}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      {/* Fields list */}
      {fields.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('eventBuilder.noFields', 'Нет полей формы')}</p>
          <p className="text-xs">{t('eventBuilder.addFieldHint', 'Добавьте поля с помощью кнопок выше')}</p>
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <SortableFieldCard
                  key={field.id}
                  field={field}
                  index={index}
                  isExpanded={expandedFieldId === field.id}
                  onToggle={() => setExpandedFieldId(expandedFieldId === field.id ? null : field.id)}
                  onUpdate={(updates) => updateField(index, updates)}
                  onRemove={() => removeField(index)}
                  onDuplicate={() => duplicateField(index)}
                  isPremium={isPremium}
                  language={language}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add more button at bottom */}
      {fields.length > 0 && (
        <Button variant="outline" className="w-full" onClick={() => setShowAddMenu(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('eventBuilder.addField', 'Добавить поле')}
        </Button>
      )}
    </div>
  );
}
