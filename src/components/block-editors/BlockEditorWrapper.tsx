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
import { 
  Crown, 
  Info, 
  Calendar as CalendarIcon, 
  X, 
  ChevronDown, 
 Settings2,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils/utils';
import { PaidContentSettings } from './PaidContentSettings';
import type { BlockStyle } from '@/types/page';

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
 * HOC to wrap block editors with common functionality
 */
export function withBlockEditor<P extends BaseBlockEditorProps>(
  Component: React.ComponentType<P>,
  options?: {
    isPremium?: boolean;
    description?: string;
    hint?: string;
  validate?: (formData: BaseBlockEditorProps['formData']) => string | null;
  }
) {
  return function WrappedBlockEditor(props: P) {
    const { t } = useTranslation();
    const { formData, onChange } = props;
    const [advancedOpen, setAdvancedOpen] = useState(false);

    // Validation logic
    const validationError = options?.validate?.(formData);

    const handleChange = (updates: Partial<BaseBlockEditorProps['formData']>) => {
      onChange(updates as any); // Cast only here because of generic P
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
      handleChange({ ...formData, schedule: undefined });
    };

    const hasSchedule = formData.schedule?.startDate || formData.schedule?.endDate;

    // Count of active advanced features. Colours, font, text effect and
    // animation live in the Style tab (BlockStyleEditor), not here.
    const advancedCount = [
      formData.blockStyle?.isPaidContent,
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
              <Badge variant="secondary" className="ml-2 h-5 px-1.5 text-xs rounded-full bg-primary/10 text-primary border-0">
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
                {/* Paid Content Settings */}
                <PaidContentSettings
                  blockStyle={formData.blockStyle}
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

