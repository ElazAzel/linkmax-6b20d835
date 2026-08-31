import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import type { PublicBookingService } from './public-booking-machine';

interface ServiceSelectionStepProps {
  services: PublicBookingService[];
  onSelect: (service: PublicBookingService) => void;
}

export function ServiceSelectionStep({ services, onSelect }: ServiceSelectionStepProps) {
  const { t } = useTranslation();

  return (
    <section className="space-y-4" aria-labelledby="public-booking-service-title">
      <div>
        <h3 id="public-booking-service-title" className="text-xl font-semibold">
          {t('publicBooking.service.title', 'Выберите услугу')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('publicBooking.service.description', 'Цена и длительность будут зафиксированы в записи.')}
        </p>
      </div>
      <div className="grid gap-3">
        {services.map((service) => (
          <Button
            key={service.id}
            type="button"
            variant="outline"
            className="h-auto justify-between gap-4 rounded-xl p-4 text-left"
            onClick={() => onSelect(service)}
          >
            <span>
              <span className="block font-semibold">{service.name}</span>
              <span className="block text-xs text-muted-foreground">
                {service.durationMinutes} {t('publicBooking.minutes', 'мин')}
              </span>
            </span>
            <span className="whitespace-nowrap font-semibold">
              {Number(service.priceAmount).toLocaleString()} {service.currency === 'KZT' ? '₸' : service.currency}
            </span>
          </Button>
        ))}
      </div>
    </section>
  );
}
