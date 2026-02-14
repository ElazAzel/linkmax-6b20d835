import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NICHES, NICHE_ICONS, type Niche } from '@/lib/niches';

interface NicheSelectorProps {
  value?: Niche;
  onChange: (niche: Niche) => void;
  disabled?: boolean;
}

export function NicheSelector({ value, onChange, disabled }: NicheSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">{t('settings.niche', 'Category')}</Label>
      <Select
        value={value || 'other'}
        onValueChange={(val) => onChange(val as Niche)}
        disabled={disabled}
      >
        <SelectTrigger className="bg-background/50">
          <SelectValue>
            {value && (
              <span className="flex items-center gap-2">
                <span>{NICHE_ICONS[value]}</span>
                <span>{t(`niches.${value}`, value)}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {NICHES.map((niche) => (
            <SelectItem key={niche} value={niche}>
              <span className="flex items-center gap-2">
                <span>{NICHE_ICONS[niche]}</span>
                <span>{t(`niches.${niche}`, niche)}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
