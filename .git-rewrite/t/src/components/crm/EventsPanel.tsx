/**
 * EventsPanel - CRM tab for managing events and registrations
 * Features: Event list, registration management, QR scanner access, Excel/CSV export
 */
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  CalendarDays,
  Users,
  QrCode,
  Download,
  RefreshCw,
  Search,
  ChevronRight,
  Clock,
  MapPin,
  Loader2,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, isPast } from 'date-fns';
import { ru, kk, enUS } from 'date-fns/locale';
import { getTranslatedString, type SupportedLanguage } from '@/lib/i18n-helpers';
import { EventRegistrationsList } from './EventRegistrationsList';
import { exportToExcel, exportToCSV } from '@/lib/excel-export';
import type { EventFormField } from '@/types/page';

interface Event {
  id: string;
  title_i18n_json: unknown;
  description_i18n_json: unknown;
  cover_url: string | null;
  start_at: string | null;
  end_at: string | null;
  capacity: number | null;
  status: string;
  is_paid: boolean;
  price_amount: number | null;
  currency: string | null;
  location_value: string | null;
  created_at: string;
  registration_count?: number;
  form_schema_json?: unknown;
}

interface EventsPanelProps {
  isPremium: boolean;
}

export function EventsPanel({ isPremium }: EventsPanelProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'closed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const language = i18n.language as SupportedLanguage;
  const locale = i18n.language === 'ru' ? ru : i18n.language === 'kk' ? kk : enUS;

  const fetchEvents = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      // Fetch registration counts
      const eventIds = (eventsData || []).map(e => e.id);
      if (eventIds.length > 0) {
        const { data: regCounts } = await supabase
          .from('event_registrations')
          .select('event_id')
          .in('event_id', eventIds)
          .in('status', ['confirmed', 'pending']);

        const countMap: Record<string, number> = {};
        (regCounts || []).forEach(r => {
          countMap[r.event_id] = (countMap[r.event_id] || 0) + 1;
        });

        const eventsWithCounts = (eventsData || []).map(event => ({
          ...event,
          registration_count: countMap[event.id] || 0,
        })) as Event[];
        setEvents(eventsWithCounts);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error(t('events.fetchError', 'Не удалось загрузить события'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
      const titleJson = (event.title_i18n_json || {}) as Record<string, string>;
      const title = getTranslatedString(titleJson, language);
      const matchesSearch = !searchQuery ||
        title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [events, statusFilter, searchQuery, language]);

  const stats = useMemo(() => ({
    total: events.length,
    published: events.filter(e => e.status === 'published').length,
    draft: events.filter(e => e.status === 'draft').length,
    totalRegistrations: events.reduce((sum, e) => sum + (e.registration_count || 0), 0),
  }), [events]);

  const handleExport = async (eventId: string, formatType: 'xlsx' | 'csv' = 'csv') => {
    try {
      // Fetch event details for form fields
      const event = events.find(e => e.id === eventId);
      const eventTitle = event 
        ? getTranslatedString((event.title_i18n_json || {}) as Record<string, string>, language) 
        : 'Event';
      const formFields = (event?.form_schema_json as EventFormField[]) || [];

      // Fetch registrations
      const { data: registrations, error } = await supabase
        .from('event_registrations')
        .select('id, attendee_name, attendee_email, attendee_phone, answers_json, status, payment_status, created_at, event_tickets(ticket_code, status, checked_in_at)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!registrations || registrations.length === 0) {
        toast.error(t('events.noRegistrations', 'Нет регистраций для экспорта'));
        return;
      }

      // Transform data for export
      const transformedRegistrations = (registrations as unknown as Array<{
        id: string;
        attendee_name: string;
        attendee_email: string;
        attendee_phone: string | null;
        answers_json: Record<string, unknown> | null;
        status: string;
        payment_status: string;
        created_at: string;
        event_tickets: Array<{
          ticket_code: string;
          status: string;
          checked_in_at: string | null;
        }> | null;
      }>);

      const exportData = {
        eventTitle,
        registrations: transformedRegistrations,
        formFields,
        language,
        includeAnswers: true,
      };

      if (formatType === 'xlsx' && isPremium) {
        exportToExcel(exportData);
        toast.success(t('events.exportSuccess', 'Экспорт в Excel завершен'));
      } else {
        exportToCSV(exportData);
        toast.success(t('events.exportSuccess', 'Экспорт в CSV завершен'));
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('events.exportError', 'Ошибка экспорта'));
    }
  };

  const openScanner = (eventId: string) => {
    if (!isPremium) {
      toast.error(t('events.scannerProOnly', 'QR-сканер доступен в Pro'));
      return;
    }
    navigate(`/dashboard/events/${eventId}/scanner`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">{t('events.published', 'Опубликован')}</Badge>;
      case 'draft':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">{t('events.draft', 'Черновик')}</Badge>;
      case 'closed':
        return <Badge className="bg-gray-500/20 text-gray-500 border-gray-500/30">{t('events.closed', 'Закрыт')}</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If viewing a specific event's registrations
  if (selectedEventId) {
    const selectedEvent = events.find(e => e.id === selectedEventId);
    const selectedTitle = selectedEvent 
      ? getTranslatedString((selectedEvent.title_i18n_json || {}) as Record<string, string>, language) 
      : '';
    return (
      <EventRegistrationsList
        eventId={selectedEventId}
        eventTitle={selectedTitle}
        isPremium={isPremium}
        onBack={() => setSelectedEventId(null)}
        onExport={() => handleExport(selectedEventId, 'csv')}
        onOpenScanner={() => openScanner(selectedEventId)}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 p-3 border-b">
        <div className="text-center p-2 rounded-lg bg-primary/10">
          <div className="text-lg font-bold text-primary">{stats.total}</div>
          <div className="text-[10px] text-muted-foreground">{t('events.total', 'Всего')}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-green-500/10">
          <div className="text-lg font-bold text-green-500">{stats.published}</div>
          <div className="text-[10px] text-muted-foreground">{t('events.active', 'Активных')}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-yellow-500/10">
          <div className="text-lg font-bold text-yellow-500">{stats.draft}</div>
          <div className="text-[10px] text-muted-foreground">{t('events.drafts', 'Черновики')}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-blue-500/10">
          <div className="text-lg font-bold text-blue-500">{stats.totalRegistrations}</div>
          <div className="text-[10px] text-muted-foreground">{t('events.registrations', 'Заявок')}</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mx-0 rounded-none border-b bg-transparent h-10">
          <TabsTrigger value="all" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs">
            {t('events.all', 'Все')}
          </TabsTrigger>
          <TabsTrigger value="published" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs">
            {t('events.published', 'Активные')}
          </TabsTrigger>
          <TabsTrigger value="draft" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs">
            {t('events.draft', 'Черновики')}
          </TabsTrigger>
          <TabsTrigger value="closed" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary text-xs">
            {t('events.closed', 'Закрытые')}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('events.searchPlaceholder', 'Поиск по названию...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-10 rounded-lg bg-muted/50 border-0"
          />
        </div>
      </div>

      {/* Events List */}
      <ScrollArea className="flex-1">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm mb-4">{t('events.noEvents', 'У вас пока нет событий')}</p>
            <p className="text-xs text-muted-foreground">
              {t('events.createHint', 'Создайте событие через редактор страницы')}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredEvents.map((event) => {
              const titleJson = (event.title_i18n_json || {}) as Record<string, string>;
              const title = getTranslatedString(titleJson, language);
              const isEventPast = event.end_at ? isPast(new Date(event.end_at)) : false;
              
              return (
                <Card
                  key={event.id}
                  className="m-3 p-3 border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedEventId(event.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Cover */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                      {event.cover_url ? (
                        <img src={event.cover_url} alt={title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                          <CalendarDays className="h-6 w-6 text-primary/50" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm truncate">{title}</h3>
                        {getStatusBadge(event.status)}
                      </div>

                      <div className="space-y-1 text-xs text-muted-foreground">
                        {event.start_at && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(event.start_at), 'd MMM yyyy, HH:mm', { locale })}
                            {isEventPast && (
                              <Badge variant="outline" className="ml-1 text-[10px] h-4">
                                {t('events.past', 'Прошел')}
                              </Badge>
                            )}
                          </div>
                        )}
                        {event.location_value && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{event.location_value}</span>
                          </div>
                        )}
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs">
                          <Users className="h-3 w-3 text-primary" />
                          <span className="font-medium">{event.registration_count || 0}</span>
                          {event.capacity && (
                            <span className="text-muted-foreground">/ {event.capacity}</span>
                          )}
                        </div>
                        {event.is_paid && event.price_amount && (
                          <Badge variant="secondary" className="text-[10px] h-5">
                            {event.price_amount} {event.currency || 'KZT'}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Actions Row */}
      <div className="p-3 border-t flex gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={fetchEvents}>
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('events.refresh', 'Обновить')}
        </Button>
      </div>
    </div>
  );
}
