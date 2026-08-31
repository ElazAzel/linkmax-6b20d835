import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { DepositConfiguration } from '@/domain/revenue/service-offering';
import type { RevenueKitStepProps } from './types';

const DEPOSIT_FIELD_IDS = {
  mode: 'revenue-kit-deposit-mode',
  value: 'revenue-kit-deposit-value',
  instructions: 'revenue-kit-payment-instructions',
} as const;
const DEPOSIT_MODES = {
  none: 'none',
  fixed: 'fixed',
  percent: 'percent',
} as const;
const DECIMAL_INPUT_MODE = 'decimal';

export function DepositPolicyStep({ draft, onChange }: RevenueKitStepProps) {
  const { t } = useTranslation();
  const updateDeposit = (deposit: DepositConfiguration) => {
    onChange({ ...draft, depositPolicy: { ...draft.depositPolicy, deposit } });
  };

  return (
    <section className="space-y-5" aria-labelledby="revenue-kit-deposit-title">
      <div>
        <h2 id="revenue-kit-deposit-title" className="text-xl font-semibold">
          {t('revenueKit.deposit.title', 'Предоплата и отмена')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('revenueKit.deposit.description', 'Клиент увидит честный статус ожидания до подтверждения оплаты.')}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={DEPOSIT_FIELD_IDS.mode}>{t('revenueKit.deposit.mode', 'Размер предоплаты')}</Label>
        <select
          id={DEPOSIT_FIELD_IDS.mode}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          value={draft.depositPolicy.deposit.mode}
          onChange={(event) => {
            const mode = event.target.value as DepositConfiguration['mode'];
            updateDeposit({ mode, value: mode === 'none' ? '0.00' : draft.depositPolicy.deposit.value });
          }}
        >
          <option value={DEPOSIT_MODES.none}>{t('revenueKit.deposit.none', 'Без предоплаты')}</option>
          <option value={DEPOSIT_MODES.fixed}>{t('revenueKit.deposit.fixed', 'Фиксированная сумма')}</option>
          <option value={DEPOSIT_MODES.percent}>{t('revenueKit.deposit.percent', 'Процент')}</option>
        </select>
      </div>
      {draft.depositPolicy.deposit.mode !== 'none' && (
        <>
          <div className="space-y-2">
            <Label htmlFor={DEPOSIT_FIELD_IDS.value}>{t('revenueKit.deposit.value', 'Сумма или процент')}</Label>
            <Input
              id={DEPOSIT_FIELD_IDS.value}
              inputMode={DECIMAL_INPUT_MODE}
              value={draft.depositPolicy.deposit.value}
              onChange={(event) => updateDeposit({
                mode: draft.depositPolicy.deposit.mode,
                value: event.target.value,
              })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={DEPOSIT_FIELD_IDS.instructions}>
              {t('revenueKit.deposit.instructions', 'Инструкция по оплате')}
            </Label>
            <Textarea
              id={DEPOSIT_FIELD_IDS.instructions}
              value={draft.depositPolicy.paymentInstructions.ru}
              onChange={(event) => onChange({
                ...draft,
                depositPolicy: {
                  ...draft.depositPolicy,
                  paymentInstructions: {
                    ...draft.depositPolicy.paymentInstructions,
                    ru: event.target.value,
                  },
                },
              })}
              maxLength={500}
            />
          </div>
        </>
      )}
    </section>
  );
}
