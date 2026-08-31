import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RevenueKitStepProps } from './types';

export function IdentityStep({ draft, onChange }: RevenueKitStepProps) {
  const { t } = useTranslation();
  const updateIdentity = (field: keyof typeof draft.identity, value: string) => {
    onChange({ ...draft, identity: { ...draft.identity, [field]: value } });
  };

  return (
    <section className="space-y-5" aria-labelledby="revenue-kit-identity-title">
      <div>
        <h2 id="revenue-kit-identity-title" className="text-xl font-semibold">
          {t('revenueKit.identity.title', 'О вас и вашем бизнесе')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('revenueKit.identity.description', 'Эти данные появятся на готовой странице.')}
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="revenue-kit-display-name">{t('revenueKit.identity.name', 'Название бизнеса')}</Label>
        <Input
          id="revenue-kit-display-name"
          value={draft.identity.displayName}
          onChange={(event) => updateIdentity('displayName', event.target.value)}
          maxLength={120}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="revenue-kit-city">{t('revenueKit.identity.city', 'Город')}</Label>
          <Input
            id="revenue-kit-city"
            value={draft.identity.city}
            onChange={(event) => updateIdentity('city', event.target.value)}
            maxLength={100}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="revenue-kit-specialization">
            {t('revenueKit.identity.specialization', 'Специализация')}
          </Label>
          <Input
            id="revenue-kit-specialization"
            value={draft.identity.specialization}
            onChange={(event) => updateIdentity('specialization', event.target.value)}
            maxLength={100}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="revenue-kit-contact">
          {t('revenueKit.identity.contact', 'WhatsApp или Telegram')}
        </Label>
        <Input
          id="revenue-kit-contact"
          value={draft.identity.contactValue}
          onChange={(event) => updateIdentity('contactValue', event.target.value)}
          placeholder="+7… / @username"
          maxLength={120}
        />
      </div>
    </section>
  );
}
