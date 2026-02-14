/**
 * Reusable currency selector component
 * Used across product and shop blocks
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const currencies = [
  { code: 'KZT', symbol: '₸', name: 'Тенге (Казахстан)' },
  { code: 'RUB', symbol: '₽', name: 'Рубль (Россия)' },
  { code: 'BYN', symbol: 'Br', name: 'Рубль (Беларусь)' },
  { code: 'AMD', symbol: '֏', name: 'Драм (Армения)' },
  { code: 'AZN', symbol: '₼', name: 'Манат (Азербайджан)' },
  { code: 'KGS', symbol: 'с', name: 'Сом (Кыргызстан)' },
  { code: 'TJS', symbol: 'ЅМ', name: 'Сомони (Таджикистан)' },
  { code: 'TMT', symbol: 'm', name: 'Манат (Туркменистан)' },
  { code: 'UZS', symbol: '', name: 'Сум (Узбекистан)' },
  { code: 'USD', symbol: '$', name: 'Доллар США' },
  { code: 'EUR', symbol: '€', name: 'Евро' },
  { code: 'GBP', symbol: '£', name: 'Фунт стерлингов' },
  { code: 'CNY', symbol: '¥', name: 'Юань' },
  { code: 'JPY', symbol: '¥', name: 'Йена' },
  { code: 'CHF', symbol: '₣', name: 'Швейцарский франк' },
  { code: 'CAD', symbol: '$', name: 'Канадский доллар' },
  { code: 'AUD', symbol: '$', name: 'Австралийский доллар' },
];

export function CurrencySelect({ value, onValueChange }: CurrencySelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {currency.symbol} {currency.code} - {currency.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function getCurrencySymbol(code: string): string {
  return currencies.find((c) => c.code === code)?.symbol || code;
}
