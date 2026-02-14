import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Crown, Info, Calendar as CalendarIcon, X, Maximize2, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, ChevronDown, Settings2, Palette, Type, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AnimationSettings } from '@/components/editor/AnimationSettings';
import { PaidContentSettings } from './PaidContentSettings';
import { getTextEffectClass } from '@/lib/block-styling';
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

/**
 * Wrapper component for block editors
 * Provides consistent styling, premium badges, and helpful hints
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
        <Alert>
          <Crown className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Crown className="h-3 w-3" />
                Premium
              </Badge>
              <span>{description || t('blockEditor.premiumFeature', 'This is a Premium feature.')}</span>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {hint && !isPremium && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">{hint}</AlertDescription>
        </Alert>
      )}

      {children}
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
    
    // Enhanced onChange with validation
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

    const handleBlockSizeChange = (size: BlockSizePreset) => {
      handleChange({
        ...formData,
        blockSize: size
      });
    };

    const handleContentAlignmentChange = (alignment: BlockStyle['contentAlignment']) => {
      handleChange({
        ...formData,
        blockStyle: {
          ...(formData.blockStyle || {}),
          contentAlignment: alignment
        }
      });
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

    const currentSize = formData.blockSize || 'full';
    const currentContentAlignment = formData.blockStyle?.contentAlignment || 'center';
    const currentBgColor = formData.blockStyle?.backgroundColor || '';
    const currentTextColor = formData.blockStyle?.textColor || '';
    const currentFontFamily = formData.blockStyle?.fontFamily || 'sans';
    const currentTextEffect = formData.blockStyle?.textEffect || 'none';
    const hasBlockStyles = currentBgColor || currentTextColor || formData.blockStyle?.fontFamily || formData.blockStyle?.textEffect;

    return (
      <BlockEditorWrapper
        isPremium={options?.isPremium}
        description={options?.description}
        hint={options?.hint}
      >
        {validationError && (
          <Alert variant="destructive">
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}
        
        {/* Main block content editor */}
        <Component {...props} onChange={handleChange} />
        
        <Separator className="my-4" />
        
        {/* Collapsible Advanced Settings */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-between p-4 h-auto rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <span className="font-semibold">{t('blockEditor.advancedSettings', 'Дополнительные настройки')}</span>
              </div>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform",
                advancedOpen && "rotate-180"
              )} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 mt-4">
            {/* Block Color & Font Settings */}
            <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  <Label className="text-base font-semibold">{t('blockEditor.blockStyle', 'Цвет и шрифт блока')}</Label>
                </div>
                {hasBlockStyles && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearBlockStyle}
                    className="h-7 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    {t('common.reset', 'Сбросить')}
                  </Button>
                )}
              </div>
              
              {/* Background Color */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('blockEditor.backgroundColor', 'Цвет фона')}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={currentBgColor || '#ffffff'}
                    onChange={(e) => handleBackgroundColorChange(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer rounded-lg"
                  />
                  <Input
                    type="text"
                    value={currentBgColor}
                    onChange={(e) => handleBackgroundColorChange(e.target.value)}
                    placeholder={t('blockEditor.noColor', 'Без цвета')}
                    className="flex-1 bg-background/50"
                  />
                </div>
              </div>

              {/* Text Color */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('blockEditor.textColor', 'Цвет текста')}</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={currentTextColor || '#000000'}
                    onChange={(e) => handleTextColorChange(e.target.value)}
                    className="w-12 h-10 p-1 cursor-pointer rounded-lg"
                  />
                  <Input
                    type="text"
                    value={currentTextColor}
                    onChange={(e) => handleTextColorChange(e.target.value)}
                    placeholder={t('blockEditor.noColor', 'Без цвета')}
                    className="flex-1 bg-background/50"
                  />
                </div>
              </div>

              {/* Font Family */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('blockEditor.fontFamily', 'Шрифт')}</Label>
                <Select value={currentFontFamily} onValueChange={(v) => handleFontFamilyChange(v as BlockFontFamily)}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        <div className="flex items-center gap-3">
                          <span className={cn("text-lg w-8", getFontClass(font.value))}>{font.preview}</span>
                          <span>{font.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Text Effect */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  {t('blockEditor.textEffect', 'Эффект текста')}
                </Label>
                <Select value={currentTextEffect} onValueChange={(v) => handleTextEffectChange(v as BlockStyle['textEffect'])}>
                  <SelectTrigger className="bg-background/50">
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
                  <Label className="text-xs text-muted-foreground">{t('blockEditor.preview', 'Превью')}</Label>
                  <div 
                    className={cn("p-4 rounded-lg border border-border/30", getFontClass(currentFontFamily))}
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

            {/* Block Size Selector */}
            <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2">
                <Maximize2 className="h-4 w-4 text-primary" />
                <Label className="text-base font-semibold">{t('blockEditor.blockSize', 'Размер блока')}</Label>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={currentSize === 'full' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleBlockSizeChange('full')}
                  className="flex-1"
                >
                  <span className="w-5 h-3 rounded border bg-primary/30 mr-2" />
                  {t('blockEditor.sizeFull', 'Полная')}
                </Button>
                <Button
                  type="button"
                  variant={currentSize === 'half' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleBlockSizeChange('half')}
                  className="flex-1"
                >
                  <span className="w-3 h-3 rounded border bg-primary/20 mr-2" />
                  {t('blockEditor.sizeHalf', 'Половина')}
                </Button>
              </div>
            </div>

            {/* Content Alignment - simplified to buttons */}
            <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2">
                <AlignVerticalJustifyCenter className="h-4 w-4 text-primary" />
                <Label className="text-base font-semibold">{t('blockEditor.alignment', 'Выравнивание')}</Label>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={currentContentAlignment === 'top' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => handleContentAlignmentChange('top')}
                  className="flex-1 h-10"
                >
                  <AlignVerticalJustifyStart className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={currentContentAlignment === 'center' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => handleContentAlignmentChange('center')}
                  className="flex-1 h-10"
                >
                  <AlignVerticalJustifyCenter className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={currentContentAlignment === 'bottom' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => handleContentAlignmentChange('bottom')}
                  className="flex-1 h-10"
                >
                  <AlignVerticalJustifyEnd className="h-4 w-4" />
                </Button>
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
        
            <Separator className="my-4" />
        
            {/* Schedule Settings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">{t('blockEditor.schedule', 'Расписание показа')}</Label>
                {formData.schedule && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveSchedule}
                    className="h-8"
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t('blockEditor.clearSchedule', 'Очистить')}
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm">{t('blockEditor.appearDate', 'Появление')}</Label>
                  <DateTimePicker
                    value={formData.schedule?.startDate}
                    onChange={(value) => handleScheduleChange('startDate', value)}
                    placeholder={t('blockEditor.selectDate', 'Выберите дату')}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm">{t('blockEditor.disappearDate', 'Исчезновение')}</Label>
                  <DateTimePicker
                    value={formData.schedule?.endDate}
                    onChange={(value) => handleScheduleChange('endDate', value)}
                    placeholder={t('blockEditor.selectDate', 'Выберите дату')}
                  />
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                {t('blockEditor.scheduleHint', 'Блок будет виден только в указанный период')}
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
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
              'flex-1 justify-start text-left font-normal h-10',
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
        className="w-24"
      />
    </div>
  );
}

// Export font class helper for use in blocks
export { getFontClass };
