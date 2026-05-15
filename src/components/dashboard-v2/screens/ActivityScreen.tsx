/**
 * ActivityScreen - Unified inbox for leads, bookings, messages
 */
import { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { useRepeatCustomers } from '@/hooks/crm/useRepeatCustomers';
import Repeat from 'lucide-react/dist/esm/icons/repeat';
import { useTranslation } from 'react-i18next';
import { useLeads, LeadStatus } from '@/hooks/crm/useLeads';
import { ResponseTimeTag } from '@/components/crm/ResponseTimeTag';
import { trackLeadReplied } from '@/lib/activation-events';
import { formatDateShort, getLocale } from '@/lib/utils/format';
import { toast } from 'sonner';
import Search from 'lucide-react/dist/esm/icons/search';
import Plus from 'lucide-react/dist/esm/icons/plus';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import Crown from 'lucide-react/dist/esm/icons/crown';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Send from 'lucide-react/dist/esm/icons/send';
import CheckCheck from 'lucide-react/dist/esm/icons/check-check';
import X from 'lucide-react/dist/esm/icons/x';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardHeader } from '../layout/DashboardHeader';
import { EmptyState } from '../common/EmptyState';
// ErrorState removed - useLeads doesn't expose error
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { AddLeadDialog } from '@/components/crm/AddLeadDialog';
import { LeadDetails } from '@/components/crm/LeadDetails';
import { BookingsPanel } from '@/components/crm/BookingsPanel';
import { WalletWidget } from '@/components/crm/WalletWidget';
import { CrmStatsWidget } from '@/components/crm/CrmStatsWidget';
import { useCrmMetrics } from '@/hooks/crm/useCrmMetrics';
import { cn } from '@/lib/utils/utils';
import { openPremiumPurchase } from '@/lib/utils/upgrade-utils';
import type { Lead } from '@/hooks/crm/useLeads';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/platform/supabase/client';
import { useAuth } from '@/hooks/user/useAuth';
import { useNavigate } from 'react-router-dom';

interface ActivityScreenProps {
  isPremium: boolean;
}

const STATUS_CONFIG_KEYS: Record<LeadStatus, {
  bg: string;
  text: string;
  i18nKey: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  new: { bg: 'bg-blue-500', text: 'text-white', i18nKey: 'crm.status.new', icon: Sparkles },
  contacted: { bg: 'bg-amber-500', text: 'text-white', i18nKey: 'crm.status.contacted', icon: Send },
  qualified: { bg: 'bg-purple-500', text: 'text-white', i18nKey: 'crm.status.qualified', icon: CheckCheck },
  converted: { bg: 'bg-emerald-500', text: 'text-white', i18nKey: 'crm.status.converted', icon: CheckCheck },
  lost: { bg: 'bg-gray-400', text: 'text-white', i18nKey: 'crm.status.lost', icon: X },
};

const SOURCE_ICONS_KEYS: Record<string, { emoji: string; i18nKey: string }> = {
  form: { emoji: '📝', i18nKey: 'crm.source.form' },
  messenger: { emoji: '💬', i18nKey: 'crm.source.messenger' },
  manual: { emoji: '✏️', i18nKey: 'crm.source.manual' },
  page_view: { emoji: '👁️', i18nKey: 'crm.source.page_view' },
  chatbot: { emoji: '🤖', i18nKey: 'crm.source.chatbot' },
  other: { emoji: '📌', i18nKey: 'crm.source.other' },
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 }
};

export const ActivityScreen = memo(function ActivityScreen({ isPremium }: ActivityScreenProps) {
  const { t, i18n } = useTranslation();
  const { leads, loading, getLeadStats, refreshLeads, quickReply } = useLeads();
  const { isRepeatCustomer } = useRepeatCustomers();
  const { user } = useAuth();
  const { data: crmMetrics, isLoading: metricsLoading } = useCrmMetrics();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<'leads' | 'bookings'>('leads');
  const [monthlyLeadCount, setMonthlyLeadCount] = useState<number | null>(null);

  const stats = getLeadStats();

  // Fetch unified monthly inbound count (leads + bookings + registrations) for limit banner
  useEffect(() => {
    if (isPremium || !user?.id) return;
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const monthStartISO = monthStart.toISOString();
    (async () => {
      // Get all page IDs for this user
      const { data: pages } = await supabase.from('pages').select('id').eq('user_id', user.id);
      const pageIds = (pages || []).map((p: any) => p.id);

      // Count leads
      const { count: leadsC } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStartISO);

      let bookingsC = 0;
      let regsC = 0;
      if (pageIds.length > 0) {
        const { count: bC } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .in('page_id', pageIds)
          .gte('created_at', monthStartISO);
        bookingsC = bC || 0;

        const { count: rC } = await supabase
          .from('event_registrations')
          .select('*', { count: 'exact', head: true })
          .in('page_id', pageIds)
          .gte('created_at', monthStartISO);
        regsC = rC || 0;
      }

      setMonthlyLeadCount((leadsC || 0) + bookingsC + regsC);
    })();
  }, [isPremium, user?.id, leads.length]);

  // CRM is now available to all users (basic CRM free, premium for export/automation)

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Group leads by date
  const groupedLeads = filteredLeads.reduce((groups, lead) => {
    const date = new Date(lead.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key: string;
    if (date.toDateString() === today.toDateString()) {
      key = t('dashboard.activity.today', 'Сегодня');
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = t('dashboard.activity.yesterday', 'Вчера');
    } else {
      key = formatDateShort(date, i18n.language);
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(lead);
    return groups;
  }, {} as Record<string, Lead[]>);

  return (
    <div className="h-[calc(100vh-64px)] md:h-screen safe-area-top flex flex-col">
      <DashboardHeader
        title={t('dashboard.activity.title', 'Входящие')}
        subtitle={`${stats.total} ${t('dashboard.activity.totalLeads', 'заявок')}`}
        onMenuClick={() => {}}
        actions={
          <div className="flex items-center gap-2">
            {isPremium && leads.length > 0 && activeTab === 'leads' && (
              <Button
                variant="outline"
                size="sm"
                className="h-11 w-11 rounded-2xl md:h-10 md:w-auto md:px-5 md:rounded-xl glass hover:bg-white/10 border-white/10"
                onClick={() => {
                  toast.promise(
                    (async () => {
                      const { exportLeadsToExcel } = await import('@/lib/export/excel-export-leads');
                      return exportLeadsToExcel({ leads });
                    })(),
                    {
                      loading: t('dashboard.activity.exporting', 'Экспорт лидов...'),
                      success: t('dashboard.activity.exportSuccess', 'Экспорт завершен'),
                      error: t('dashboard.activity.exportError', 'Ошибка экспорта')
                    }
                  );
                }}
              >
                <span className="hidden md:inline font-bold uppercase tracking-widest text-xs">{t('dashboard.activity.export', 'Экспорт')}</span>
                <span className="md:hidden font-bold">EX</span>
              </Button>
            )}
            <Button
              size="icon"
              className="h-11 w-11 rounded-2xl md:h-10 md:w-10 md:rounded-xl bg-primary shadow-glass text-primary-foreground hover:scale-105 transition-transform"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-6 w-6 md:h-5 md:w-5" />
            </Button>
          </div>
        }
      />

      {/* CRM Intelligence Widget */}
      <div className="px-5 pt-2">
        <CrmStatsWidget metrics={crmMetrics || null} isLoading={metricsLoading} />
      </div>

      {/* Fintech Ledger Widget - Foundation for Fintech Pivot */}
      <div className="px-5 pb-6">
        <WalletWidget />
      </div>

      {/* Tabs */}
      <div className="px-5 pb-4">
        <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'leads' | 'bookings')} className="w-full">
          <TabsList className="grid grid-cols-2 h-12 bg-white/5 backdrop-blur-xl p-1 gap-1 border border-white/10 shadow-glass rounded-2xl">
            <TabsTrigger
              value="leads"
              className="rounded-xl h-full data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-glass-lg font-black text-xs uppercase tracking-widest transition-all duration-300"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {t('dashboard.activity.tabs.leads', 'Заявки')}
              {stats.new > 0 && (
                <Badge className="ml-2 h-5 px-1.5 bg-blue-500 text-white text-xs font-black border-none ring-offset-0 animate-pulse">
                  {stats.new}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="rounded-xl h-full data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-glass-lg font-black text-xs uppercase tracking-widest transition-all duration-300"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {t('dashboard.activity.tabs.bookings', 'Записи')}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <AnimatePresence mode='wait'>
        {activeTab === 'leads' && (
          <motion.div
            key="leads-tab"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Lead Limit Banner for free users */}
            {!isPremium && monthlyLeadCount !== null && (
              <div className={cn(
                "mx-5 mb-3 p-3 rounded-xl flex items-center justify-between text-sm",
                monthlyLeadCount >= 50
                  ? "bg-destructive/10 border border-destructive/20"
                  : monthlyLeadCount >= 40
                    ? "bg-amber-500/10 border border-amber-500/20"
                    : "bg-muted/50"
              )}>
                <div className="flex items-center gap-2">
                  {monthlyLeadCount >= 40 && <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />}
                  <span className={cn(
                    "font-medium",
                    monthlyLeadCount >= 50 ? "text-destructive" : ""
                  )}>
                    {monthlyLeadCount >= 50
                      ? t('crm.leadLimit.reached', 'Лимит обращений достигнут')
                      : t('crm.leadLimit.used', '{{used}} из {{max}} обращений', { used: monthlyLeadCount, max: 50 })
                    }
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 px-4 text-xs font-bold text-primary bg-primary/5 rounded-lg"
                  onClick={() => navigate('/pricing')}
                >
                  {t('crm.leadLimit.upgrade', 'Снять лимит →')}
                </Button>
              </div>
            )}

            {/* Status Pills */}
            <div className="px-5 py-3 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 min-w-max">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={cn(
                    "h-11 px-5 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2",
                    statusFilter === 'all'
                      ? "bg-foreground text-background shadow-lg scale-105"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {t('dashboard.activity.all', 'Все')}
                  <span className="text-xs opacity-70">({stats.total})</span>
                </button>
                {Object.entries(STATUS_CONFIG_KEYS).map(([status, config]) => {
                  const count = stats[status as LeadStatus];
                  if (count === 0) return null;
                  const StatusIcon = config.icon;
                  return (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status as LeadStatus)}
                      className={cn(
                        "h-11 px-5 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2",
                        statusFilter === status
                          ? `${config.bg} ${config.text} shadow-lg scale-105`
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {t(config.i18nKey)}
                      <span className="text-xs opacity-70">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search */}
            <div className="px-5 pb-4">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder={t('dashboard.activity.searchPlaceholder', 'Поиск по имени, телефону...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 pl-12 rounded-2xl bg-white/5 border-white/10 focus:bg-white/10 focus:border-white/20 text-base shadow-glass-sm transition-all placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>
            </div>

            {/* Leads List - Flex Layout for Scroll */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {loading ? (
                <div className="px-5 pt-2">
                  <LoadingSkeleton variant="list" />
                </div>
              ) : filteredLeads.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title={searchQuery ? t('dashboard.activity.noResults', 'Ничего не найдено') : t('dashboard.activity.noLeads', 'Пока нет заявок')}
                  description={t('dashboard.activity.noLeadsHint', 'Заявки появятся здесь, когда посетители заполнят формы на вашей странице')}
                />
              ) : (
                <div className="px-5 pb-24 pt-2">
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                  >
                    {Object.entries(groupedLeads).map(([date, dateLeads]) => (
                      <div key={date} className="mb-6">
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10 shadow-sm">
                          {date}
                        </div>
                        <div className="space-y-2">
                          {dateLeads.map((lead) => (
                            <motion.div key={lead.id} variants={itemVariants}>
                              <LeadCard lead={lead} onClick={() => setSelectedLead(lead)} onQuickReply={quickReply} isRepeat={isRepeatCustomer(lead.phone, lead.email)} />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'bookings' && (
          <motion.div
            key="bookings-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <BookingsPanel />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialogs */}
      <AddLeadDialog
        open={showAddDialog}
        onOpenChange={(isOpen) => {
          setShowAddDialog(isOpen);
          if (!isOpen) refreshLeads();
        }}
      />

      {selectedLead && (
        <LeadDetails
          lead={selectedLead}
          open={!!selectedLead}
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setSelectedLead(null);
              refreshLeads();
            }
          }}
        />
      )}
    </div>
  );
});

// Lead Card Component
interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  onQuickReply?: (id: string) => Promise<boolean>;
  isRepeat?: boolean;
}

function LeadCard({ lead, onClick, onQuickReply, isRepeat }: LeadCardProps) {
  const { t, i18n } = useTranslation();
  const statusConfig = STATUS_CONFIG_KEYS[lead.status];
  const sourceInfo = SOURCE_ICONS_KEYS[lead.source] || SOURCE_ICONS_KEYS.other;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(getLocale(i18n.language), { hour: '2-digit', minute: '2-digit' });
  };

  const handleWhatsAppReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lead.phone) return;
    const message = t('crm.quickReply.template', 'Здравствуйте, {{name}}! Спасибо за заявку. Чем могу помочь?', { name: lead.name });
    window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
    onQuickReply?.(lead.id);
    trackLeadReplied('', lead.id, 'whatsapp');
  };

  const handleTelegramReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lead.phone) return;
    window.open(`https://t.me/${lead.phone.replace(/\D/g, '')}`, '_blank');
    onQuickReply?.(lead.id);
    trackLeadReplied('', lead.id, 'telegram');
  };

  const handleCallReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!lead.phone) return;
    window.open(`tel:${lead.phone}`, '_self');
    onQuickReply?.(lead.id);
    trackLeadReplied('', lead.id, 'call');
  };

  const handleMarkContacted = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickReply?.(lead.id);
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-6 rounded-[2rem] glass transition-all duration-500 relative overflow-hidden group border-white/10",
        "hover:scale-[1.01] hover:bg-white/10 active:scale-[0.98] shadow-glass-lg",
        lead.status === 'new' && "shadow-blue-500/10 ring-2 ring-blue-500/20"
      )}
    >
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/5 via-transparent to-transparent -z-10",
        lead.status === 'new' && "opacity-[0.05]"
      )} />
      
      <div className="flex items-start gap-5">
        <div className="relative shrink-0">
          <Avatar className="h-14 w-14 rounded-2xl shadow-glass border border-white/20">
            <AvatarFallback className={cn("rounded-2xl text-lg font-black", statusConfig.bg, statusConfig.text)}>
              {lead.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {lead.status === 'new' && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 border-2 border-white shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0 text-left pt-0.5">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-lg font-black tracking-tight truncate text-foreground/90">{lead.name}</span>
              {isRepeat && (
                <Badge className="h-5 px-2 bg-violet-500/10 text-violet-500 text-xs font-black uppercase tracking-wider border-violet-500/20 shrink-0 rounded-full">
                  <Repeat className="h-3 w-3 mr-1" />
                  {t('operator.repeat.badge', 'Повторный')}
                </Badge>
              )}
              {(lead.metadata as Record<string, string> | null)?.intent === 'commercial' && (
                <Badge className="h-5 px-2 bg-orange-500/10 text-orange-600 text-xs font-black uppercase tracking-wider border-orange-500/20 shrink-0 rounded-full animate-pulse">
                  🔥 {t('crm.chatbot.hot', 'Hot')}
                </Badge>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-xs font-black tabular-nums text-muted-foreground/60 uppercase tracking-widest">{formatTime(lead.created_at)}</span>
              <ResponseTimeTag createdAt={lead.created_at} status={lead.status} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground/70 mb-4 group-hover:text-foreground/70 transition-colors">
            {lead.phone && (
              <span className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                <Phone className="h-3 w-3 text-primary/60" />
                {lead.phone}
              </span>
            )}
            {lead.email && (
              <span className="flex items-center gap-1.5 truncate bg-white/5 px-2 py-1 rounded-lg border border-white/5">
                <Mail className="h-3 w-3 text-primary/60" />
                {lead.email}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-base border border-white/10 shadow-inner">
                {sourceInfo.emoji}
              </span>
              <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/40 group-hover:text-muted-foreground/60 transition-colors">
                {t(sourceInfo.i18nKey)}
              </span>
            </div>

            {/* Quick actions for new leads */}
            {lead.status === 'new' && lead.phone ? (
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <button
                  onClick={handleWhatsAppReply}
                  className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                  title="WhatsApp"
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
                <button
                  onClick={handleTelegramReply}
                  className="h-11 w-11 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                  title="Telegram"
                >
                  <Send className="h-5 w-5" />
                </button>
                <button
                  onClick={handleCallReply}
                  className="h-11 w-11 rounded-xl bg-violet-500/10 text-violet-600 border border-violet-500/20 hover:bg-violet-500/20 flex items-center justify-center transition-all hover:scale-110 active:scale-90"
                  title={t('crm.quickReply.call', 'Позвонить')}
                >
                  <Phone className="h-5 w-5" />
                </button>
                <button
                  onClick={handleMarkContacted}
                  className="h-11 px-4 rounded-xl bg-foreground/5 text-foreground/60 border border-foreground/10 hover:bg-foreground/10 flex items-center justify-center transition-all text-xs font-black uppercase tracking-widest"
                >
                  <CheckCheck className="h-4 w-4 mr-1.5 text-emerald-500" />
                  {t('crm.quickReply.done', 'Готово')}
                </button>
              </div>
            ) : (
              <Badge className={cn("text-xs font-black uppercase tracking-widest h-10 px-4 rounded-xl shadow-glass-sm", statusConfig.bg, statusConfig.text, "border-none")}>
                {t(statusConfig.i18nKey)}
              </Badge>
            )}
          </div>
        </div>

        <div className="self-center h-11 w-11 flex items-center justify-center rounded-full bg-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1 group-hover:scale-110">
          <ChevronRight className="h-5 w-5 text-primary/60" />
        </div>
      </div>
    </button>
  );
}
