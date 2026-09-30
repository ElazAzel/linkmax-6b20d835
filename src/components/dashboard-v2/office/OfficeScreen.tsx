import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { formatInTimeZone } from 'date-fns-tz';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Contact from 'lucide-react/dist/esm/icons/contact';
import Download from 'lucide-react/dist/esm/icons/download';
import Plus from 'lucide-react/dist/esm/icons/plus';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/states';
import { DashboardHeader } from '../layout/DashboardHeader';
import { useDigitalOffice } from '@/hooks/revenue/useDigitalOffice';
import { bookingDay, buildOfficeClients, buildOfficeToday, getBookingInstant, type OfficeBooking, type OfficeClient } from '@/domain/office/workspace';
import { csvRow } from '@/lib/export/csv-safe';
import { OfficeBookingList } from './OfficeBookingList';
import { OfficeBookingDetail } from './OfficeBookingDetail';

export interface OfficeScreenProps {
  view: 'today' | 'clients' | 'calendar';
  onNavigate: (tabId: string) => void;
  pageSwitcher?: ReactNode;
}

function shiftDay(day: string, count: number): string {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

export function OfficeScreen({ view, onNavigate, pageSwitcher }: OfficeScreenProps) {
  const { t } = useTranslation();
  const query = useDigitalOffice();
  const bookings = query.data;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const [now, setNow] = useState(() => new Date());
  const [date, setDate] = useState(() => formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd'));
  const [search, setSearch] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<OfficeBooking | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const today = useMemo(() => buildOfficeToday(bookings ?? [], now, timezone), [bookings, now, timezone]);
  const clients = useMemo(() => buildOfficeClients(bookings ?? []), [bookings]);
  const selectedClient = clients.find((client) => client.id === clientId);
  const filteredClients = clients.filter((client) => [client.name, client.email ?? '', client.phone ?? '']
    .some((value) => value.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())));
  const dailyBookings = (bookings ?? []).filter((booking) => bookingDay(booking, timezone) === date)
    .sort((a, b) => getBookingInstant(a).getTime() - getBookingInstant(b).getTime());
  const exportClients = () => {
    try {
      const rows = [csvRow([t('bookingDetail.client', 'Клиент'), 'Email', t('auth.phone', 'Телефон'), t('digitalOffice.bookings', 'Записей'), t('digitalOffice.completed', 'Проведено встреч')]),
        ...clients.map((client) => csvRow([client.name, client.email, client.phone, client.bookings.length, client.completedCount]))];
      const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'linkmax-clients.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { toast.error(t('digitalOffice.exportFailed', 'Не удалось экспортировать клиентов')); }
  };
  const title = view === 'today' ? t('digitalOffice.today', 'Сегодня')
    : view === 'clients' ? t('digitalOffice.clients', 'Клиенты') : t('digitalOffice.calendar', 'Календарь');
  const list = (rows: OfficeBooking[]) => <OfficeBookingList bookings={rows} timezone={timezone} onOpen={setSelectedBooking} />;
  const clientCard = (client: OfficeClient) => <button key={client.id} type="button" onClick={() => setClientId(client.id)}
    className="flex min-h-16 w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
    <div className="min-w-0"><p className="truncate text-sm font-semibold">{client.name}</p>
      <p className="truncate text-sm text-muted-foreground">{client.email || client.phone}</p></div>
    <div className="shrink-0 text-right text-xs text-muted-foreground"><span className="font-num">{client.bookings.length}</span> {t('digitalOffice.bookings', 'Записей')}
      {client.pendingPaymentCount > 0 && <p className="text-warning"><span className="font-num">{client.pendingPaymentCount}</span> {t('digitalOffice.pending', 'Ожидают оплаты')}</p>}</div>
  </button>;

  return <div className="space-y-5 p-4 md:p-0" data-testid={`office-${view}`}>
    <DashboardHeader title={title} subtitle={t('digitalOffice.subtitle', 'Встречи, оплаты и клиенты со всех ваших страниц.')}
      pageSwitcher={view === 'today' ? pageSwitcher : undefined}
      actions={<>
        {view === 'clients' && clients.length > 0 && <Button variant="outline" size="icon" onClick={exportClients} aria-label={t('digitalOffice.export', 'Экспорт клиентов')}><Download className="h-4 w-4" aria-hidden="true" /></Button>}
        <Button variant="ghost" size="icon" onClick={() => { void query.refetch(); }} disabled={query.isFetching} aria-label={t('digitalOffice.refresh', 'Обновить')}><RefreshCw className="h-4 w-4" aria-hidden="true" /></Button>
        <Button onClick={() => onNavigate('offers')} aria-label={t('digitalOffice.offersAction', 'Добавить предложение')}><Plus className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">{t('digitalOffice.offersAction', 'Добавить предложение')}</span></Button>
      </>} hideLivePill bottomSlot={view === 'today' && pageSwitcher ? <div className="p-3 md:hidden">{pageSwitcher}</div> : undefined} />
    {query.isPending && <LoadingState variant="skeleton-cards" skeletonCount={3} />}
    {query.isError && <ErrorState variant="card"
      title={query.error.message === 'feature_unavailable' ? t('digitalOffice.unavailable', 'Работа с записями пока недоступна') : t('digitalOffice.loadError', 'Не удалось загрузить рабочее место')}
      description={query.error.message === 'feature_unavailable' ? t('digitalOffice.unavailableHint', 'Для этого рабочего места нужно обновить базу данных. Ваши страницы доступны в редакторе.') : t('digitalOffice.loadErrorHint', 'Проверьте подключение и повторите загрузку.')}
      onRetry={query.error.message === 'feature_unavailable' ? undefined : () => { void query.refetch(); }} />}
    {bookings && <>
      {view !== 'clients' && <p className="text-sm text-muted-foreground">{t('digitalOffice.timezone', 'Часовой пояс: {{timezone}}', { timezone })}</p>}
      {view === 'today' && <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label={t('digitalOffice.upcoming', 'Встречи сегодня')} value={today.today.length} compact />
          <StatCard label={t('digitalOffice.pending', 'Ожидают оплаты')} value={today.pendingPayments.length} compact />
          <StatCard label={t('digitalOffice.completion', 'Нужно завершить')} value={today.needsCompletion.length} compact />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="space-y-3"><h2 className="text-lg font-semibold">{t('digitalOffice.schedule', 'Расписание')}</h2>
            {today.today.length ? list(today.today) : <EmptyState variant="card" icon={Calendar} title={t('digitalOffice.noToday', 'Сегодня нет встреч')} description={t('digitalOffice.noTodayHint', 'Настройте услуги и поделитесь своей страницей с клиентами.')} action={{ label: t('digitalOffice.profileAction', 'Моя страница'), onClick: () => onNavigate('editor') }} />}
          </section>
          <section className="space-y-3"><h2 className="text-lg font-semibold">{t('digitalOffice.attention', 'Требуют внимания')}</h2>
            {today.pendingPayments.length + today.needsCompletion.length > 0
              ? list([...today.pendingPayments, ...today.needsCompletion])
              : <EmptyState variant="card" title={t('digitalOffice.noAttention', 'Все записи в порядке')} description={t('digitalOffice.noAttentionHint', 'Нет ожидаемых оплат и встреч, требующих завершения.')} />}
          </section>
        </div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => onNavigate('clients')}>{t('digitalOffice.allClients', 'Открыть клиентов')}</Button>
          <Button variant="outline" onClick={() => onNavigate('activity')}>{t('digitalOffice.openInbox', 'Входящие заявки')}</Button>
          <Button variant="outline" onClick={() => onNavigate('finance')}>{t('digitalOffice.openFinance', 'Оплаты и отчёты')}</Button></div>
      </>}
      {view === 'calendar' && <>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" aria-label={t('digitalOffice.previous', 'Предыдущий день')} onClick={() => setDate(shiftDay(date, -1))}><ChevronLeft className="h-4 w-4" aria-hidden="true" /></Button>
          <Input className="w-auto min-w-0 font-num" type="date" aria-label={t('digitalOffice.schedule', 'Расписание')} value={date} onChange={(event) => { if (/^\d{4}-\d{2}-\d{2}$/.test(event.target.value)) setDate(event.target.value); }} />
          <Button variant="outline" size="icon" aria-label={t('digitalOffice.next', 'Следующий день')} onClick={() => setDate(shiftDay(date, 1))}><ChevronRight className="h-4 w-4" aria-hidden="true" /></Button>
          <Button variant="secondary" onClick={() => setDate(formatInTimeZone(now, timezone, 'yyyy-MM-dd'))}>{t('digitalOffice.today', 'Сегодня')}</Button>
        </div>
        {dailyBookings.length ? list(dailyBookings) : <EmptyState variant="card" icon={Calendar} title={t('digitalOffice.noOnDay', 'На этот день нет встреч')} />}
      </>}
      {view === 'clients' && <>
        {selectedClient ? <>
          <Button variant="ghost" onClick={() => setClientId(null)}><ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />{t('digitalOffice.back', 'Все клиенты')}</Button>
          <Card><CardHeader><CardTitle>{selectedClient.name}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">
            {selectedClient.email && <a className="block break-all text-primary" href={`mailto:${selectedClient.email}`}>{selectedClient.email}</a>}
            {selectedClient.phone && <a className="block text-primary" href={`tel:${selectedClient.phone}`}>{selectedClient.phone}</a>}
            <p>{t('digitalOffice.completed', 'Проведено встреч')}: <span className="font-num">{selectedClient.completedCount}</span></p>
          </CardContent></Card>
          <h2 className="text-lg font-semibold">{t('digitalOffice.history', 'История встреч')}</h2>
          {list([...selectedClient.bookings].sort((a, b) => getBookingInstant(b).getTime() - getBookingInstant(a).getTime()))}
        </> : <>
          <Input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('digitalOffice.search', 'Найти по имени, телефону или почте')} aria-label={t('digitalOffice.search', 'Найти по имени, телефону или почте')} />
          {filteredClients.length ? <Card className="divide-y divide-border overflow-hidden">{filteredClients.map(clientCard)}</Card>
            : <EmptyState variant="card" icon={Contact} title={clients.length ? t('digitalOffice.noMatches', 'Клиенты не найдены') : t('digitalOffice.noClients', 'Клиенты появятся после первой записи')}
              description={clients.length ? t('digitalOffice.noMatchesHint', 'Попробуйте другое имя или контакт.') : t('digitalOffice.noClientsHint', 'Здесь будет история встреч со всех ваших страниц.')}
              action={clients.length ? undefined : { label: t('digitalOffice.offersAction', 'Добавить предложение'), onClick: () => onNavigate('offers') }} />}
        </>}
      </>}
      {view !== 'clients' && today.unscheduled.length > 0 && <ErrorState variant="card" title={t('digitalOffice.invalidTime', 'Проверьте время записи')} description={t('digitalOffice.invalidTimeHint', 'У некоторых записей не указан корректный часовой пояс. Их можно открыть в истории клиента.')} />}
    </>}
    <OfficeBookingDetail booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
  </div>;
}
