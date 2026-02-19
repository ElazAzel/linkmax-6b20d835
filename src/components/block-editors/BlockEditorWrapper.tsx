import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crown, Info, Calendar as CalendarIcon, X, ChevronDown, Settings2, Palette, Sparkles, Wand2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/utils';
import { AnimationSettings } from '@/components/editor/AnimationSettings';
import { PaidContentSettings } from './PaidContentSettings';
import { getTextEffectClass } from '@/lib/blocks/block-styling';
import type { Block, BlockStyle, BlockSizePreset, BlockFontFamily } from '@/types/page';

export interface BaseBlockEditorProps {
  formData: any;
  onChange: (updates: any) => void;
}

interface BlockEditorWrapperProps {
  children: ReactNode;
  isPremium?: boolean;
  description?: string;
  hint?: string;
}

// Font families that support RU/EN/KK
const FONT_FAMILIES: { value: BlockFontFamily; label: string; preview: string }[] = [
  { value: 'sans', label: 'Sans-serif', preview: 'Aa' },
  { value: 'serif', label: 'Serif', preview: 'Aa' },
  { value: 'mono', label: 'Monospace', preview: 'Aa' },
  { value: 'display', label: 'Display', preview: 'Aa' },
  { value: 'rounded', label: 'Rounded', preview: 'Aa' },
];

const getFontClass = (font: BlockFontFamily): string => {
  switch (font) {
    case 'sans': return 'font-sans';
    case 'serif': return 'font-serif';
    case 'mono': return 'font-mono';
    case 'display': return 'font-sans font-bold tracking-tight';
    case 'rounded': return 'font-sans';
    default: return 'font-sans';
  }
};

// Preset color swatches
const COLOR_SWATCHES = [
  '', // no color / reset
  '#ffffff', '#000000', '#f43f5e', '#ec4899',
  '#a855f7', '#6366f1', '#3b82f6', '#06b6d4',
  '#10b981', '#84cc16', '#f59e0b', '#f97316',
];

/**
 * Wrapper component for block editors
 */
export function BlockEditorWrapper({
  children,
  isPremium = false,
  description,
  hint,
}: BlockEditorWrapperProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {isPremium && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Crown className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="text-sm text-amber-600 font-medium">
            {description || t('blockEditor.premiumFeature', 'Premium')}
          </span>
        </div>
      )}

      {hint && !isPremium && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-primary/5 border border-primary/10">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span className="text-xs text-muted-foreground">{hint}</span>
        </div>
      )}

      {children}
    </div>
  );
}

/**
 * Color swatch picker component
 */
function ColorSwatchPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (color: string) => void;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {COLOR_SWATCHES.map((color, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(color)}
              className={cn(
                "h-7 w-7 rounded-lg border-2 transition-all duration-150 hover:scale-110 active:scale-95",
                value === color
                  ? "border-primary ring-2 ring-primary/20 scale-110"
                  : "border-border/30 hover:border-border",
                !color && "bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:8px_8px]"
              )}
              style={color ? { backgroundColor: color } : undefined}
              title={color || 'Без цвета'}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <Input
            type="color"
            value={value || '#ffffff'}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 p-0.5 cursor-pointer rounded-lg border-border/30"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * HOC to wrap block editors with common functionality
 */
export function withBlockEditor<P extends BaseBlockEditorProps>(
  Component: React.ComponentType<P>,
  options?: {
    isPremium?: boolean;
    description?: string;
    hint?: string;
    validate?: (formData: any) => string | null;
  }
) {
  return function WrappedBlockEditor(props: P) {
    const { t } = useTranslation();
    const { formData, onChange } = props;
    const [advancedOpen, setAdvancedOpen] = useState(false);

    // Validation logic
    const validationError = options?.validate?.(formData);

    const handleChange = (updates: any) => {
      onChange(updates);
    };

    const handleScheduleChange = (field: 'startDate' | 'endDate', value: string) => {
      const currentSchedule = formData.schedule || {};
      handleChange({
        ...formData,
        schedule: {
          ...currentSchedule,
          [field]: value || undefined,
        }
      });
    };

    const handleRemoveSchedule = () => {
      const { schedule, ...rest } = formData;
      handleChange(rest);
    };

    // Block styling handlers
    const handleBackgroundColorChange = (color: string) => {
      handleChange({
        ...formData,
        blockStyle: {
          ...(formData.blockStyle || {}),
          backgroundColor: color || undefined,
        }
      });
    };

    const handleTextColorChange = (color: string) => {
      handleChange({
        ...formData,
        blockStyle: {
          ...(formData.blockStyle || {}),
          textColor: color || undefined,
        }
      });
    };

    const handleFontFamilyChange = (font: BlockFontFamily) => {
      handleChange({
        ...formData,
        blockStyle: {
          ...(formData.blockStyle || {}),
          fontFamily: font,
        }
      });
    };

    const handleTextEffectChange = (effect: BlockStyle['textEffect']) => {
      handleChange({
        ...formData,
        blockStyle: {
          ...(formData.blockStyle || {}),
          textEffect: effect === 'none' ? undefined : effect,
        }
      });
    };

    const handleClearBlockStyle = () => {
      const { blockStyle, ...rest } = formData;
      const { backgroundColor, textColor, fontFamily, textEffect, ...otherStyles } = blockStyle || {};
      handleChange({
        ...rest,
        blockStyle: Object.keys(otherStyles).length > 0 ? otherStyles : undefined,
      });
    };

    const currentBgColor = formData.blockStyle?.backgroundColor || '';
    const currentTextColor = formData.blockStyle?.textColor || '';
    const currentFontFamily = formData.blockStyle?.fontFamily || 'sans';
    const currentTextEffect = formData.blockStyle?.textEffect || 'none';
    const hasBlockStyles = currentBgColor || currentTextColor || formData.blockStyle?.fontFamily || formData.blockStyle?.textEffect;
    const hasSchedule = formData.schedule?.startDate || formData.schedule?.endDate;

    // Count of active advanced features
    const advancedCount = [
      hasBlockStyles,
      formData.blockStyle?.isPaidContent,
      formData.blockStyle?.animation && formData.blockStyle.animation !== 'none',
      hasSchedule,
    ].filter(Boolean).length;

    return (
      <BlockEditorWrapper
        isPremium={options?.isPremium}
        description={options?.description}
        hint={options?.hint}
      >
        {validationError && (
          <Alert variant="destructive" className="rounded-xl">
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        {/* Main block content editor */}
        <Component {...props} onChange={handleChange} />

        {/* Advanced Settings Toggle */}
        <button
          type="button"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className={cn(
            "w-full flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200",
            "border border-border/30 hover:border-border/50",
            advancedOpen
              ? "bg-primary/5 border-primary/20"
              : "bg-muted/20 hover:bg-muted/40"
          )}
        >
          <div className={cn(
            "h-8 w-8 rounded-xl flex items-center justify-center shrink-0 transition-colors",
            advancedOpen ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}>
            <Settings2 className="h-4 w-4" />
          </div>
          <div className="flex-1 text-left">
            <span className="text-sm font-semibold">{t('blockEditor.advancedSettings', 'Дополнительные настройки')}</span>
            {advancedCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-[10px] rounded-full bg-primary/10 text-primary border-0">
                {advancedCount}
              </Badge>
            )}
          </div>
          <motion.div
            animate={{ rotate: advancedOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </motion.div>
        </button>

        <AnimatePresence initial={false}>
          {advancedOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="space-y-3 pt-1">
                {/* Block Style Card */}
                <div className="rounded-2xl border border-border/30 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <Palette className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">{t('blockEditor.blockStyle', 'Цвет и шрифт')}</span>
                    </div>
                    {hasBlockStyles && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearBlockStyle}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3 mr-1" />
                        {t('common.reset', 'Сбросить')}
                      </Button>
                    )}
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Background Color */}
                    <ColorSwatchPicker
                      value={currentBgColor}
                      onChange={handleBackgroundColorChange}
                      label={t('blockEditor.backgroundColor', 'Цвет фона')}
                    />

                    {/* Text Color */}
                    <ColorSwatchPicker
                      value={currentTextColor}
                      onChange={handleTextColorChange}
                      label={t('blockEditor.textColor', 'Цвет текста')}
                    />

                    {/* Font Family */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground font-medium">{t('blockEditor.fontFamily', 'Шрифт')}</Label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {FONT_FAMILIES.map((font) => (
                          <button
                            key={font.value}
                            type="button"
                            onClick={() => handleFontFamilyChange(font.value)}
                            className={cn(
                              "flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all duration-150",
                              "hover:bg-muted/60 active:scale-95",
                              currentFontFamily === font.value
                                ? "bg-primary/10 ring-2 ring-primary/20 text-primary"
                                : "bg-muted/30 text-muted-foreground"
                            )}
                          >
                            <span className={cn("text-lg leading-none", getFontClass(font.value))}>{font.preview}</span>
                            <span className="text-[10px] font-medium truncate w-full text-center">{font.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Text Effect */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3" />
                        {t('blockEditor.textEffect', 'Эффект текста')}
                      </Label>
                      <Select
                        value={currentTextEffect}
                        onValueChange={(v: string) => handleTextEffectChange(v as BlockStyle['textEffect'])}
                        modal={false}
                      >
                        <SelectTrigger className="h-10 rounded-xl bg-muted/30 border-border/30">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('textEffects.none', 'Без эффекта')}</SelectItem>
                          <SelectItem value="shimmer">{t('textEffects.shimmer', '✨ Переливание')}</SelectItem>
                          <SelectItem value="glow">{t('textEffects.glow', '💡 Свечение')}</SelectItem>
                          <SelectItem value="pulse">{t('textEffects.pulse', '💓 Пульсация')}</SelectItem>
                          <SelectItem value="blink">{t('textEffects.blink', '👁 Мигание')}</SelectItem>
                          <SelectItem value="rainbow">{t('textEffects.rainbow', '🌈 Радуга')}</SelectItem>
                          <SelectItem value="neon">{t('textEffects.neon', '🔮 Неон')}</SelectItem>
                          <SelectItem value="typewriter">{t('textEffects.typewriter', '⌨️ Печатная машинка')}</SelectItem>
                          <SelectItem value="gradient-flow">{t('textEffects.gradientFlow', '🌊 Текучий градиент')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Preview */}
                    {hasBlockStyles && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-medium">{t('blockEditor.preview', 'Превью')}</Label>
                        <div
                          className={cn("p-4 rounded-xl border border-border/20", getFontClass(currentFontFamily))}
                          style={{
                            backgroundColor: currentBgColor || 'var(--card)',
                            color: currentTextColor || 'var(--foreground)',
                          }}
                        >
                          <p className={cn("text-sm", getTextEffectClass(currentTextEffect as BlockStyle['textEffect']))}>
                            {t('blockEditor.previewText', 'Пример текста блока')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Paid Content Settings */}
                <PaidContentSettings
                  blockStyle={formData.blockStyle}
                  onChange={(style: BlockStyle) => handleChange({ ...formData, blockStyle: style })}
                />

                {/* Animation Settings */}
                <AnimationSettings
                  style={formData.blockStyle}
                  onChange={(style: BlockStyle) => handleChange({ ...formData, blockStyle: style })}
                />

                {/* Schedule Settings */}
                <div className="rounded-2xl border border-border/30 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold">{t('blockEditor.schedule', 'Расписание')}</span>
                    </div>
                    {hasSchedule && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveSchedule}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3 mr-1" />
                        {t('blockEditor.clearSchedule', 'Очистить')}
                      </Button>
                    )}
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-medium">{t('blockEditor.appearDate', 'Появление')}</Label>
                        <DateTimePicker
                          value={formData.schedule?.startDate}
                          onChange={(value) => handleScheduleChange('startDate', value)}
                          placeholder={t('blockEditor.selectDate', 'Выберите дату')}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground font-medium">{t('blockEditor.disappearDate', 'Исчезновение')}</Label>
                        <DateTimePicker
                          value={formData.schedule?.endDate}
                          onChange={(value) => handleScheduleChange('endDate', value)}
                          placeholder={t('blockEditor.selectDate', 'Выберите дату')}
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-muted-foreground">
                      {t('blockEditor.scheduleHint', 'Блок будет виден только в указанный период')}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </BlockEditorWrapper>
    );
  };
}

interface DateTimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function DateTimePicker({ value, onChange, placeholder }: DateTimePickerProps) {
  const [date, setDate] = useState<Date | undefined>(value ? new Date(value) : undefined);
  const [time, setTime] = useState<string>(
    value ? format(new Date(value), 'HH:mm') : '00:00'
  );

  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate) {
      const [hours, minutes] = time.split(':');
      newDate.setHours(parseInt(hours), parseInt(minutes));
      onChange(newDate.toISOString());
    }
  };

  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (date) {
      const [hours, minutes] = newTime.split(':');
      const updatedDate = new Date(date);
      updatedDate.setHours(parseInt(hours), parseInt(minutes));
      onChange(updatedDate.toISOString());
    }
  };

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'flex-1 justify-start text-left font-normal h-10 rounded-xl border-border/30',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'dd.MM.yyyy') : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateChange}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        value={time}
        onChange={(e) => handleTimeChange(e.target.value)}
        className="w-24 rounded-xl border-border/30"
      />
    </div>
  );
}

// Export font class helper for use in blocks
export { getFontClass };
