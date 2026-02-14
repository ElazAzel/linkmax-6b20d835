/**
 * Reusable currency selector component
 * Used across product and shop blocks
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslation } from 'react-i18next';

interface CurrencySelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const currencies = [
  { code: 'KZT', symbol: '₸', labelKey: 'currency.names.KZT', defaultLabel: 'Tenge (Kazakhstan)' },
  { code: 'RUB', symbol: '₽', labelKey: 'currency.names.RUB', defaultLabel: 'Ruble (Russia)' },
  { code: 'BYN', symbol: 'Br', labelKey: 'currency.names.BYN', defaultLabel: 'Ruble (Belarus)' },
  { code: 'AMD', symbol: '֏', labelKey: 'currency.names.AMD', defaultLabel: 'Dram (Armenia)' },
  { code: 'AZN', symbol: '₼', labelKey: 'currency.names.AZN', defaultLabel: 'Manat (Azerbaijan)' },
  { code: 'KGS', symbol: 'с', labelKey: 'currency.names.KGS', defaultLabel: 'Som (Kyrgyzstan)' },
  { code: 'TJS', symbol: 'ЅМ', labelKey: 'currency.names.TJS', defaultLabel: 'Somoni (Tajikistan)' },
  { code: 'TMT', symbol: 'm', labelKey: 'currency.names.TMT', defaultLabel: 'Manat (Turkmenistan)' },
  { code: 'UZS', symbol: '', labelKey: 'currency.names.UZS', defaultLabel: 'Som (Uzbekistan)' },
  { code: 'USD', symbol: '$', labelKey: 'currency.names.USD', defaultLabel: 'US Dollar' },
  { code: 'EUR', symbol: '€', labelKey: 'currency.names.EUR', defaultLabel: 'Euro' },
  { code: 'GBP', symbol: '£', labelKey: 'currency.names.GBP', defaultLabel: 'Pound Sterling' },
  { code: 'CNY', symbol: '¥', labelKey: 'currency.names.CNY', defaultLabel: 'Yuan' },
  { code: 'JPY', symbol: '¥', labelKey: 'currency.names.JPY', defaultLabel: 'Yen' },
  { code: 'CHF', symbol: '₣', labelKey: 'currency.names.CHF', defaultLabel: 'Swiss Franc' },
  { code: 'CAD', symbol: '$', labelKey: 'currency.names.CAD', defaultLabel: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$', labelKey: 'currency.names.AUD', defaultLabel: 'Australian Dollar' },
];

export function CurrencySelect({ value, onValueChange }: CurrencySelectProps) {
  const { t } = useTranslation();

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency.code} value={currency.code}>
            {currency.symbol} {currency.code} - {t(currency.labelKey, currency.defaultLabel)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function getCurrencySymbol(code: string): string {
  return currencies.find((c) => c.code === code)?.symbol || code;
}
