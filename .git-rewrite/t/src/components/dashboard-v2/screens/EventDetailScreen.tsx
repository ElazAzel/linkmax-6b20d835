/**
 * EventDetailScreen - Detailed event view with registrations management
 * Shows all registrations, allows check-in, export, and management
 */
import { memo, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  ArrowLeft,
  Users,
  QrCode,
  Download,
  MapPin,
  Clock,
  Search,
  ExternalLink,
  CalendarDays,
  UserCheck,
  UserX,
  Crown,
  Loader2,
  Mail,
  Phone,
  MoreVertical,
  Check,
  X,
  RefreshCw,
  Ticket,
  FileSpreadsheet,
  FileText,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { openPremiumPurchase } from '@/lib/upgrade-utils';
import { cn } from '@/lib/utils';
import { exportToExcel, exportToCSV } from '@/lib/excel-export';
import { exportEventToPDF, calculateEventAnalytics } from '@/lib/pdf-export';
import type { SupportedLanguage } from '@/lib/i18n-helpers';
import type { EventFormField } from '@/types/page';

interface Registration {
  id: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeePhone: string | null;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
  ticketCode: string | null;
  ticketStatus: 'valid' | 'used' | 'cancelled' | null;
  checkedInAt: string | null;
  answersJson: Record<string, unknown> | null;
  paymentStatus: string;
}

interface FullRegistration {
  id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  answers_json: Record<string, unknown> | null;
  status: string;
  payment_status: string;
  created_at: string;
  event_tickets?: Array<{
    ticket_code: string;
    status: string;
    checked_in_at: string | null;
  }> | null;
}

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  startAt: string | null;
  endAt: string | null;
  locationType: string;
  locationValue: string | null;
  status: string;
  capacity: number | null;
  isPaid: boolean;
  price: number | null;
  currency: string | null;
  coverUrl: string | null;
  pageSlug: string;
  formSchema: EventFormField[];
}

export const EventDetailScreen = memo(function EventDetailScreen() {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { isPremium } = usePremiumStatus();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [fullRegistrations, setFullRegistrations] = useState<FullRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'confirmed' | 'pending' | 'checked'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const locale = i18n.language === 'ru' ? ru : i18n.language === 'kk' ? kk : enUS;

  const fetchData = useCallback(async () => {
    if (!user || !eventId) return;

    try {
      // Fetch event details with form schema
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          id,
          title_i18n_json,
          description_i18n_json,
          start_at,
          end_at,
          location_type,
          location_value,
          status,
          capacity,
          is_paid,
          price_amount,
          currency,
          cover_url,
          form_schema_json,
          pages!inner(slug)
        `)
        .eq('id', eventId)
        .eq('owner_id', user.id)
        .single();

      if (eventError || !eventData) {
        toast.error(t('events.notFound', 'Событие не найдено'));
        navigate('/dashboard/events');
        return;
      }

      const formSchema = ((eventData.form_schema_json as { fields?: EventFormField[] })?.fields || []) as EventFormField[];

      setEvent({
        id: eventData.id,
        title: (eventData.title_i18n_json as Record<string, string>)?.[i18n.language] ||
               (eventData.title_i18n_json as Record<string, string>)?.ru || '',
        description: (eventData.description_i18n_json as Record<string, string>)?.[i18n.language] ||
                     (eventData.description_i18n_json as Record<string, string>)?.ru || null,
        startAt: eventData.start_at,
        endAt: eventData.end_at,
        locationType: eventData.location_type || 'online',
        locationValue: eventData.location_value,
        status: eventData.status || 'draft',
        capacity: eventData.capacity,
        isPaid: eventData.is_paid || false,
        price: eventData.price_amount,
        currency: eventData.currency,
        coverUrl: eventData.cover_url,
        pageSlug: (eventData.pages as { slug: string })?.slug || '',
        formSchema,
      });

      // Fetch registrations with answers
      const { data: regsData, error: regsError } = await supabase
        .from('event_registrations')
        .select('id, attendee_name, attendee_email, attendee_phone, status, payment_status, answers_json, created_at')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (regsError) throw regsError;

      // Fetch tickets for these registrations
      const regIds = (regsData || []).map(r => r.id);
      let ticketsData: Array<{ registration_id: string; ticket_code: string; status: string; checked_in_at: string | null }> = [];
      
      if (regIds.length > 0) {
        const { data } = await supabase
          .from('event_tickets')
          .select('registration_id, ticket_code, status, checked_in_at')
          .in('registration_id', regIds);
        ticketsData = (data as unknown) as typeof ticketsData;
      }

      const ticketMap = new Map(ticketsData.map(t => [t.registration_id, t]));

      // Set full registrations for export
      setFullRegistrations((regsData || []).map(r => {
        const ticket = ticketMap.get(r.id);
        return {
          id: r.id,
          attendee_name: r.attendee_name,
          attendee_email: r.attendee_email,
          attendee_phone: r.attendee_phone,
          answers_json: r.answers_json as Record<string, unknown> | null,
          status: r.status,
          payment_status: r.payment_status,
          created_at: r.created_at,
          event_tickets: ticket ? [{
            ticket_code: ticket.ticket_code,
            status: ticket.status,
            checked_in_at: ticket.checked_in_at,
          }] : null,
        };
      }));

      setRegistrations((regsData || []).map(r => {
        const ticket = ticketMap.get(r.id);
        return {
          id: r.id,
          attendeeName: r.attendee_name,
          attendeeEmail: r.attendee_email,
          attendeePhone: r.attendee_phone,
          status: r.status as Registration['status'],
          createdAt: r.created_at,
          ticketCode: ticket?.ticket_code || null,
          ticketStatus: ticket?.status as Registration['ticketStatus'] || null,
          checkedInAt: ticket?.checked_in_at || null,
          answersJson: r.answers_json as Record<string, unknown> | null,
          paymentStatus: r.payment_status,
        };
      }));
    } catch (error) {
      console.error('Error fetching event:', error);
      toast.error(t('events.fetchError', 'Ошибка загрузки'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, eventId, i18n.language, t, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  // Filter registrations
  const filteredRegistrations = registrations.filter(reg => {
    const matchesSearch = 
      reg.attendeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.attendeeEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reg.ticketCode?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    switch (activeTab) {
      case 'confirmed':
        return reg.status === 'confirmed';
      case 'pending':
        return reg.status === 'pending';
      case 'checked':
        return reg.ticketStatus === 'used';
      default:
        return true;
    }
  });

  // Stats
  const stats = {
    total: registrations.length,
    confirmed: registrations.filter(r => r.status === 'confirmed').length,
    pending: registrations.filter(r => r.status === 'pending').length,
    checkedIn: registrations.filter(r => r.ticketStatus === 'used').length,
  };

  const handleApprove = async (regId: string) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({ status: 'confirmed' })
        .eq('id', regId);

      if (error) throw error;

      setRegistrations(prev => prev.map(r => 
        r.id === regId ? { ...r, status: 'confirmed' as const } : r
      ));
      toast.success(t('events.approved', 'Регистрация подтверждена'));
    } catch (error) {
      toast.error(t('events.approveError', 'Ошибка подтверждения'));
    }
  };

  const handleReject = async (regId: string) => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({ status: 'cancelled' })
        .eq('id', regId);

      if (error) throw error;

      setRegistrations(prev => prev.map(r => 
        r.id === regId ? { ...r, status: 'cancelled' as const } : r
      ));
      toast.success(t('events.rejected', 'Регистрация отклонена'));
    } catch (error) {
      toast.error(t('events.rejectError', 'Ошибка отклонения'));
    }
  };

  const handleManualCheckIn = async (regId: string, ticketCode: string | null) => {
    if (!ticketCode) return;

    try {
      const { error } = await supabase
        .from('event_tickets')
        .update({ status: 'used', checked_in_at: new Date().toISOString() })
        .eq('ticket_code', ticketCode);

      if (error) throw error;

      setRegistrations(prev => prev.map(r => 
        r.id === regId ? { ...r, ticketStatus: 'used' as const, checkedInAt: new Date().toISOString() } : r
      ));
      toast.success(t('events.checkedIn', 'Гость отмечен!'));
    } catch (error) {
      toast.error(t('events.checkInError', 'Ошибка отметки'));
    }
  };

  // Export handlers
  const handleExportExcel = async () => {
    if (!event || fullRegistrations.length === 0) {
      toast.error(t('events.noDataToExport', 'Нет данных для экспорта'));
      return;
    }

    if (!isPremium) {
      openPremiumPurchase();
      return;
    }

    setExporting(true);
    try {
      await exportToExcel({
        eventTitle: event.title,
        registrations: fullRegistrations,
        formFields: event.formSchema,
        language: i18n.language as SupportedLanguage,
        includeAnswers: true,
      });
      toast.success(t('events.exportSuccess', 'Экспорт в Excel завершён'));
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('events.exportError', 'Ошибка экспорта'));
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    if (!event || fullRegistrations.length === 0) {
      toast.error(t('events.noDataToExport', 'Нет данных для экспорта'));
      return;
    }

    setExporting(true);
    try {
      exportToCSV({
        eventTitle: event.title,
        registrations: fullRegistrations,
        formFields: event.formSchema,
        language: i18n.language as SupportedLanguage,
        includeAnswers: true,
      });
      toast.success(t('events.exportSuccess', 'Экспорт в CSV завершён'));
    } catch (error) {
      console.error('Export error:', error);
      toast.error(t('events.exportError', 'Ошибка экспорта'));
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (!event || fullRegistrations.length === 0) {
      toast.error(t('events.noDataToExport', 'Нет данных для экспорта'));
      return;
    }

    if (!isPremium) {
      openPremiumPurchase();
      return;
    }

    setExporting(true);
    try {
      const analytics = calculateEventAnalytics(
        fullRegistrations,
        event.formSchema,
        i18n.language as SupportedLanguage
      );

      const eventDate = event.startAt 
        ? format(new Date(event.startAt), 'dd MMMM yyyy, HH:mm', { locale })
        : undefined;
      
      const eventLocation = event.locationType === 'online' 
        ? t('events.online', 'Онлайн')
        : event.locationValue || t('events.offline', 'Офлайн');

      await exportEventToPDF({
        eventTitle: event.title,
        eventDate,
        eventLocation,
        registrations: fullRegistrations,
        analytics,
        formFields: event.formSchema,
        language: i18n.language as SupportedLanguage,
        includeAnalytics: true,
        includeRegistrationsList: true,
      });
      toast.success(t('events.exportSuccess', 'Экспорт в PDF завершён'));
    } catch (error) {
      console.error('PDF Export error:', error);
      toast.error(t('events.exportError', 'Ошибка экспорта'));
    } finally {
      setExporting(false);
    }
  };

  const renderRegistrationCard = (reg: Registration) => (
    <Card key={reg.id} className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium truncate">{reg.attendeeName}</h4>
            {reg.status === 'pending' && (
              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                {t('events.pendingApproval', 'Ожидает')}
              </Badge>
            )}
            {reg.status === 'cancelled' && (
              <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">
                {t('events.cancelled', 'Отменён')}
              </Badge>
            )}
            {reg.ticketStatus === 'used' && (
              <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600">
                <UserCheck className="h-3 w-3 mr-1" />
                {t('events.checkedInLabel', 'Отмечен')}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {reg.attendeeEmail}
            </span>
            {reg.attendeePhone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {reg.attendeePhone}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(reg.createdAt), 'd MMM, HH:mm', { locale })}
            </span>
            {reg.ticketCode && (
              <span className="flex items-center gap-1 font-mono">
                <Ticket className="h-3 w-3" />
                {reg.ticketCode}
              </span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {reg.status === 'pending' && (
              <>
                <DropdownMenuItem onClick={() => handleApprove(reg.id)}>
                  <Check className="h-4 w-4 mr-2 text-emerald-600" />
                  {t('events.approve', 'Подтвердить')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleReject(reg.id)}>
                  <X className="h-4 w-4 mr-2 text-destructive" />
                  {t('events.reject', 'Отклонить')}
                </DropdownMenuItem>
              </>
            )}
            {reg.status === 'confirmed' && reg.ticketStatus !== 'used' && (
              <DropdownMenuItem onClick={() => handleManualCheckIn(reg.id, reg.ticketCode)}>
                <UserCheck className="h-4 w-4 mr-2" />
                {t('events.manualCheckIn', 'Отметить вручную')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onClick={() => {
                navigator.clipboard.writeText(reg.attendeeEmail);
                toast.success(t('common.copied', 'Скопировано'));
              }}
            >
              <Mail className="h-4 w-4 mr-2" />
              {t('events.copyEmail', 'Копировать email')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="min-h-screen safe-area-top">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/10">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/events')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate">{event.title}</h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {event.startAt && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {format(new Date(event.startAt), 'd MMM yyyy', { locale })}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.locationType === 'online' ? t('events.online', 'Онлайн') : t('events.offline', 'Офлайн')}
                </span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 mb-3">
            <Card className="p-2 text-center">
              <div className="text-lg font-bold">{stats.total}</div>
              <div className="text-[10px] text-muted-foreground">{t('events.total', 'Всего')}</div>
            </Card>
            <Card className="p-2 text-center">
              <div className="text-lg font-bold text-emerald-600">{stats.confirmed}</div>
              <div className="text-[10px] text-muted-foreground">{t('events.confirmed', 'Подтв.')}</div>
            </Card>
            <Card className="p-2 text-center">
              <div className="text-lg font-bold text-amber-600">{stats.pending}</div>
              <div className="text-[10px] text-muted-foreground">{t('events.pendingShort', 'Ожид.')}</div>
            </Card>
            <Card className="p-2 text-center">
              <div className="text-lg font-bold text-primary">{stats.checkedIn}</div>
              <div className="text-[10px] text-muted-foreground">{t('events.checkedInShort', 'Чекин')}</div>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 h-9 text-xs"
              onClick={() => {
                if (!isPremium) {
                  openPremiumPurchase();
                  return;
                }
                navigate(`/dashboard/events/${eventId}/scanner`);
              }}
            >
              <QrCode className="h-4 w-4 mr-1.5" />
              {t('events.scanner', 'Сканер')}
              {!isPremium && <Crown className="h-3 w-3 ml-1 text-amber-500" />}
            </Button>
            
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 h-9 text-xs"
                  disabled={exporting || registrations.length === 0}
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-1.5" />
                  )}
                  {t('events.export', 'Экспорт')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleExportExcel}>
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
                  Excel (.xlsx)
                  {!isPremium && <Crown className="h-3 w-3 ml-auto text-amber-500" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                  CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportPDF}>
                  <BarChart3 className="h-4 w-4 mr-2 text-primary" />
                  {t('events.exportPdfWithCharts', 'PDF + Аналитика')}
                  {!isPremium && <Crown className="h-3 w-3 ml-auto text-amber-500" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 w-9 p-0"
              onClick={() => window.open(`https://lnkmx.my/${event.pageSlug}`, '_blank')}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="w-full justify-start px-4 h-10 bg-transparent border-b rounded-none">
            <TabsTrigger value="all" className="text-xs">
              {t('events.all', 'Все')} ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="text-xs">
              {t('events.confirmedTab', 'Подтв.')} ({stats.confirmed})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs">
              {t('events.pendingTab', 'Ожид.')} ({stats.pending})
            </TabsTrigger>
            <TabsTrigger value="checked" className="text-xs">
              {t('events.checkedTab', 'Чекин')} ({stats.checkedIn})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Search */}
      <div className="p-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('events.searchRegistrations', 'Поиск по имени, email, коду...')}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
      </div>

      {/* Registrations List */}
      <ScrollArea className="flex-1">
        <div className="p-4 pt-2 space-y-3">
          {filteredRegistrations.length === 0 ? (
            <Card className="p-6 text-center">
              <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {searchQuery 
                  ? t('events.noSearchResults', 'Ничего не найдено')
                  : t('events.noRegistrations', 'Пока нет регистраций')}
              </p>
            </Card>
          ) : (
            filteredRegistrations.map(renderRegistrationCard)
          )}
        </div>
      </ScrollArea>
    </div>
  );
});
