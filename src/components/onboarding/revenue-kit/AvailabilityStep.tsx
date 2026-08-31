import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RevenueKitStepProps } from './types';

const AVAILABILITY_FIELD_IDS = {
  start: 'revenue-kit-start-time',
  end: 'revenue-kit-end-time',
} as const;

export function AvailabilityStep({ draft, onChange }: RevenueKitStepProps) {
  const { t } = useTranslation();
  const updateAvailability = (patch: Partial<typeof draft.availability>) => {
    onChange({ ...draft, availability: { ...draft.availability, ...patch } });
  };

  return (
    <section className="space-y-5" aria-labelledby="revenue-kit-availability-title">
      <div>
        <h2 id="revenue-kit-availability-title" className="text-xl font-semibold">
          {t('revenueKit.availability.title', 'Доступное время')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('revenueKit.availability.timezone', 'Часовой пояс: Алматы (UTC+5)')}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={AVAILABILITY_FIELD_IDS.start}>{t('revenueKit.availability.start', 'Начало дня')}</Label>
          <Input
            id={AVAILABILITY_FIELD_IDS.start}
            type="time"
            value={draft.availability.startTime}
            onChange={(event) => updateAvailability({ startTime: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={AVAILABILITY_FIELD_IDS.end}>{t('revenueKit.availability.end', 'Конец дня')}</Label>
          <Input
            id={AVAILABILITY_FIELD_IDS.end}
            type="time"
            value={draft.availability.endTime}
            onChange={(event) => updateAvailability({ endTime: event.target.value })}
          />
        </div>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t('revenueKit.availability.days', 'Рабочие дни')}</legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 0].map((day) => {
            const checked = draft.availability.weekdays.includes(day);
            return (
              <label key={day} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => updateAvailability({
                    weekdays: checked
                      ? draft.availability.weekdays.filter((value) => value !== day)
                      : [...draft.availability.weekdays, day].sort(),
                  })}
                />
                {t(`revenueKit.availability.daysShort.${day}`)}
              </label>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}
