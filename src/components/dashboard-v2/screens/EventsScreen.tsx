'use client';

import { useNavigate } from 'react-router-dom';

/**
 * EventsScreen - Events management dashboard
 * Shows all user events with stats, registrations access, and quick actions
 */
import { memo, useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { ru, kk, enUS } from 'date-fns/locale';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/user/useAuth';
import { usePremiumStatus } from '@/hooks/user/usePremiumStatus';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, LoadingState } from '@/components/ui/states';
import { Input } from '@/components/ui/input';
import Users from 'lucide-react/dist/esm/icons/users';
import QrCode from 'lucide-react/dist/esm/icons/qr-code';
import Download from 'lucide-react/dist/esm/icons/download';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Search from 'lucide-react/dist/esm/icons/search';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import UserCheck from 'lucide-react/dist/esm/icons/user-check';
import Crown from 'lucide-react/dist/esm/icons/crown';
import { toast } from 'sonner';
import { openPremiumPurchase } from '@/lib/utils/upgrade-utils';
import { cn } from '@/lib/utils/utils';
import { getPublicPageUrl } from '@/lib/utils/url-helpers';
import { DashboardHeader } from '../layout/DashboardHeader';

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
  const [loadError, setLoadError] = useState(false);

  const locale = i18n.language === 'ru' ? ru : i18n.language === 'kk' ? kk : enUS;

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;

      setLoadError(false);
      try {
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
        setLoadError(true);
        toast.error(t('events.fetchError', 'Ошибка загрузки событий'));
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [user, i18n.language, t]);

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

      const headers = [t('events.csvName', 'Имя'), 'Email', t('events.csvPhone', 'Телефон'), t('events.csvStatus', 'Статус'), t('events.csvDate', 'Дата регистрации')];
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
    const statusColors: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      published: 'bg-emerald-500/10 text-emerald-600',
      closed: 'bg-red-500/10 text-red-600',
    };

    return (
      <Card
        key={event.id}
        className="p-5 glass border-white/10 hover:bg-white/5 transition-all cursor-pointer rounded-[2rem] active:scale-[0.98] shadow-glass"
        onClick={() => navigate(`/dashboard/events/${event.id}`)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-base font-bold truncate">{event.title}</h3>
              <Badge className={cn('text-[9px] font-black uppercase tracking-widest px-2 h-5 rounded-md border-none', statusColors[event.status])}>
                {t(`events.status.${event.status}`, event.status)}
              </Badge>
              {event.isPaid && (
                <Badge variant="outline" className="text-[9px] font-black border-white/10">
                  {event.price} {event.currency}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-4">
              {event.startAt && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {format(new Date(event.startAt), 'd MMM yyyy, HH:mm', { locale })}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {event.locationType === 'online'
                  ? t('events.online', 'Онлайн')
                  : t('events.offline', 'Офлайн')}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-primary/40" />
                <span className="font-bold">{event.totalRegistrations}</span>
                {event.capacity && (
                  <span className="text-muted-foreground opacity-30">/ {event.capacity}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <UserCheck className="h-4 w-4 text-emerald-500/40" />
                <span className="font-bold">{event.checkedIn}</span>
              </div>
              {event.pendingApproval > 0 && (
                <Badge variant="secondary" className="text-[9px] font-black bg-amber-500/10 text-amber-600 border-none">
                  {event.pendingApproval} {t('events.pending', 'ожидают')}
                </Badge>
              )}
            </div>
          </div>

          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/5 opacity-40">
            <ChevronRight className="h-5 w-5" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 mt-5 pt-5 border-t border-white/5">
          <Button
            variant="outline"
            size="sm"
            className="h-10 flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 glass border-white/10"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenScanner(event.id);
            }}
          >
            <QrCode className="h-4 w-4" />
            {t('events.scanner', 'Сканер')}
            {!isPremium && <Crown className="h-3 w-3 text-amber-500" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-10 flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest gap-2 glass border-white/10"
            onClick={(e) => {
              e.stopPropagation();
              handleExportRegistrations(event.id, event.title);
            }}
          >
            <Download className="h-4 w-4" />
            {t('events.export', 'Экспорт')}
            {!isPremium && <Crown className="h-3 w-3 text-amber-500" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-xl glass border-white/5 hover:bg-white/10"
            onClick={(e) => {
              e.stopPropagation();
              window.open(getPublicPageUrl(event.pageSlug), '_blank');
            }}
          >
            <ExternalLink className="h-4 w-4 opacity-40 hover:opacity-100 transition-opacity" />
          </Button>
        </div>
      </Card>
    );
  };

  if (loading || premiumLoading) {
    return (
      <LoadingState
        className={cn('p-4', className)}
        skeleton={(
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        )}
      />
    );
  }

  return (
    <div className={cn('min-h-screen safe-area-top', className)}>
      <DashboardHeader
        onMenuClick={() => {}}
        title={t('events.title', 'События')}
        subtitle={`${events.length} ${t('events.eventsCount', 'событий')}`}
      />

      <div className="sticky top-[80px] md:top-[96px] z-30 bg-background/95 backdrop-blur-xl border-b border-white/5">
        <div className="px-5 py-4">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('events.search', 'Поиск событий...')}
                className="pl-11 h-14 rounded-2xl text-base shadow-glass-sm bg-white/5 border-white/10 focus:bg-white/10 focus:border-primary/20 transition-all font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-5 space-y-8">
          {events.length === 0 ? (
            <Card className="glass border-white/10 shadow-glass-lg rounded-[2.5rem]">
              <EmptyState
                icon={Calendar}
                title={t('events.noEvents', 'Нет событий')}
                description={t('events.noEventsDesc', 'Добавьте блок "Событие" на свою страницу, чтобы начать собирать регистрации')}
                action={{
                  label: t('events.addEventBlock', 'Добавить блок'),
                  onClick: () => navigate('/dashboard/home?tab=editor'),
                }}
                className="py-12"
              />
            </Card>
          ) : filteredEvents.length === 0 ? (
            <Card className="glass border-white/10 shadow-glass rounded-[2rem]">
              <EmptyState
                icon={Search}
                title={t('events.noSearchResults', 'Ничего не найдено')}
                className="py-10"
              />
            </Card>
          ) : (
            <div className="space-y-8 pb-24">
              {upcomingEvents.length > 0 && (
                <section>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-5 px-1 flex items-center gap-2.5">
                    <Clock className="h-4 w-4" />
                    {t('events.upcoming', 'Предстоящие')}
                    <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary border-none shadow-glass-sm h-5 font-black">{upcomingEvents.length}</Badge>
                  </h2>
                  <div className="space-y-4">
                    {upcomingEvents.map(renderEventCard)}
                  </div>
                </section>
              )}

              {draftEvents.length > 0 && (
                <section>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-5 px-1 flex items-center gap-2.5">
                    <PenTool className="h-4 w-4" />
                    {t('events.drafts', 'Черновики')}
                    <Badge variant="outline" className="ml-auto border-white/10 bg-white/5 h-5 font-black">{draftEvents.length}</Badge>
                  </h2>
                  <div className="space-y-4">
                    {draftEvents.map(renderEventCard)}
                  </div>
                </section>
              )}

              {pastEvents.length > 0 && (
                <section>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-5 px-1 flex items-center gap-2.5">
                    <History className="h-4 w-4" />
                    {t('events.past', 'Прошедшие')}
                    <Badge variant="outline" className="ml-auto border-white/10 bg-white/5 h-5 font-black">{pastEvents.length}</Badge>
                  </h2>
                  <div className="space-y-4">
                    {pastEvents.map(renderEventCard)}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
});

// Missing imports fix
import History from 'lucide-react/dist/esm/icons/history';
import PenTool from 'lucide-react/dist/esm/icons/pen-tool';
