/**
 * OperatorSummaryWidget - Daily operator summary on HomeScreen
 * Shows today's bookings, unanswered leads, week delta, stale page alert, follow-up prompts
 */
import { memo, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/user/useAuth';
import { useLeads } from '@/hooks/crm/useLeads';
import { useLeadAging } from '@/hooks/crm/useLeadAging';
import { useRepeatCustomers } from '@/hooks/crm/useRepeatCustomers';
import { supabase } from '@/platform/supabase/client';
import { trackActivationEvent } from '@/lib/activation-events';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';
import { format, subDays, isAfter, parseISO, differenceInDays } from 'date-fns';
import CalendarDays from 'lucide-react/dist/esm/icons/calendar-days';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import TrendingDown from 'lucide-react/dist/esm/icons/trending-down';
import Users from 'lucide-react/dist/esm/icons/users';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Repeat from 'lucide-react/dist/esm/icons/repeat';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Phone from 'lucide-react/dist/esm/icons/phone';

interface OperatorSummaryWidgetProps {
  pageId?: string;
  pageUpdatedAt?: string | null;
  onOpenActivity?: () => void;
  onOpenEditor?: () => void;
}

interface TodayBooking {
  id: string;
  client_name: string;
  slot_time: string;
  slot_end_time?: string;
  status: string;
  client_phone?: string;
}

interface CompletedBooking {
  id: string;
  client_name: string;
  client_phone: string | null;
  slot_date: string;
  slot_time: string;
}

export const OperatorSummaryWidget = memo(function OperatorSummaryWidget({
  pageId,
  pageUpdatedAt,
  onOpenActivity,
  onOpenEditor,
}: OperatorSummaryWidgetProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { leads } = useLeads();
  const aging = useLeadAging(leads);
  const { repeatCount } = useRepeatCustomers();

  const [todayBookings, setTodayBookings] = useState<TodayBooking[]>([]);
  const [completedBookings, setCompletedBookings] = useState<CompletedBooking[]>([]);
  const [weekStats, setWeekStats] = useState<{ thisWeek: number; lastWeek: number }>({ thisWeek: 0, lastWeek: 0 });

  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  // Fetch today's bookings + yesterday's completed (for follow-up)
  useEffect(() => {
    if (!user) return;

    const fetchBookings = async () => {
      // Today's upcoming
      const { data: todayData } = await supabase
        .from('bookings')
        .select('id, client_name, slot_time, slot_end_time, status, client_phone')
        .eq('owner_id', user.id)
        .eq('slot_date', today)
        .neq('status', 'cancelled')
        .order('slot_time', { ascending: true });

      if (todayData) setTodayBookings(todayData as TodayBooking[]);

      // Yesterday's completed for follow-up
      const { data: completedData } = await supabase
        .from('bookings')
        .select('id, client_name, client_phone, slot_date, slot_time')
        .eq('owner_id', user.id)
        .eq('slot_date', yesterday)
        .eq('status', 'confirmed')
        .order('slot_time', { ascending: true })
        .limit(5);

      if (completedData) setCompletedBookings(completedData as CompletedBooking[]);
    };

    fetchBookings();
  }, [user, today, yesterday]);

  // Fetch week-over-week leads count
  useEffect(() => {
    if (!user) return;

    const now = new Date();
    const thisWeekStart = subDays(now, 7);
    const lastWeekStart = subDays(now, 14);

    const thisWeekLeads = leads.filter(l => isAfter(parseISO(l.created_at), thisWeekStart)).length;
    const lastWeekLeads = leads.filter(l => {
      const d = parseISO(l.created_at);
      return isAfter(d, lastWeekStart) && !isAfter(d, thisWeekStart);
    }).length;

    setWeekStats({ thisWeek: thisWeekLeads, lastWeek: lastWeekLeads });
  }, [leads, user]);

  // Stale page check
  const pageIsStale = useMemo(() => {
    if (!pageUpdatedAt) return false;
    return differenceInDays(new Date(), parseISO(pageUpdatedAt)) >= 14;
  }, [pageUpdatedAt]);

  const unansweredLeads = leads.filter(l => l.status === 'new').length;
  const delta = weekStats.thisWeek - weekStats.lastWeek;
  const hasContent = todayBookings.length > 0 || unansweredLeads > 0 || completedBookings.length > 0 || repeatCount > 0 || pageIsStale;

  if (!hasContent) return null;

  // Follow-up handler
  const handleFollowUp = (name: string, phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = t('operator.followUp.template', 'Здравствуйте, {{name}}! Спасибо за визит! Как вам? Будем рады видеть вас снова 😊', { name });
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    if (pageId) {
      trackActivationEvent(pageId, 'post_service_followup_sent', { channel: 'whatsapp' });
    }
  };

  return (
    <Card className="overflow-hidden border-border/30">
      <div className="p-4 space-y-3">
        {/* Today's bookings */}
        {todayBookings.length > 0 && (
          <button onClick={onOpenActivity} className="w-full flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 text-left">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold block">
                {t('operator.today.title', 'Сегодня записей: {{count}}', { count: todayBookings.length })}
              </span>
              <span className="text-xs text-muted-foreground">
                {t('operator.today.next', 'Ближайшая: {{name}} в {{time}}', {
                  name: todayBookings[0].client_name,
                  time: todayBookings[0].slot_time.substring(0, 5),
                })}
              </span>
            </div>
          </button>
        )}

        {/* Unanswered leads alert */}
        {unansweredLeads > 0 && (
          <button onClick={onOpenActivity} className="w-full flex items-center gap-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10 text-left">
            <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-bold block">
                {t('operator.unanswered.title', 'Необработано: {{count}}', { count: unansweredLeads })}
              </span>
              {aging.missedCount > 0 && (
                <span className="text-xs text-destructive">
                  {t('operator.unanswered.missed', '{{count}} пропущено (>24ч)', { count: aging.missedCount })}
                </span>
              )}
            </div>
            {aging.urgentTotal > 0 && (
              <Badge className="h-5 px-1.5 bg-destructive/15 text-destructive text-xs border-destructive/20 shrink-0">
                <AlertTriangle className="h-3 w-3 mr-0.5" />
                {aging.urgentTotal}
              </Badge>
            )}
          </button>
        )}

        {/* Post-service follow-up */}
        {completedBookings.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
              {t('operator.followUp.title', 'Написать отзыв')}
            </span>
            {completedBookings.slice(0, 3).map(b => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold block truncate">{b.client_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {t('operator.followUp.visitedYesterday', 'Визит вчера в {{time}}', { time: b.slot_time.substring(0, 5) })}
                  </span>
                </div>
                {b.client_phone && (
                  <Button
                    size="sm"
                    className="h-8 rounded-lg px-3 bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
                    onClick={() => handleFollowUp(b.client_name, b.client_phone!)}
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1" />
                    {t('operator.followUp.send', 'Написать')}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Week stats row */}
        <div className="flex items-center gap-4 px-1">
          {/* Week delta */}
          <div className="flex items-center gap-1.5 text-xs">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">{t('operator.week.leads', 'За неделю:')}</span>
            <span className="font-bold">{weekStats.thisWeek}</span>
            {delta !== 0 && (
              <span className={cn("flex items-center gap-0.5 font-bold", delta > 0 ? "text-emerald-600" : "text-destructive")}>
                {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {delta > 0 ? '+' : ''}{delta}
              </span>
            )}
          </div>

          {/* Repeat customers */}
          {repeatCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <Repeat className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-muted-foreground">{t('operator.repeat.label', 'Повторных:')}</span>
              <span className="font-bold text-violet-600">{repeatCount}</span>
            </div>
          )}
        </div>

        {/* Stale page alert */}
        {pageIsStale && (
          <button
            onClick={onOpenEditor}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 text-left"
          >
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-xs text-amber-700 font-medium">
              {t('operator.stale.page', 'Страница не обновлялась более 2 недель — обновите контент')}
            </span>
          </button>
        )}
      </div>
    </Card>
  );
});
