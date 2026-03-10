/**
 * IncomingWidget - Unified incoming feed on HomeScreen (operator mode)
 * Shows latest leads + pending bookings with quick actions
 */
import { memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLeads } from '@/hooks/crm/useLeads';
import { useLeadAging } from '@/hooks/crm/useLeadAging';
import { useAuth } from '@/hooks/user/useAuth';
import { supabase } from '@/platform/supabase/client';
import { trackActivationEvent } from '@/lib/activation-events';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ResponseTimeTag } from '@/components/crm/ResponseTimeTag';
import { EmptyState } from '@/components/dashboard-v2/common/EmptyState';
import { cn } from '@/lib/utils/utils';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Share2 from 'lucide-react/dist/esm/icons/share-2';

interface IncomingWidgetProps {
  pageId?: string;
  onOpenActivity?: () => void;
  onShare?: () => void;
}

interface PendingBooking {
  id: string;
  client_name: string;
  slot_date: string;
  slot_time: string;
  status: string;
  created_at: string;
}

export const IncomingWidget = memo(function IncomingWidget({
  pageId,
  onOpenActivity,
  onShare,
}: IncomingWidgetProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { leads } = useLeads();
  const aging = useLeadAging(leads);
  const [pendingBookings, setPendingBookings] = useState<PendingBooking[]>([]);

  // Fetch pending bookings
  useEffect(() => {
    if (!user) return;
    supabase
      .from('bookings')
      .select('id, client_name, slot_date, slot_time, status, created_at')
      .eq('owner_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        if (data) setPendingBookings(data as PendingBooking[]);
      });
  }, [user]);

  // Combine leads (new) + pending bookings, sorted by created_at desc, limit 5
  const newLeads = leads.filter(l => l.status === 'new').slice(0, 3);
  const recentBookings = pendingBookings.slice(0, 2);
  const hasItems = newLeads.length > 0 || recentBookings.length > 0;
  const totalNew = leads.filter(l => l.status === 'new').length + pendingBookings.length;

  // Quick reply handler
  const handleQuickReply = (phone: string, name: string) => {
    const message = t('crm.quickReply.template', 'Здравствуйте, {{name}}! Спасибо за заявку. Чем могу помочь?', { name });
    const url = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    if (pageId) {
      trackActivationEvent(pageId, 'first_lead_captured', { channel: 'whatsapp' });
    }
  };

  // Empty state — no incoming yet
  if (!hasItems) {
    return (
      <Card className="p-5 border-border/30">
        <EmptyState
          icon={Inbox}
          title={t('home.incoming.empty', 'Пока нет входящих')}
          description={t('home.incoming.emptyHint', 'Поделитесь страницей, чтобы получить первые заявки')}
          action={onShare ? {
            label: t('home.incoming.share', 'Поделиться'),
            onClick: onShare,
          } : undefined}
          className="py-8"
        />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-border/30">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold">{t('home.incoming.title', 'Входящие')}</h3>
          {totalNew > 0 && (
            <Badge className="h-5 px-1.5 bg-blue-500 text-white text-xs border-0">
              {totalNew}
            </Badge>
          )}
          {aging.urgentTotal > 0 && (
            <Badge className="h-5 px-1.5 bg-destructive/15 text-destructive text-xs border-destructive/20">
              <AlertTriangle className="h-3 w-3 mr-0.5" />
              {aging.urgentTotal}
            </Badge>
          )}
        </div>
        {onOpenActivity && (
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={onOpenActivity}>
            {t('home.incoming.viewAll', 'Все')}
            <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
          </Button>
        )}
      </div>

      {/* Items */}
      <div className="px-4 pb-4 space-y-2">
        {newLeads.map(lead => (
          <button
            key={lead.id}
            onClick={onOpenActivity}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-left"
          >
            <Avatar className="h-9 w-9 rounded-lg shrink-0">
              <AvatarFallback className="rounded-lg text-xs font-bold bg-blue-500 text-white">
                {lead.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold truncate">{lead.name}</span>
                <ResponseTimeTag createdAt={lead.created_at} status={lead.status} />
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MessageCircle className="h-3 w-3" />
                <span>{t('home.incoming.lead', 'Заявка')}</span>
                {lead.phone && <span>· {lead.phone}</span>}
              </div>
            </div>
            {lead.phone && (
              <Button
                size="sm"
                className="h-8 w-8 rounded-lg p-0 bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickReply(lead.phone!, lead.name);
                }}
              >
                <Phone className="h-3.5 w-3.5" />
              </Button>
            )}
          </button>
        ))}

        {recentBookings.map(booking => (
          <button
            key={booking.id}
            onClick={onOpenActivity}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors text-left"
          >
            <Avatar className="h-9 w-9 rounded-lg shrink-0">
              <AvatarFallback className="rounded-lg text-xs font-bold bg-amber-500 text-white">
                {booking.client_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold truncate block">{booking.client_name}</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{booking.slot_date} · {booking.slot_time}</span>
              </div>
            </div>
            <Badge className="text-xs font-bold h-5 px-1.5 bg-amber-500 text-white border-0 shrink-0">
              {t('crm.bookingStatus.pending', 'Ожидает')}
            </Badge>
          </button>
        ))}
      </div>
    </Card>
  );
});
