import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '../layout/DashboardHeader';
import { OfficeScreen } from '../office/OfficeScreen';

const destinations = [
  ['offers', 'digitalOffice.navigation.offers', 'Предложения'],
  ['clients', 'digitalOffice.navigation.clients', 'Клиенты'],
  ['calendar', 'digitalOffice.navigation.calendar', 'Календарь'],
  ['leads', 'dashboard.nav.leads', 'Заявки'],
  ['activity', 'dashboard.nav.activity', 'Входящие'],
  ['events', 'dashboard.nav.events', 'События'],
  ['monetize', 'dashboard.nav.monetize', 'Товары и монетизация'],
  ['finance', 'dashboard.nav.finance', 'Финансы'],
  ['team', 'dashboard.nav.team', 'Команда'],
  ['zone-dashboard', 'zones.nav.dashboard', 'Рабочее пространство'],
  ['zone-automations', 'zones.nav.automations', 'Автоматизация'],
];

export function BusinessScreen({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { t } = useTranslation();
  return <div className="space-y-5 p-4 md:p-0">
    <DashboardHeader title={t('pageV2.navigation.business', 'Бизнес')} />
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {destinations.map(([id, key, fallback]) => <Button key={id} variant="secondary" onClick={() => onNavigate(id)} className="h-auto min-h-16 justify-start whitespace-normal rounded-3xl px-4 py-4 text-left">{t(key, fallback)}</Button>)}
    </div>
    <OfficeScreen view="today" onNavigate={onNavigate} />
  </div>;
}
