/**
 * EventRegistrationsList - List of registrations for a specific event
 * Features: Status management, ticket view, check-in
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Search,
  Download,
  QrCode,
  User,
  Mail,
  Phone,
  Ticket,
  Check,
  X,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ru, kk, enUS } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';

interface Registration {
  id: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  answers_json: unknown;
  status: string;
  payment_status: string;
  created_at: string;
  utm_json?: Record<string, string>;
  event_tickets: Array<{
    id: string;
    ticket_code: string;
    status: string;
    checked_in_at: string | null;
  }> | null;
}

interface EventRegistrationsListProps {
  eventId: string;
  eventTitle: string;
  isPremium: boolean;
  onBack: () => void;
  onExport: () => void;
  onOpenScanner: () => void;
}

const STATUS_CONFIG = {
  pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', icon: AlertCircle, label: 'Ожидает' },
  confirmed: { bg: 'bg-green-500/20', text: 'text-green-500', icon: CheckCircle2, label: 'Подтвержден' },
  rejected: { bg: 'bg-red-500/20', text: 'text-red-500', icon: XCircle, label: 'Отклонен' },
  cancelled: { bg: 'bg-gray-500/20', text: 'text-gray-500', icon: X, label: 'Отменен' },
};

const TICKET_STATUS_CONFIG = {
  valid: { bg: 'bg-green-500/20', text: 'text-green-500', label: 'Активен' },
  used: { bg: 'bg-blue-500/20', text: 'text-blue-500', label: 'Использован' },
  cancelled: { bg: 'bg-gray-500/20', text: 'text-gray-500', label: 'Отменен' },
};

export function EventRegistrationsList({
  eventId,
  eventTitle,
  isPremium,
  onBack,
  onExport,
  onOpenScanner,
}: EventRegistrationsListProps) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);

  const locale = i18n.language === 'ru' ? ru : i18n.language === 'kk' ? kk : enUS;

  const fetchRegistrations = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('event_registrations')
        .select('id, attendee_name, attendee_email, attendee_phone, answers_json, status, payment_status, created_at, utm_json, event_tickets(id, ticket_code, status, checked_in_at)')
        .eq('event_id', eventId)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Use unknown cast to bypass strict typing since types may be out of sync
      setRegistrations((data as unknown as Registration[]) || []);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error(t('events.fetchError', 'Не удалось загрузить регистрации'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [eventId, user]);

  const updateStatus = async (registrationId: string, newStatus: 'confirmed' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('event_registrations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', registrationId);

      if (error) throw error;
      toast.success(t(`events.status${newStatus}`, newStatus === 'confirmed' ? 'Подтверждено' : 'Отклонено'));
      fetchRegistrations();
    } catch (error) {
      console.error('Status update error:', error);
      toast.error(t('events.updateError', 'Ошибка обновления'));
    }
  };

  const filteredRegistrations = registrations.filter(reg => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      reg.attendee_name.toLowerCase().includes(query) ||
      reg.attendee_email.toLowerCase().includes(query) ||
      reg.attendee_phone?.includes(query) ||
      reg.event_tickets?.[0]?.ticket_code?.toLowerCase().includes(query)
    );
  });

  const stats = {
    total: registrations.length,
    confirmed: registrations.filter(r => r.status === 'confirmed').length,
    pending: registrations.filter(r => r.status === 'pending').length,
    checkedIn: registrations.filter(r => (r.event_tickets as Array<{status: string}>)?.[0]?.status === 'used').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">{eventTitle}</h2>
          <p className="text-xs text-muted-foreground">{stats.total} {t('events.registrations', 'регистраций')}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 p-3 border-b">
        <div className="text-center p-2 rounded-lg bg-primary/10">
          <div className="text-lg font-bold text-primary">{stats.total}</div>
          <div className="text-[10px] text-muted-foreground">{t('events.total', 'Всего')}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-green-500/10">
          <div className="text-lg font-bold text-green-500">{stats.confirmed}</div>
          <div className="text-[10px] text-muted-foreground">{t('events.confirmed', 'Подтв.')}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-yellow-500/10">
          <div className="text-lg font-bold text-yellow-500">{stats.pending}</div>
          <div className="text-[10px] text-muted-foreground">{t('events.pending', 'Ожидают')}</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-blue-500/10">
          <div className="text-lg font-bold text-blue-500">{stats.checkedIn}</div>
          <div className="text-[10px] text-muted-foreground">{t('events.checkedIn', 'Отмечены')}</div>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="p-3 border-b flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('events.searchRegistrations', 'Поиск по имени, email, билету...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-10 rounded-lg bg-muted/50 border-0"
          />
        </div>
        <Button variant="outline" size="icon" onClick={onExport} title={t('events.export', 'Экспорт')}>
          <Download className="h-4 w-4" />
        </Button>
        <Button 
          variant={isPremium ? 'default' : 'outline'} 
          size="icon" 
          onClick={onOpenScanner}
          title={t('events.scanner', 'QR-сканер')}
        >
          <QrCode className="h-4 w-4" />
        </Button>
      </div>

      {/* Registrations List */}
      <ScrollArea className="flex-1">
        {filteredRegistrations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">{t('events.noRegistrations', 'Нет регистраций')}</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredRegistrations.map((reg) => {
              const statusConfig = STATUS_CONFIG[reg.status];
              const StatusIcon = statusConfig.icon;
              const ticket = reg.event_tickets?.[0];
              const ticketStatusConfig = ticket ? TICKET_STATUS_CONFIG[ticket.status as keyof typeof TICKET_STATUS_CONFIG] : null;

              return (
                <Card
                  key={reg.id}
                  className="m-3 p-3 border rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedRegistration(reg)}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${statusConfig.bg}`}>
                      <StatusIcon className={`h-5 w-5 ${statusConfig.text}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium text-sm truncate">{reg.attendee_name}</span>
                        <Badge variant="outline" className={`${statusConfig.bg} ${statusConfig.text} text-[10px]`}>
                          {t(`events.status.${reg.status}`, statusConfig.label)}
                        </Badge>
                      </div>

                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{reg.attendee_email}</span>
                        </div>
                        {reg.attendee_phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {reg.attendee_phone}
                          </div>
                        )}
                      </div>

                      {/* Ticket info */}
                      {ticket && (
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-[10px] font-mono">
                            <Ticket className="h-3 w-3 mr-1" />
                            {ticket.ticket_code}
                          </Badge>
                          {ticketStatusConfig && (
                            <Badge variant="outline" className={`${ticketStatusConfig.bg} ${ticketStatusConfig.text} text-[10px]`}>
                              {ticketStatusConfig.label}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Quick actions for pending */}
                    {reg.status === 'pending' && (
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-500 hover:bg-green-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(reg.id, 'confirmed');
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-500 hover:bg-red-500/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(reg.id, 'rejected');
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Registration Detail Dialog */}
      <Dialog open={!!selectedRegistration} onOpenChange={() => setSelectedRegistration(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('events.registrationDetails', 'Детали регистрации')}</DialogTitle>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{selectedRegistration.attendee_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${selectedRegistration.attendee_email}`} className="text-primary hover:underline">
                    {selectedRegistration.attendee_email}
                  </a>
                </div>
                {selectedRegistration.attendee_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${selectedRegistration.attendee_phone}`} className="text-primary hover:underline">
                      {selectedRegistration.attendee_phone}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(selectedRegistration.created_at), 'd MMM yyyy, HH:mm', { locale })}
                  </span>
                </div>
              </div>

              {/* QR Code */}
              {selectedRegistration.event_tickets?.[0] && isPremium && (
                <div className="flex flex-col items-center p-4 bg-muted rounded-lg">
                  <QRCodeSVG 
                    value={selectedRegistration.event_tickets[0].ticket_code}
                    size={160}
                    level="H"
                  />
                  <p className="mt-2 font-mono text-sm">{selectedRegistration.event_tickets[0].ticket_code}</p>
                  {selectedRegistration.event_tickets[0].checked_in_at && (
                    <Badge className="mt-2 bg-blue-500/20 text-blue-500">
                      <Check className="h-3 w-3 mr-1" />
                      {t('events.checkedInAt', 'Отмечен')}: {format(new Date(selectedRegistration.event_tickets[0].checked_in_at), 'HH:mm', { locale })}
                    </Badge>
                  )}
                </div>
              )}

              {/* UTM Attribution (Pro) */}
              {isPremium && selectedRegistration.utm_json && Object.keys(selectedRegistration.utm_json).length > 0 && (
                <div className="rounded-lg border border-border/60 p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">{t('events.utmAttribution', 'Источник трафика')}</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {selectedRegistration.utm_json.utm_source && (
                      <div>
                        <span className="text-muted-foreground">Source: </span>
                        <span className="font-medium">{selectedRegistration.utm_json.utm_source}</span>
                      </div>
                    )}
                    {selectedRegistration.utm_json.utm_medium && (
                      <div>
                        <span className="text-muted-foreground">Medium: </span>
                        <span className="font-medium">{selectedRegistration.utm_json.utm_medium}</span>
                      </div>
                    )}
                    {selectedRegistration.utm_json.utm_campaign && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Campaign: </span>
                        <span className="font-medium">{selectedRegistration.utm_json.utm_campaign}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedRegistration.status === 'pending' && (
                <div className="flex gap-2">
                  <Button 
                    className="flex-1" 
                    variant="outline"
                    onClick={() => {
                      updateStatus(selectedRegistration.id, 'confirmed');
                      setSelectedRegistration(null);
                    }}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {t('events.confirm', 'Подтвердить')}
                  </Button>
                  <Button 
                    className="flex-1" 
                    variant="destructive"
                    onClick={() => {
                      updateStatus(selectedRegistration.id, 'rejected');
                      setSelectedRegistration(null);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {t('events.reject', 'Отклонить')}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
