import { memo, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { Locale } from 'date-fns';
import { useZoneEvents, useZoneEventRegistrations, ZoneEvent } from '@/hooks/zones/useZoneEvents';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils/utils';
import { format } from 'date-fns';
import { ru, enUS, kk } from 'date-fns/locale';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import Users from 'lucide-react/dist/esm/icons/users';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import DollarSign from 'lucide-react/dist/esm/icons/dollar-sign';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Ticket from 'lucide-react/dist/esm/icons/ticket';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';

interface Props {
  zoneId: string;
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  closed: 'bg-destructive/20 text-destructive',
};

function getLocaleText(json: Record<string, string> | null | undefined, lang: string): string {
  if (!json) return '';
  return json[lang] || json['ru'] || json['en'] || Object.values(json)[0] || '';
}

function getDateLocale(lang: string) {
  if (lang === 'ru') return ru;
  if (lang === 'kk') return kk;
  return enUS;
}

export const ZoneEventsScreen = memo(function ZoneEventsScreen({ zoneId }: Props) {
  const { t, i18n } = useTranslation();
  const { events, loading } = useZoneEvents(zoneId);
  const [selectedEvent, setSelectedEvent] = useState<ZoneEvent | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const locale = getDateLocale(i18n.language);

  const filteredEvents = useMemo(() => {
    if (filterStatus === 'all') return events;
    return events.filter(e => e.status === filterStatus);
  }, [events, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const totalRegs = events.reduce((s, e) => s + (e.registrations_count || 0), 0);
    const totalRevenue = events
      .filter(e => e.is_paid)
      .reduce((s, e) => s + (e.price_amount || 0) * (e.registrations_count || 0), 0);
    return {
      total: events.length,
      published: events.filter(e => e.status === 'published').length,
      totalRegs,
      totalRevenue,
    };
  }, [events]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">{t('zones.events.title', 'Мероприятия')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('zones.events.subtitle', 'Управление ивентами из блоков Event ваших страниц')}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-primary" />
            <div>
              <div className="text-lg font-bold">{stats.total}</div>
              <div className="text-[10px] text-muted-foreground">{t('zones.events.totalEvents', 'Всего')}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Eye className="h-5 w-5 text-primary/70" />
            <div>
              <div className="text-lg font-bold">{stats.published}</div>
              <div className="text-[10px] text-muted-foreground">{t('zones.events.published', 'Активных')}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <Ticket className="h-5 w-5 text-primary/60" />
            <div>
              <div className="text-lg font-bold">{stats.totalRegs}</div>
              <div className="text-[10px] text-muted-foreground">{t('zones.events.totalRegistrations', 'Регистраций')}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-primary/50" />
            <div>
              <div className="text-lg font-bold">{stats.totalRevenue > 0 ? stats.totalRevenue.toLocaleString() : '—'}</div>
              <div className="text-[10px] text-muted-foreground">{t('zones.events.revenue', 'Выручка')}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Tabs value={filterStatus} onValueChange={setFilterStatus}>
        <TabsList>
          <TabsTrigger value="all">{t('common.all', 'Все')} ({events.length})</TabsTrigger>
          <TabsTrigger value="published">{t('zones.events.published', 'Активные')}</TabsTrigger>
          <TabsTrigger value="draft">{t('zones.events.draft', 'Черновики')}</TabsTrigger>
          <TabsTrigger value="closed">{t('zones.events.closed', 'Завершённые')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <CalendarDays className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>{t('zones.events.empty', 'Нет мероприятий. Добавьте блок Event на страницу, привязанную к зоне.')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              lang={i18n.language}
              locale={locale}
              t={t}
              onSelect={() => setSelectedEvent(event)}
            />
          ))}
        </div>
      )}

      {/* Event Detail Sheet */}
      <Sheet open={!!selectedEvent} onOpenChange={open => !open && setSelectedEvent(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {selectedEvent && getLocaleText(selectedEvent.title_i18n_json, i18n.language)}
            </SheetTitle>
          </SheetHeader>
          {selectedEvent && (
            <EventDetail event={selectedEvent} lang={i18n.language} locale={locale} t={t} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
});

// ============ Event Card ============
function EventCard({ event, lang, locale, t, onSelect }: {
  event: ZoneEvent; lang: string; locale: Locale; t: any; onSelect: () => void;
}) {
  const title = getLocaleText(event.title_i18n_json, lang);

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onSelect}
    >
      <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
        {event.cover_url && (
          <img
            src={event.cover_url}
            alt={title}
            className="w-full sm:w-24 h-20 object-cover rounded-md"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold truncate">{title || t('common.untitled', 'Без названия')}</h3>
            <Badge className={cn('shrink-0 text-[10px]', STATUS_BADGE[event.status] || 'bg-muted')}>
              {t(`zones.events.status.${event.status}`, event.status)}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
            {event.start_at && (
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {format(new Date(event.start_at), 'dd MMM yyyy, HH:mm', { locale })}
              </span>
            )}
            {event.location_value && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {event.location_value}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {event.registrations_count || 0}
              {event.capacity ? `/${event.capacity}` : ''}
            </span>
            {event.is_paid && event.price_amount && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {event.price_amount} {event.currency || 'KZT'}
              </span>
            )}
          </div>
          {event.page_title && (
            <div className="text-[10px] text-muted-foreground mt-1.5">
              {t('zones.calendar.fromPage', 'Со страницы')}: {event.page_title}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============ Event Detail ============
function EventDetail({ event, lang, locale, t }: {
  event: ZoneEvent; lang: string; locale: Locale; t: any;
}) {
  const { registrations, loading } = useZoneEventRegistrations(event.id);

  return (
    <div className="mt-4 space-y-4">
      {/* Info */}
      <div className="space-y-2 text-sm">
        {event.start_at && (
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(event.start_at), 'dd MMMM yyyy, HH:mm', { locale })}</span>
            {event.end_at && <span>— {format(new Date(event.end_at), 'HH:mm', { locale })}</span>}
          </div>
        )}
        {event.location_value && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{event.location_value}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>
            {event.registrations_count || 0} {t('zones.events.registered', 'зарегистрировано')}
            {event.capacity ? ` / ${event.capacity} ${t('zones.events.maxCapacity', 'макс.')}` : ''}
          </span>
        </div>
        {event.is_paid && (
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span>{event.price_amount} {event.currency || 'KZT'}</span>
          </div>
        )}
      </div>

      {/* Registrations */}
      <div>
        <h4 className="font-medium mb-2">{t('zones.events.registrations', 'Регистрации')}</h4>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : registrations.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('zones.events.noRegistrations', 'Пока нет регистраций')}</p>
        ) : (
          <ScrollArea className="max-h-[300px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{t('common.name', 'Имя')}</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">{t('common.status', 'Статус')}</TableHead>
                  <TableHead className="text-xs">{t('common.date', 'Дата')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs font-medium">{r.attendee_name}</TableCell>
                    <TableCell className="text-xs">{r.attendee_email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {t(`zones.events.regStatus.${r.status}`, r.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(r.created_at), 'dd.MM.yy', { locale })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
