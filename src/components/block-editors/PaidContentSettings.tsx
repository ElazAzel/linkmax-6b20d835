import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Coins from 'lucide-react/dist/esm/icons/coins';
import type { BlockStyle } from '@/types/page';
import { useTranslation } from 'react-i18next';

interface PaidContentSettingsProps {
  blockStyle?: BlockStyle;
  onChange: (style: BlockStyle) => void;
}

export function PaidContentSettings({ blockStyle, onChange }: PaidContentSettingsProps) {
  const isPaidContent = blockStyle?.isPaidContent || false;
  const price = blockStyle?.paidContentPrice || 0;
  const { t } = useTranslation();

  const handleToggle = (checked: boolean) => {
    onChange({
      ...blockStyle,
      isPaidContent: checked,
      paidContentCurrency: 'KZT',
    });
  };

  const handlePriceChange = (value: string) => {
    onChange({
      ...blockStyle,
      paidContentPrice: parseFloat(value) || 0,
    });
  };

  return (
    <div className="rounded-2xl border border-border/30 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/20">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">{t('paidContent.title', 'Платный контент')}</span>
          <Badge variant="secondary" className="gap-1 text-xs h-5 rounded-full bg-amber-500/10 text-amber-600 border-0">
            <Coins className="h-3 w-3" />
            Linkkon
          </Badge>
        </div>
        <Switch
          checked={isPaidContent}
          onCheckedChange={handleToggle}
        />
      </div>

      <div className="p-4 space-y-3">
        <p className="text-xs text-muted-foreground">
          {t('paidContent.settingsDescription', 'Ограничьте доступ к контенту блока. Посетители смогут разблокировать его за Linkkon токены (1 токен = 1 ₸).')}
        </p>

        {isPaidContent && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground font-medium">{t('paidContent.priceLabel', 'Цена (в Linkkon токенах)')}</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder={t('paidContent.pricePlaceholder', '100')}
                min={1}
                className="flex-1 h-10 rounded-xl bg-muted/30 border-border/30"
              />
              <Badge variant="outline" className="shrink-0 h-8 rounded-lg">
                = {price || 0} ₸
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {t('paidContent.priceHint', 'Минимум: 1 токен. Рекомендуется: 50-500 токенов.')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
