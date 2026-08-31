import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { PublicBookingContact } from './public-booking-machine';

interface ContactDetailsStepProps {
  contact: PublicBookingContact;
  error: string | null;
  submitting: boolean;
  onChange: (contact: PublicBookingContact) => void;
  onBack: () => void;
  onSubmit: () => void;
}

export function ContactDetailsStep({ contact, error, submitting, onChange, onBack, onSubmit }: ContactDetailsStepProps) {
  const { t } = useTranslation();
  const update = (patch: Partial<PublicBookingContact>) => onChange({ ...contact, ...patch });

  return (
    <section className="space-y-4" aria-labelledby="public-booking-contact-title">
      <div>
        <h3 id="public-booking-contact-title" className="text-xl font-semibold">
          {t('publicBooking.contact.title', 'Контактные данные')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('publicBooking.contact.description', 'Укажите имя и хотя бы один способ связи.')}
        </p>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <div className="space-y-2">
        <Label htmlFor="public-booking-name">{t('publicBooking.contact.name', 'Имя')}</Label>
        <Input id="public-booking-name" value={contact.name} onChange={(event) => update({ name: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="public-booking-phone">{t('publicBooking.contact.phone', 'Телефон')}</Label>
        <Input id="public-booking-phone" type="tel" value={contact.phone} onChange={(event) => update({ phone: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="public-booking-email">Email</Label>
        <Input id="public-booking-email" type="email" value={contact.email} onChange={(event) => update({ email: event.target.value })} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="public-booking-notes">{t('publicBooking.contact.notes', 'Комментарий (необязательно)')}</Label>
        <Textarea id="public-booking-notes" value={contact.notes} onChange={(event) => update({ notes: event.target.value })} />
      </div>
      <div className="flex justify-between gap-3 border-t pt-4">
        <Button type="button" variant="ghost" disabled={submitting} onClick={onBack}>{t('common.back', 'Назад')}</Button>
        <Button type="button" disabled={submitting} onClick={onSubmit}>
          {submitting ? t('publicBooking.contact.submitting', 'Создаём запись…') : t('publicBooking.contact.submit', 'Подтвердить запись')}
        </Button>
      </div>
    </section>
  );
}
