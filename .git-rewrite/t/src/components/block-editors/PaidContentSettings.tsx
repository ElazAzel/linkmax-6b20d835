import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Lock, Coins } from 'lucide-react';
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
      paidContentCurrency: 'KZT', // Always tokens (1 token = 1 KZT)
    });
  };

  const handlePriceChange = (value: string) => {
    onChange({
      ...blockStyle,
      paidContentPrice: parseFloat(value) || 0,
    });
  };

  return (
    <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-primary" />
          <Label className="text-base font-semibold">{t('paidContent.title', 'Платный контент')}</Label>
          <Badge variant="secondary" className="gap-1 text-xs bg-amber-500/10 text-amber-600">
            <Coins className="h-3 w-3" />
            Linkkon
          </Badge>
        </div>
        <Switch
          checked={isPaidContent}
          onCheckedChange={handleToggle}
        />
      </div>

      <Alert className="bg-primary/5 border-primary/20">
        <Coins className="h-4 w-4 text-primary" />
        <AlertDescription className="text-sm">
          {t('paidContent.settingsDescription', 'Ограничьте доступ к контенту блока. Посетители смогут разблокировать его за Linkkon токены (1 токен = 1 ₸).')}
        </AlertDescription>
      </Alert>

      {isPaidContent && (
        <div className="space-y-3">
          <div>
            <Label>{t('paidContent.priceLabel', 'Цена (в Linkkon токенах)')}</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="number"
                value={price}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder={t('paidContent.pricePlaceholder', '100')}
                min={1}
                className="flex-1"
              />
              <Badge variant="outline" className="shrink-0">
                = {price || 0} ₸
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('paidContent.priceHint', 'Минимум: 1 токен. Рекомендуется: 50-500 токенов.')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
