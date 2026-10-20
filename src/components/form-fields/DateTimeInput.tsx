import { useEffect, useRef } from 'react';
import { Input, type InputProps } from '@/components/ui/input';
import { fromDateTimeInput, toDateTimeInput } from '@/lib/datetime-input';

interface DateTimeInputProps extends Omit<InputProps, 'value' | 'defaultValue' | 'onChange' | 'type'> {
  value?: string;
  timeZone?: string;
  onValueChange: (value: string) => void;
}

export function DateTimeInput({ value, timeZone, onValueChange, onBlur, ...props }: DateTimeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const focused = useRef(false);
  useEffect(() => {
    if (inputRef.current && !focused.current) inputRef.current.value = toDateTimeInput(value, timeZone);
  }, [value, timeZone]);

  return <Input {...props} ref={inputRef} type="datetime-local"
    defaultValue={toDateTimeInput(value, timeZone)}
    onFocus={() => { focused.current = true; }}
    onChange={(event) => {
      const instant = fromDateTimeInput(event.currentTarget.value, timeZone);
      if (instant !== undefined) onValueChange(instant);
    }}
    onBlur={(event) => {
      focused.current = false;
      // Browsers expose an empty value while individual date segments are incomplete.
      // Leave those segments alone during editing; only persist a clear on blur.
      if (!event.currentTarget.value && !event.currentTarget.validity.badInput) onValueChange('');
      else if (fromDateTimeInput(event.currentTarget.value, timeZone) === undefined) {
        event.currentTarget.value = toDateTimeInput(value, timeZone);
      }
      onBlur?.(event);
    }} />;
}
