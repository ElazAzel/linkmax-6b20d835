import { useTranslation } from 'react-i18next';

import type { RevenueKitStepProps } from './types';

export function TrustPreviewStep({ draft, onChange }: RevenueKitStepProps) {
  const { t } = useTranslation();
  const activeServices = draft.services.filter((service) => service.active);

  return (
    <section className="space-y-5" aria-labelledby="revenue-kit-preview-title">
      <div>
        <h2 id="revenue-kit-preview-title" className="text-xl font-semibold">
          {t('revenueKit.preview.title', 'Доверие и предпросмотр')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('revenueKit.preview.description', 'Так основная запись выглядит на экране шириной 360 px.')}
        </p>
      </div>
      <div className="mx-auto w-full max-w-[360px] rounded-[28px] border-4 border-foreground/10 bg-background p-5 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{draft.identity.city}</p>
        <h3 className="mt-1 text-2xl font-bold">{draft.identity.displayName}</h3>
        <div className="mt-5 space-y-3">
          {activeServices.slice(0, 3).map((service) => (
            <div key={service.presetId} className="flex justify-between gap-3 rounded-xl border p-3 text-sm">
              <span>{service.name.ru}</span>
              <strong>{Number(service.priceAmount).toLocaleString('ru-RU')} ₸</strong>
            </div>
          ))}
        </div>
      </div>
      <label className="flex items-start gap-3 rounded-xl border p-4 text-sm">
        <input
          type="checkbox"
          checked={draft.trust.policyAccepted}
          onChange={(event) => onChange({
            ...draft,
            trust: { ...draft.trust, policyAccepted: event.target.checked },
          })}
        />
        {t('revenueKit.preview.policy', 'Я проверил(а) цены, расписание и условия отмены.')}
      </label>
    </section>
  );
}
