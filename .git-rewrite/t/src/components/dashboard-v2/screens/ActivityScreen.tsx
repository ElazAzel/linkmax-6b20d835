/**
 * ActivityScreen - Unified inbox for leads, bookings, messages
 */
import { memo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLeads, LeadStatus } from '@/hooks/useLeads';
import {
  Search,
  Plus,
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  Crown,
  ChevronRight,
  Loader2,
  Send,
  CheckCheck,
  X,
  Sparkles,
  Inbox,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { openPremiumPurchase } from '@/lib/upgrade-utils';
import type { Lead } from '@/hooks/useLeads';

interface ActivityScreenProps {
  isPremium: boolean;
}

const STATUS_CONFIG: Record<LeadStatus, {
  bg: string;
  text: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = {
  new: { bg: 'bg-blue-500', text: 'text-white', label: 'Новый', icon: Sparkles },
  contacted: { bg: 'bg-amber-500', text: 'text-white', label: 'В работе', icon: Send },
  qualified: { bg: 'bg-purple-500', text: 'text-white', label: 'Квалиф.', icon: CheckCheck },
  converted: { bg: 'bg-emerald-500', text: 'text-white', label: 'Сделка', icon: CheckCheck },
  lost: { bg: 'bg-gray-400', text: 'text-white', label: 'Потерян', icon: X },
};

const SOURCE_ICONS: Record<string, { emoji: string; label: string }> = {
  form: { emoji: '📝', label: 'Форма' },
  messenger: { emoji: '💬', label: 'Мессенджер' },
  manual: { emoji: '✏️', label: 'Вручную' },
  page_view: { emoji: '👁️', label: 'Просмотр' },
  other: { emoji: '📌', label: 'Другое' },
};

export const ActivityScreen = memo(function ActivityScreen({ isPremium }: ActivityScreenProps) {
  const { t } = useTranslation();
  const { leads, loading, getLeadStats, refreshLeads } = useLeads();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<'leads' | 'bookings'>('leads');

  const stats = getLeadStats();

  // Premium gate
  if (!isPremium) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 safe-area-top">
        <div className="text-center max-w-sm">
          <div className="h-24 w-24 rounded-[32px] bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/30">
            <Crown className="h-12 w-12 text-white" />
          </div>
          <h2 className="text-2xl font-black mb-3">{t('dashboard.activity.premiumRequired', 'Для Premium')}</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {t('dashboard.activity.premiumDescription', 'Управляйте заявками как в мессенджере. Telegram-уведомления, статусы и история.')}
          </p>
          <Button
            size="lg"
            className="h-14 px-8 rounded-2xl text-base font-bold shadow-xl shadow-primary/30"
            onClick={openPremiumPurchase}
          >
            <Crown className="h-5 w-5 mr-2" />
            {t('dashboard.activity.upgradeToPremium', 'Получить Premium')}
          </Button>
        </div>
      </div>
    );
  }

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
      key = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
    }

    if (!groups[key]) groups[key] = [];
    groups[key].push(lead);
    return groups;
  }, {} as Record<string, Lead[]>);

  return (
    <div className="min-h-screen safe-area-top">
      <DashboardHeader
        title={t('dashboard.activity.title', 'Входящие')}
        subtitle={`${stats.total} ${t('dashboard.activity.totalLeads', 'заявок')}`}
        actions={
          <Button
            size="icon"
            className="h-12 w-12 rounded-2xl shadow-lg shadow-primary/25"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-6 w-6" />
          </Button>
        }
      />

      {/* Tabs */}
      <div className="px-5 pb-3">
        <div className="bg-muted/50 rounded-2xl p-1">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'leads' | 'bookings')}>
            <TabsList className="grid grid-cols-2 h-11 bg-transparent p-0 gap-1">
              <TabsTrigger
                value="leads"
                className="rounded-xl h-full data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-sm"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {t('dashboard.activity.tabs.leads', 'Заявки')}
                {stats.new > 0 && (
                  <Badge className="ml-2 h-5 px-1.5 bg-blue-500 text-white text-xs">
                    {stats.new}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="bookings"
                className="rounded-xl h-full data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-sm"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {t('dashboard.activity.tabs.bookings', 'Записи')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {activeTab === 'leads' && (
        <>
          {/* Status Pills */}
          <div className="px-5 py-3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 min-w-max">
              <button
                onClick={() => setStatusFilter('all')}
                className={cn(
                  "h-9 px-4 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2",
                  statusFilter === 'all'
                    ? "bg-foreground text-background shadow-lg"
                    : "bg-muted/60 text-muted-foreground"
                )}
              >
                {t('dashboard.activity.all', 'Все')}
                <span className="text-xs opacity-70">({stats.total})</span>
              </button>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                const count = stats[status as LeadStatus];
                if (count === 0) return null;
                const StatusIcon = config.icon;
                return (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as LeadStatus)}
                    className={cn(
                      "h-9 px-4 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2",
                      statusFilter === status
                        ? `${config.bg} ${config.text} shadow-lg`
                        : "bg-muted/60 text-muted-foreground"
                    )}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {config.label}
                    <span className="text-xs opacity-70">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search */}
          <div className="px-5 pb-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t('dashboard.activity.searchPlaceholder', 'Поиск по имени, телефону...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 pl-12 rounded-xl bg-muted/50 border-0 text-base"
              />
            </div>
          </div>

          {/* Leads List */}
          <ScrollArea className="h-[calc(100vh-340px)]">
            {loading ? (
              <div className="px-5">
                <LoadingSkeleton variant="list" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title={searchQuery ? t('dashboard.activity.noResults', 'Ничего не найдено') : t('dashboard.activity.noLeads', 'Пока нет заявок')}
                description={t('dashboard.activity.noLeadsHint', 'Заявки появятся здесь, когда посетители заполнят формы на вашей странице')}
              />
            ) : (
              <div className="px-5">
                {Object.entries(groupedLeads).map(([date, dateLeads]) => (
                  <div key={date} className="mb-6">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                      {date}
                    </div>
                    <div className="space-y-2">
                      {dateLeads.map((lead) => (
                        <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </>
      )}

      {activeTab === 'bookings' && <BookingsPanel />}

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
}

function LeadCard({ lead, onClick }: LeadCardProps) {
  const statusConfig = STATUS_CONFIG[lead.status];
  const sourceInfo = SOURCE_ICONS[lead.source] || SOURCE_ICONS.other;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-4 rounded-2xl bg-card border border-border/30 transition-all",
        "hover:bg-muted/30 hover:border-border/50 active:scale-[0.98]",
        lead.status === 'new' && "border-blue-500/30 bg-blue-500/5"
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 rounded-xl shrink-0">
          <AvatarFallback className={cn("rounded-xl text-base font-bold", statusConfig.bg, statusConfig.text)}>
            {lead.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-bold truncate">{lead.name}</span>
              {lead.status === 'new' && (
                <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
              )}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{formatTime(lead.created_at)}</span>
          </div>

          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
            {lead.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {lead.phone}
              </span>
            )}
            {lead.email && (
              <span className="flex items-center gap-1 truncate">
                <Mail className="h-3 w-3" />
                {lead.email}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <span>{sourceInfo.emoji}</span>
              {sourceInfo.label}
            </span>
            <Badge className={cn("text-xs font-bold h-6 px-2", statusConfig.bg, statusConfig.text, "border-0")}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 self-center" />
      </div>
    </button>
  );
}
