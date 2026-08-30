import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { RevenueKitStepProps } from './types';

export function ServicesStep({ draft, onChange }: RevenueKitStepProps) {
  const { t } = useTranslation();
  const updateService = (index: number, patch: Partial<(typeof draft.services)[number]>) => {
    onChange({
      ...draft,
      services: draft.services.map((service, serviceIndex) => (
        serviceIndex === index ? { ...service, ...patch } : service
      )),
    });
  };

  return (
    <section className="space-y-4" aria-labelledby="revenue-kit-services-title">
      <div>
        <h2 id="revenue-kit-services-title" className="text-xl font-semibold">
          {t('revenueKit.services.title', 'Услуги')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('revenueKit.services.description', 'Цены и длительность можно изменить сейчас или позже.')}
        </p>
      </div>
      {draft.services.map((service, index) => (
        <article key={service.presetId} className="rounded-xl border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <strong>{service.name.ru}</strong>
            <Switch
              aria-label={t('revenueKit.services.active', 'Активная услуга')}
              checked={service.active}
              onCheckedChange={(active) => updateService(index, { active })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={`revenue-kit-price-${service.presetId}`}>
                {t('revenueKit.services.price', 'Цена, ₸')}
              </Label>
              <Input
                id={`revenue-kit-price-${service.presetId}`}
                inputMode="decimal"
                value={service.priceAmount}
                onChange={(event) => updateService(index, { priceAmount: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`revenue-kit-duration-${service.presetId}`}>
                {t('revenueKit.services.duration', 'Длительность, мин')}
              </Label>
              <Input
                id={`revenue-kit-duration-${service.presetId}`}
                type="number"
                min={5}
                max={720}
                value={service.durationMinutes}
                onChange={(event) => updateService(index, { durationMinutes: Number(event.target.value) })}
              />
            </div>
          </div>
        </article>
      ))}
    </section>
  );
}
