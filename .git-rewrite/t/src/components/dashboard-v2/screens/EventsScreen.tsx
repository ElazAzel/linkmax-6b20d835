/**
 * EventsScreen - Events management dashboard
 * Shows all user events with stats, registrations access, and quick actions
 */
import { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ru, kk, enUS } from 'date-fns/locale';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Calendar,
  Users,
  QrCode,
  Download,
  MapPin,
  Clock,
  Search,
  Plus,
  ExternalLink,
  ChevronRight,
  CalendarDays,
  UserCheck,
  Crown,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { openPremiumPurchase } from '@/lib/upgrade-utils';
import { cn } from '@/lib/utils';

interface EventData {
  id: string;
  blockId: string;
  pageId: string;
  pageSlug: string;
  title: string;
  startAt: string | null;
  endAt: string | null;
  locationType: string;
  locationValue: string | null;
  status: string;
  capacity: number | null;
  isPaid: boolean;
  price: number | null;
  currency: string | null;
  totalRegistrations: number;
  checkedIn: number;
  pendingApproval: number;
}

interface EventsScreenProps {
  className?: string;
}

export const EventsScreen = memo(function EventsScreen({ className }: EventsScreenProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPremium, isLoading: premiumLoading } = usePremiumStatus();
  
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const locale = i18n.language === 'ru' ? ru : i18n.language === 'kk' ? kk : enUS;

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      try {
        // Fetch events with page info
        const { data: eventsData, error } = await supabase
          .from('events')
          .select(`
            id,
            block_id,
            page_id,
            title_i18n_json,
            start_at,
            end_at,
            location_type,
            location_value,
            status,
            capacity,
            is_paid,
            price_amount,
            currency,
            pages!inner(slug)
          `)
          .eq('owner_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Get registration counts for each event
        const eventsWithStats: EventData[] = await Promise.all(
          (eventsData || []).map(async (event) => {
            const { data: regs } = await supabase
              .from('event_registrations')
              .select('id, status, event_tickets(status)')
              .eq('event_id', event.id);

            const total = regs?.filter(r => r.status !== 'cancelled').length || 0;
            const checkedIn = regs?.filter(r => 
              r.event_tickets?.some((t: { status: string }) => t.status === 'used')
            ).length || 0;
            const pending = regs?.filter(r => r.status === 'pending').length || 0;

            return {
              id: event.id,
              blockId: event.block_id,
              pageId: event.page_id,
              pageSlug: (event.pages as { slug: string })?.slug || '',
              title: (event.title_i18n_json as Record<string, string>)?.[i18n.language] || 
                     (event.title_i18n_json as Record<string, string>)?.ru || 
                     t('events.untitled', 'Без названия'),
              startAt: event.start_at,
              endAt: event.end_at,
              locationType: event.location_type || 'online',
              locationValue: event.location_value,
              status: event.status || 'draft',
              capacity: event.capacity,
              isPaid: event.is_paid || false,
              price: event.price_amount,
              currency: event.currency,
              totalRegistrations: total,
              checkedIn,
              pendingApproval: pending,
            };
          })
        );

        setEvents(eventsWithStats);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error(t('events.fetchError', 'Ошибка загрузки событий'));
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user, i18n.language, t]);

  // Filter events by search
  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group events by status
  const upcomingEvents = filteredEvents.filter(e => 
    e.status === 'published' && (!e.startAt || new Date(e.startAt) >= new Date())
  );
  const pastEvents = filteredEvents.filter(e => 
    e.startAt && new Date(e.startAt) < new Date()
  );
  const draftEvents = filteredEvents.filter(e => e.status === 'draft');

  const handleOpenScanner = (eventId: string) => {
    if (!isPremium) {
      openPremiumPurchase();
      return;
    }
    navigate(`/dashboard/events/${eventId}/scanner`);
  };

  const handleExportRegistrations = async (eventId: string, eventTitle: string) => {
    if (!isPremium) {
      openPremiumPurchase();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('attendee_name, attendee_email, attendee_phone, status, created_at, answers_json')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get tickets separately
      const { data: ticketsData } = await supabase
        .from('event_tickets')
        .select('registration_id, ticket_code, status, checked_in_at')
        .in('registration_id', (data || []).map(r => r.attendee_email)); // We'll match by registration later

      // Create CSV
      const headers = ['Имя', 'Email', 'Телефон', 'Статус', 'Дата регистрации'];
      const rows = (data || []).map(r => [
        r.attendee_name,
        r.attendee_email,
        r.attendee_phone || '',
        r.status,
        format(new Date(r.created_at), 'dd.MM.yyyy HH:mm'),
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${eventTitle.replace(/\s+/g, '_')}_registrations.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(t('events.exportSuccess', 'Экспорт завершён'));
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('events.exportError', 'Ошибка экспорта'));
    }
  };

  const renderEventCard = (event: EventData) => {
    const isUpcoming = event.startAt && new Date(event.startAt) > new Date();
    const statusColors: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      published: 'bg-emerald-500/10 text-emerald-600',
      closed: 'bg-red-500/10 text-red-600',
    };

    return (
      <Card 
        key={event.id}
        className="p-4 hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/dashboard/events/${event.id}`)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{event.title}</h3>
              <Badge className={cn('text-[10px]', statusColors[event.status])}>
                {t(`events.status.${event.status}`, event.status)}
              </Badge>
              {event.isPaid && (
                <Badge variant="outline" className="text-[10px]">
                  {event.price} {event.currency}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
              {event.startAt && (
                <span className="flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {format(new Date(event.startAt), 'd MMM yyyy, HH:mm', { locale })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {event.locationType === 'online' 
                  ? t('events.online', 'Онлайн')
                  : t('events.offline', 'Офлайн')}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm">
                <Users className="h-4 w-4 text-primary" />
                <span className="font-medium">{event.totalRegistrations}</span>
                {event.capacity && (
                  <span className="text-muted-foreground">/ {event.capacity}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <UserCheck className="h-4 w-4 text-emerald-500" />
                <span>{event.checkedIn}</span>
              </div>
              {event.pendingApproval > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {event.pendingApproval} {t('events.pending', 'ожидают')}
                </Badge>
              )}
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenScanner(event.id);
            }}
          >
            <QrCode className="h-3.5 w-3.5" />
            {t('events.scanner', 'Сканер')}
            {!isPremium && <Crown className="h-3 w-3 text-amber-500" />}
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 text-xs gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              handleExportRegistrations(event.id, event.title);
            }}
          >
            <Download className="h-3.5 w-3.5" />
            {t('events.export', 'Экспорт')}
            {!isPremium && <Crown className="h-3 w-3 text-amber-500" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 text-xs gap-1.5 ml-auto"
            onClick={(e) => {
              e.stopPropagation();
              window.open(`https://lnkmx.my/${event.pageSlug}`, '_blank');
            }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
    );
  };

  if (loading || premiumLoading) {
    return (
      <div className={cn('p-4 space-y-4', className)}>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen safe-area-top', className)}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/10">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h1 className="text-lg font-bold">
                {t('events.title', 'События')}
              </h1>
              <p className="text-xs text-muted-foreground">
                {events.length} {t('events.eventsCount', 'событий')}
              </p>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('events.search', 'Поиск событий...')}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {events.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold mb-2">
                {t('events.noEvents', 'Нет событий')}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('events.noEventsDesc', 'Добавьте блок "Событие" на свою страницу, чтобы начать собирать регистрации')}
              </p>
              <Button onClick={() => navigate('/dashboard/home?tab=editor')}>
                <Plus className="h-4 w-4 mr-2" />
                {t('events.addEventBlock', 'Добавить блок')}
              </Button>
            </Card>
          ) : filteredEvents.length === 0 ? (
            <Card className="p-6 text-center">
              <Search className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t('events.noSearchResults', 'Ничего не найдено')}
              </p>
            </Card>
          ) : (
            <>
              {/* Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t('events.upcoming', 'Предстоящие')}
                    <Badge variant="secondary" className="ml-auto">{upcomingEvents.length}</Badge>
                  </h2>
                  <div className="space-y-3">
                    {upcomingEvents.map(renderEventCard)}
                  </div>
                </section>
              )}

              {/* Draft Events */}
              {draftEvents.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    {t('events.drafts', 'Черновики')}
                    <Badge variant="outline" className="ml-auto">{draftEvents.length}</Badge>
                  </h2>
                  <div className="space-y-3">
                    {draftEvents.map(renderEventCard)}
                  </div>
                </section>
              )}

              {/* Past Events */}
              {pastEvents.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    {t('events.past', 'Прошедшие')}
                    <Badge variant="outline" className="ml-auto">{pastEvents.length}</Badge>
                  </h2>
                  <div className="space-y-3">
                    {pastEvents.map(renderEventCard)}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
});
