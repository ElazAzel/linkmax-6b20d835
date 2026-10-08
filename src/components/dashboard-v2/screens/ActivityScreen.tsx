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
import Star from 'lucide-react/dist/esm/icons/star';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardHeader } from '../layout/DashboardHeader';
import { EmptyState } from '@/components/ui/states';
// ErrorState removed - useLeads doesn't expose error
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { AddLeadDialog } from '@/components/crm/AddLeadDialog';
import { LeadDetails } from '@/components/crm/LeadDetails';
import { BookingsPanel } from '@/components/crm/BookingsPanel';
import { ReviewsPanel } from '@/components/crm/ReviewsPanel';
import { WalletWidget } from '@/components/crm/WalletWidget';
import { CrmStatsWidget } from '@/components/crm/CrmStatsWidget';
import { useCrmMetrics } from '@/hooks/crm/useCrmMetrics';
import { cn } from '@/lib/utils/utils';
import { openPremiumPurchase } from '@/lib/utils/upgrade-utils';
import type { Lead } from '@/hooks/crm/useLeads';
import { motion, AnimatePresence } from 'framer-motion';
import { useMonthlyInboundCount } from '@/hooks/dashboard/useMonthlyInboundCount';
import { useAuth } from '@/hooks/user/useAuth';
import { useNavigate, useSearchParams } from '@/lib/router-compat';

interface ActivityScreenProps {
  isPremium: boolean;
}

const STATUS_CONFIG_KEYS: Record<LeadStatus, {
  bg: string;
  text: string;
  i18nKey: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  new: { bg: 'bg-info/12', text: 'text-info', i18nKey: 'crm.status.new', icon: Sparkles },
  contacted: { bg: 'bg-warning/14', text: 'text-warning', i18nKey: 'crm.status.contacted', icon: Send },
  qualified: { bg: 'bg-accent', text: 'text-accent-foreground', i18nKey: 'crm.status.qualified', icon: CheckCheck },
  converted: { bg: 'bg-success/12', text: 'text-success', i18nKey: 'crm.status.converted', icon: CheckCheck },
  lost: { bg: 'bg-muted', text: 'text-muted-foreground', i18nKey: 'crm.status.lost', icon: X },
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
  const [searchParams] = useSearchParams();
  const bookingFocus = searchParams.get('filter');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<'leads' | 'bookings' | 'reviews'>(
    bookingFocus ? 'bookings' : 'leads',
  );

  useEffect(() => {
    if (bookingFocus) setActiveTab('bookings');
  }, [bookingFocus]);

  const stats = getLeadStats();
  const monthlyLeadCount = useMonthlyInboundCount(user?.id, isPremium, [leads.length]);


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
        actions={
          <div className="flex items-center gap-2">
            {isPremium && leads.length > 0 && activeTab === 'leads' && (
              <Button
                variant="outline"
                size="sm"
                className="h-11 w-11 rounded-2xl md:h-10 md:w-auto md:px-5 md:rounded-xl bg-card border border-border hover:bg-muted"
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
                <span className="hidden md:inline font-bold uppercase tracking-[0.06em] text-xs">{t('dashboard.activity.export', 'Экспорт')}</span>
                <span className="md:hidden font-bold">EX</span>
              </Button>
            )}
            <Button
              size="icon"
              className="h-11 w-11 rounded-2xl md:h-10 md:w-10 md:rounded-xl bg-primary shadow-sm text-primary-foreground hover:scale-105 transition-transform"
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
        <Tabs value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'leads' | 'bookings' | 'reviews')} className="w-full">
          <TabsList className="grid grid-cols-3 h-12 bg-muted backdrop-blur-xl p-1 gap-1 border border-border shadow-sm rounded-2xl">
            <TabsTrigger
              value="leads"
              className="rounded-xl h-full data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-md font-bold text-xs uppercase tracking-[0.06em] transition-all duration-300"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {t('dashboard.activity.tabs.leads', 'Заявки')}
              {stats.new > 0 && (
                <Badge className="ml-2 h-5 px-1.5 bg-info text-info-foreground text-xs font-bold border-none ring-offset-0 animate-pulse">
                  {stats.new}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="rounded-xl h-full data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-md font-bold text-xs uppercase tracking-[0.06em] transition-all duration-300"
            >
              <Calendar className="h-4 w-4 mr-2" />
              {t('dashboard.activity.tabs.bookings', 'Записи')}
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="rounded-xl h-full data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-md font-bold text-xs uppercase tracking-[0.06em] transition-all duration-300"
            >
              <Star className="h-4 w-4 mr-2" />
              {t('dashboard.activity.tabs.reviews', 'Reviews')}
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
                    ? "bg-warning/12 border border-warning/20"
                    : "bg-muted/50"
              )}>
                <div className="flex items-center gap-2">
                  {monthlyLeadCount >= 40 && <AlertTriangle className="h-4 w-4 text-warning shrink-0" />}
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
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder={t('dashboard.activity.searchPlaceholder', 'Поиск по имени, телефону...')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 pl-12 rounded-2xl bg-muted border-border focus:bg-muted focus:border-border text-base shadow-sm transition-all placeholder:text-muted-foreground"
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
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-[0.06em] mb-3 px-1 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10 shadow-sm">
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
            <BookingsPanel focusFilter={bookingFocus} />
          </motion.div>
        )}

        {activeTab === 'reviews' && (
          <motion.div
            key="reviews-tab"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <ReviewsPanel />
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
        "w-full p-4 sm:p-5 rounded-card bg-card border border-border transition-colors relative overflow-hidden group",
        "hover:border-primary/30 active:bg-muted shadow-sm",
        lead.status === 'new' && "ring-2 ring-info/20"
      )}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="relative shrink-0">
          <Avatar className="h-11 w-11 sm:h-14 sm:w-14 rounded-full border border-border">
            <AvatarFallback className={cn("rounded-full text-lg font-semibold", statusConfig.bg, statusConfig.text)}>
              {lead.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {lead.status === 'new' && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-info border-2 border-card" />
          )}
        </div>

        <div className="flex-1 min-w-0 text-left pt-0.5">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base sm:text-lg font-semibold truncate text-foreground">{lead.name}</span>
              {isRepeat && (
                <Badge className="h-5 px-2 bg-primary/12 text-primary text-xs font-bold uppercase tracking-[0.06em] border-primary/20 shrink-0 rounded-full">
                  <Repeat className="h-3 w-3 mr-1" />
                  {t('operator.repeat.badge', 'Повторный')}
                </Badge>
              )}
              {lead.metadata?.intent === 'commercial' && (
                <Badge className="h-5 px-2 bg-warning/12 text-warning text-xs font-bold uppercase tracking-[0.06em] border-warning/20 shrink-0 rounded-full animate-pulse">
                  🔥 {t('crm.chatbot.hot', 'Hot')}
                </Badge>
              )}
            </div>
            <span className="shrink-0 text-xs font-num text-muted-foreground">{formatTime(lead.created_at)}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground mb-3 sm:mb-4">
            <ResponseTimeTag createdAt={lead.created_at} status={lead.status} />
            {lead.phone && (
              <span className="flex items-center gap-1.5 whitespace-nowrap font-num bg-muted px-2 py-1 rounded-lg border border-border">
                <Phone className="h-3 w-3 text-primary" />
                {lead.phone}
              </span>
            )}
            {lead.email && (
              <span className="flex items-center gap-1.5 truncate bg-muted px-2 py-1 rounded-lg border border-border">
                <Mail className="h-3 w-3 text-primary" />
                {lead.email}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-base border border-border shadow-inner">
                {sourceInfo.emoji}
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground group-hover:text-muted-foreground transition-colors">
                {t(sourceInfo.i18nKey)}
              </span>
            </div>

            {/* Quick actions for new leads */}
            {lead.status === 'new' && lead.phone ? (
              // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events, jsx-a11y/interactive-supports-focus -- pure event-stop wrapper; inner buttons handle interaction
              <div className="flex flex-wrap items-center gap-2" onClick={e => e.stopPropagation()}>
                <button
                  onClick={handleWhatsAppReply}
                  className="h-11 w-11 rounded-xl bg-success/12 text-success border border-success/20 hover:bg-success/12 flex items-center justify-center transition-colors"
                  title="WhatsApp"
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
                <button
                  onClick={handleTelegramReply}
                  className="h-11 w-11 rounded-xl bg-info/12 text-info border border-info/20 hover:bg-info/12 flex items-center justify-center transition-colors"
                  title="Telegram"
                >
                  <Send className="h-5 w-5" />
                </button>
                <button
                  onClick={handleCallReply}
                  className="h-11 w-11 rounded-xl bg-primary/12 text-primary border border-primary/20 hover:bg-primary/12 flex items-center justify-center transition-colors"
                  title={t('crm.quickReply.call', 'Позвонить')}
                >
                  <Phone className="h-5 w-5" />
                </button>
                <button
                  onClick={handleMarkContacted}
                  className="h-11 px-4 rounded-xl bg-muted text-foreground border border-border hover:bg-accent flex items-center justify-center transition-colors text-xs font-semibold"
                >
                  <CheckCheck className="h-4 w-4 mr-1.5 text-success" />
                  {t('crm.quickReply.done', 'Готово')}
                </button>
              </div>
            ) : (
              <Badge className={cn("h-8 gap-1.5 rounded-full border-none px-3 text-xs font-medium", statusConfig.bg, statusConfig.text)}>
                {t(statusConfig.i18nKey)}
              </Badge>
            )}
          </div>
        </div>

        <div className="hidden sm:flex self-center h-11 w-11 items-center justify-center rounded-full bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="h-5 w-5 text-primary" />
        </div>
      </div>
    </button>
  );
}
