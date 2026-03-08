/**
 * OperatorSummaryWidget - Daily operator summary on HomeScreen
 * Shows today's bookings, unanswered leads, week delta, stale page alert, follow-up prompts, rebook opportunities
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
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';

interface OperatorSummaryWidgetProps {
  pageId?: string;
  pageSlug?: string;
  pageNiche?: string | null;
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
  followup_sent_at: string | null;
}

interface RebookCandidate {
  client_name: string;
  client_phone: string;
  slot_date: string;
}

/** Get the public page URL */
function getPageUrl(slug?: string): string {
  return slug ? `https://lnkmx.my/${slug}` : '';
}

/** Get niche-specific follow-up message with rebook link */
function getFollowUpMessage(name: string, url: string, niche?: string | null): string {
  if (niche === 'beauty' || niche === 'nails' || niche === 'lashes' || niche === 'hair') {
    return `Здравствуйте, ${name}! Спасибо за визит 💅 Как вам результат? Записаться снова: ${url}`;
  }
  if (niche === 'massage' || niche === 'wellness' || niche === 'spa') {
    return `${name}, спасибо за визит! Для повторной записи: ${url} 🙏`;
  }
  return `${name}, спасибо! Записаться снова можно здесь: ${url}`;
}

/** Get niche-specific rebook nudge message */
function getRebookMessage(name: string, url: string): string {
  return `${name}, давно не виделись! Записаться снова: ${url}`;
}

export const OperatorSummaryWidget = memo(function OperatorSummaryWidget({
  pageId,
  pageSlug,
  pageNiche,
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
  const [rebookCandidates, setRebookCandidates] = useState<RebookCandidate[]>([]);
  const [weekStats, setWeekStats] = useState<{ thisWeek: number; lastWeek: number }>({ thisWeek: 0, lastWeek: 0 });
  const [sentFollowups, setSentFollowups] = useState<Set<string>>(new Set());

  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch today's bookings + recently completed (for follow-up) + rebook candidates
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      // Auto-complete past bookings first
      await supabase.rpc('auto_complete_past_bookings', { p_owner_id: user.id });

      // Today's upcoming
      const { data: todayData } = await supabase
        .from('bookings')
        .select('id, client_name, slot_time, slot_end_time, status, client_phone')
        .eq('owner_id', user.id)
        .eq('slot_date', today)
        .neq('status', 'cancelled')
        .order('slot_time', { ascending: true });

      if (todayData) setTodayBookings(todayData as TodayBooking[]);

      // Recently completed, no follow-up sent (last 5 days)
      const fiveDaysAgo = format(subDays(new Date(), 5), 'yyyy-MM-dd');
      const { data: completedData } = await supabase
        .from('bookings')
        .select('id, client_name, client_phone, slot_date, slot_time, followup_sent_at')
        .eq('owner_id', user.id)
        .eq('status', 'completed')
        .gte('slot_date', fiveDaysAgo)
        .lt('slot_date', today)
        .is('followup_sent_at' as any, null)
        .order('slot_date', { ascending: false })
        .limit(5);

      if (completedData) setCompletedBookings(completedData as CompletedBooking[]);

      // Rebook candidates: completed 14-35 days ago
      const thirtyFiveDaysAgo = format(subDays(new Date(), 35), 'yyyy-MM-dd');
      const fourteenDaysAgo = format(subDays(new Date(), 14), 'yyyy-MM-dd');
      const { data: rebookData } = await supabase
        .from('bookings')
        .select('client_name, client_phone, slot_date')
        .eq('owner_id', user.id)
        .eq('status', 'completed')
        .gte('slot_date', thirtyFiveDaysAgo)
        .lte('slot_date', fourteenDaysAgo)
        .not('client_phone', 'is', null)
        .order('slot_date', { ascending: false })
        .limit(20);

      if (rebookData) {
        // Filter out clients who have a newer booking
        const { data: recentBookings } = await supabase
          .from('bookings')
          .select('client_phone')
          .eq('owner_id', user.id)
          .gt('slot_date', fourteenDaysAgo)
          .neq('status', 'cancelled');

        const recentPhones = new Set(
          (recentBookings || []).map(b => (b.client_phone || '').replace(/\D/g, '')).filter(Boolean)
        );

        const candidates = (rebookData as RebookCandidate[])
          .filter(b => b.client_phone && !recentPhones.has(b.client_phone.replace(/\D/g, '')))
          // Deduplicate by phone
          .filter((b, i, arr) => arr.findIndex(x => x.client_phone?.replace(/\D/g, '') === b.client_phone?.replace(/\D/g, '')) === i)
          .slice(0, 3);

        setRebookCandidates(candidates);

        // Track opportunity shown
        if (candidates.length > 0 && pageId) {
          trackActivationEvent(pageId, 'repeat_opportunity_shown', { count: String(candidates.length) });
        }
      }
    };

    fetchData();
  }, [user, today, pageId]);

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
  const hasContent = todayBookings.length > 0 || unansweredLeads > 0 || completedBookings.length > 0 || rebookCandidates.length > 0 || repeatCount > 0 || pageIsStale;

  if (!hasContent) return null;

  const pageUrl = getPageUrl(pageSlug);

  // Follow-up handler with rebook link
  const handleFollowUp = async (bookingId: string, name: string, phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = getFollowUpMessage(name, pageUrl, pageNiche);
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');

    // Mark followup_sent_at
    await supabase
      .from('bookings')
      .update({ followup_sent_at: new Date().toISOString() } as any)
      .eq('id', bookingId);

    setSentFollowups(prev => new Set(prev).add(bookingId));

    if (pageId) {
      trackActivationEvent(pageId, 'repeat_followup_sent', { bookingId, hasRebookLink: 'true' });
    }
  };

  // Rebook nudge handler
  const handleRebookNudge = (name: string, phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const message = getRebookMessage(name, pageUrl);
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
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

        {/* Post-service follow-up with rebook link */}
        {completedBookings.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
              {t('operator.followUp.title', 'Написать после визита')}
            </span>
            {completedBookings.slice(0, 3).map(b => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-semibold block truncate">{b.client_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {t('operator.followUp.completedOn', 'Визит {{date}}', { date: b.slot_date })}
                  </span>
                </div>
                {b.client_phone && !sentFollowups.has(b.id) ? (
                  <Button
                    size="sm"
                    className="h-8 rounded-lg px-3 bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
                    onClick={() => handleFollowUp(b.id, b.client_name, b.client_phone!)}
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1" />
                    {t('operator.followUp.send', 'Написать')}
                  </Button>
                ) : sentFollowups.has(b.id) ? (
                  <Badge className="h-7 px-2 bg-emerald-500/15 text-emerald-600 text-xs border-0 shrink-0">
                    <CheckCircle className="h-3.5 w-3.5 mr-1" />
                    {t('operator.followUp.sent', 'Отправлено')}
                  </Badge>
                ) : null}
              </div>
            ))}
          </div>
        )}

        {/* Rebook opportunities — clients due for return visit */}
        {rebookCandidates.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
              {t('operator.rebook.title', 'Пора вернуть клиента')}
            </span>
            {rebookCandidates.map((b, idx) => {
              const daysSince = differenceInDays(new Date(), parseISO(b.slot_date));
              return (
                <div key={`${b.client_phone}-${idx}`} className="flex items-center gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/10">
                  <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                    <Repeat className="h-3.5 w-3.5 text-violet-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold block truncate">{b.client_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {t('operator.rebook.daysSince', '{{days}} дн. назад', { days: daysSince })}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg px-3 border-violet-500/20 text-violet-600 hover:bg-violet-500/10 shrink-0"
                    onClick={() => handleRebookNudge(b.client_name, b.client_phone)}
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1" />
                    {t('operator.rebook.nudge', 'Напомнить')}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Week stats row */}
        <div className="flex items-center gap-4 px-1">
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
