import { memo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Search from 'lucide-react/dist/esm/icons/search';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Phone from 'lucide-react/dist/esm/icons/phone';
import Mail from 'lucide-react/dist/esm/icons/mail';
import MessageCircle from 'lucide-react/dist/esm/icons/message-circle';
import Download from 'lucide-react/dist/esm/icons/download';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import Send from 'lucide-react/dist/esm/icons/send';
import CheckCheck from 'lucide-react/dist/esm/icons/check-check';
import X from 'lucide-react/dist/esm/icons/x';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SmartEmptyState } from '@/components/ui/smart-empty-state';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import Share2 from 'lucide-react/dist/esm/icons/share-2';
import Edit3 from 'lucide-react/dist/esm/icons/edit-3';
import Filter from 'lucide-react/dist/esm/icons/filter';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DashboardHeader } from '../layout/DashboardHeader';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/utils';
import type { Lead } from '@/hooks/crm/useLeads';
import { trackLeadReplied, trackLeadStatusChanged } from '@/lib/activation-events';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
type ReplyChannel = 'whatsapp' | 'telegram' | 'call' | 'email';

const STATUS_FILTERS = ['all', 'new', 'contacted', 'qualified', 'converted', 'lost'] as const;

function getLeadMetadata(lead: Lead | undefined): Record<string, unknown> | null {
    const metadata = lead?.metadata;
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
        return null;
    }

    return metadata as Record<string, unknown>;
}

function getLeadPageId(lead: Lead | undefined): string | null {
    const pageId = getLeadMetadata(lead)?.page_id;
    return typeof pageId === 'string' ? pageId : null;
}

function getLeadTelegramHref(lead: Lead): string | null {
    const metadata = getLeadMetadata(lead);
    const rawHandle = metadata?.telegram_username ?? metadata?.telegram_handle ?? metadata?.telegram;
    if (typeof rawHandle === 'string' && rawHandle.trim()) {
        const handle = rawHandle
            .trim()
            .replace(/^https?:\/\/t\.me\//i, '')
            .replace(/^@/, '');

        if (handle) return `https://t.me/${encodeURIComponent(handle)}`;
    }

    const digits = lead.phone?.replace(/[^0-9]/g, '');
    return digits ? `tg://resolve?phone=${digits}` : null;
}

export const LeadsScreen = memo(function LeadsScreen() {
    const { t } = useTranslation();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTERS[number]>('all');
    const [loadError, setLoadError] = useState(false);

    const fetchLeads = useCallback(async () => {
        setLoadError(false);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); return; }

            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (data) setLeads(data as unknown as Lead[]);
            if (error) console.error('Error fetching leads', error);
        } catch (e) {
            console.error("Error fetching leads", e);
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchLeads(); }, [fetchLeads]);

    const updateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const previousLead = leads.find(lead => lead.id === leadId);
            const { error } = await supabase
                .from('leads')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', leadId)
                .eq('user_id', user.id);

            if (error) throw error;
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));

            if (previousLead && previousLead.status !== newStatus) {
                const pageId = getLeadPageId(previousLead);
                if (pageId) {
                    trackLeadStatusChanged(pageId, leadId, String(previousLead.status), newStatus);
                }
            }

            toast.success(t('crm.status.' + newStatus));
        } catch (e) {
            console.error('Status update error', e);
            toast.error(t('dashboard.leads.updateError', 'Ошибка обновления'));
        }
    };

    const bulkMarkContacted = async () => {
        const newLeads = leads.filter(l => l.status === 'new');
        if (newLeads.length === 0) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { error } = await supabase
                .from('leads')
                .update({ status: 'contacted', updated_at: new Date().toISOString() })
                .eq('user_id', user.id)
                .eq('status', 'new');
            if (error) throw error;
            setLeads(prev => prev.map(l => l.status === 'new' ? { ...l, status: 'contacted' } : l));
            toast.success(`${newLeads.length} лидов → В работу`);
        } catch (e) {
            console.error('Bulk update error', e);
            toast.error('Ошибка обновления');
        }
    };

    const filteredLeads = leads.filter(lead => {
        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
        const matchesSearch = !searchQuery ||
            lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.phone?.includes(searchQuery);
        return matchesStatus && matchesSearch;
    });

    const stats = {
        all: leads.length,
        new: leads.filter(l => l.status === 'new').length,
        contacted: leads.filter(l => l.status === 'contacted').length,
        qualified: leads.filter(l => l.status === 'qualified').length,
        converted: leads.filter(l => l.status === 'converted').length,
        lost: leads.filter(l => l.status === 'lost').length,
    };

    const statusConfig: Record<LeadStatus, { bg: string; text: string; icon: React.ComponentType<{className?: string}> }> = {
        new: { bg: 'bg-blue-500', text: 'text-white', icon: Sparkles },
        contacted: { bg: 'bg-amber-500', text: 'text-white', icon: Send },
        qualified: { bg: 'bg-purple-500', text: 'text-white', icon: CheckCheck },
        converted: { bg: 'bg-emerald-500', text: 'text-white', icon: CheckCircle },
        lost: { bg: 'bg-gray-400', text: 'text-white', icon: X },
    };

    const handleExport = () => {
        if (leads.length === 0) {
            toast.error(t('crm.noLeadsToExport', 'Нет лидов для экспорта'));
            return;
        }
        toast.promise(
            (async () => {
                const { exportLeadsToExcel } = await import('@/lib/export/excel-export-leads');
                return exportLeadsToExcel({ leads });
            })(),
            {
                loading: t('dashboard.leads.exporting', 'Экспорт...'),
                success: t('crm.exportSuccess', 'Лиды экспортированы'),
                error: t('dashboard.leads.exportError', 'Ошибка экспорта'),
            }
        );
    };

    const markLeadContactedAfterReply = async (lead: Lead) => {
        if (lead.status !== 'new') return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await supabase
                .from('leads')
                .update({ status: 'contacted', updated_at: new Date().toISOString() })
                .eq('id', lead.id)
                .eq('user_id', user.id)
                .eq('status', 'new');

            if (error) throw error;

            setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, status: 'contacted' } : l));

            const pageId = getLeadPageId(lead);
            if (pageId) {
                trackLeadStatusChanged(pageId, lead.id, 'new', 'contacted');
            }
        } catch (e) {
            console.error('Auto-contact lead error', e);
        }
    };

    const trackReplyAction = (lead: Lead, channel: ReplyChannel) => {
        const pageId = getLeadPageId(lead);
        if (pageId) {
            trackLeadReplied(pageId, lead.id, channel);
        }
    };

    const handleReplyAction = (lead: Lead, channel: ReplyChannel, href: string, target: '_blank' | '_self') => {
        trackReplyAction(lead, channel);
        void markLeadContactedAfterReply(lead);
        window.open(href, target);
    };

    const openWhatsApp = (lead: Lead) => {
        if (!lead.phone) return;
        handleReplyAction(lead, 'whatsapp', `https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`, '_blank');
    };

    const openTelegram = (lead: Lead, href: string) => {
        handleReplyAction(lead, 'telegram', href, href.startsWith('tg://') ? '_self' : '_blank');
    };

    const openCall = (lead: Lead) => {
        if (!lead.phone) return;
        handleReplyAction(lead, 'call', `tel:${lead.phone}`, '_self');
    };

    const openEmail = (lead: Lead) => {
        if (!lead.email) return;
        handleReplyAction(lead, 'email', `mailto:${lead.email}`, '_self');
    };

    return (
        <div className="min-h-screen safe-area-top">
            <DashboardHeader
                onMenuClick={() => {}}
                title={t('dashboard.leads.title', 'Лиды (CRM)')}
                actions={
                    <div className="flex gap-2">
                        {stats.new > 0 && (
                            <Button
                                variant="default"
                                size="sm"
                                className="h-10 rounded-xl"
                                onClick={bulkMarkContacted}
                            >
                                <CheckCheck className="h-4 w-4 mr-2" />
                                <span className="hidden sm:inline">{t('dashboard.leads.markAll', 'Все в работу')}</span>
                                <span className="sm:hidden">✓ {stats.new}</span>
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 rounded-xl"
                            onClick={handleExport}
                            disabled={leads.length === 0}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">{t('dashboard.leads.export', 'Экспорт')}</span>
                        </Button>
                    </div>
                }
            />

            <div className="px-[var(--space-page-px)] py-4 space-y-4">
                {/* Status Filter Pills */}
                <div className="overflow-x-auto scrollbar-hide pb-2">
                    <div className="flex gap-3 min-w-max px-0.5">
                        {STATUS_FILTERS.map((status) => {
                            const count = stats[status];
                            const isActive = statusFilter === status;
                            return (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={cn(
                                        "h-11 px-5 rounded-2xl text-xs uppercase font-black tracking-widest whitespace-nowrap transition-all flex items-center gap-2.5 shadow-glass-sm",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-lg scale-105"
                                            : "bg-white/5 text-muted-foreground/60 hover:bg-white/10 border border-white/10"
                                    )}
                                >
                                    {status === 'all'
                                        ? t('dashboard.leads.filterAll', 'Все')
                                        : t(`crm.status.${status}`)
                                    }
                                    <Badge variant="secondary" className={cn(
                                        "h-5 min-w-[20px] px-1 rounded-md text-xs border-none",
                                        isActive ? "bg-white/20 text-white" : "bg-white/10"
                                    )}>
                                        {count}
                                    </Badge>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder={t('dashboard.leads.search', 'Поиск по лидам...')}
                        className="pl-11 h-12 rounded-2xl bg-white/5 border-white/10 shadow-glass-sm text-base"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Lead List */}
                <div className="space-y-4 pb-24">
                    {loading ? (
                        <LoadingState message={t('messages.loading', 'Загрузка...')} />
                    ) : loadError ? (
                        <ErrorState
                            title={t('dashboard.leads.loadErrorTitle', 'Ошибка загрузки')}
                            description={t('dashboard.leads.loadErrorDesc', 'Не удалось загрузить список лидов')}
                            retryLabel={t('common.retry', 'Повторить')}
                            onRetry={() => {
                                setLoading(true);
                                fetchLeads();
                            }}
                        />
                    ) : filteredLeads.length === 0 ? (
                        leads.length === 0 ? (
                            // Zero-state: ни одного лида. Активационный гид.
                            <SmartEmptyState
                                icon={Inbox}
                                eyebrow={t('dashboard.leads.emptyEyebrow', 'Готовы принимать заявки?')}
                                title={t('dashboard.leads.emptyTitle', 'Здесь появятся ваши клиенты')}
                                description={t('dashboard.leads.emptyDesc', 'Каждая заявка с формы, бронирования или сообщения попадёт сюда. Сделайте 3 шага, чтобы начать получать лиды.')}
                                checklist={[
                                    {
                                        label: t('dashboard.leads.checklist.publish', 'Опубликуйте свою страницу'),
                                        hint: t('dashboard.leads.checklist.publishHint', 'Без публикации страницу не увидят клиенты'),
                                    },
                                    {
                                        label: t('dashboard.leads.checklist.form', 'Добавьте форму или кнопку связи'),
                                        hint: t('dashboard.leads.checklist.formHint', 'WhatsApp, Telegram, форма заявки или бронирование'),
                                    },
                                    {
                                        label: t('dashboard.leads.checklist.share', 'Поделитесь ссылкой в соцсетях'),
                                        hint: t('dashboard.leads.checklist.shareHint', 'Instagram bio, Telegram, визитки — где видят ваши клиенты'),
                                    },
                                ]}
                                primaryCta={{
                                    label: t('dashboard.leads.emptyCta', 'Открыть редактор'),
                                    onClick: () => window.open('/dashboard?tab=editor', '_self'),
                                    icon: Edit3,
                                }}
                                secondaryCta={{
                                    label: t('dashboard.leads.emptyShareCta', 'Поделиться страницей'),
                                    onClick: () => window.open('/dashboard?tab=pages', '_self'),
                                    icon: Share2,
                                }}
                                footer={t('dashboard.leads.emptyFooter', '💡 Совет: первая заявка обычно приходит в течение 48 часов после публикации')}
                            />
                        ) : (
                            // Filter-empty state: лиды есть, но фильтр не совпал
                            <SmartEmptyState
                                icon={Filter}
                                title={t('dashboard.leads.filterEmptyTitle', 'Ничего не найдено')}
                                description={t('dashboard.leads.filterEmptyDesc', 'Попробуйте изменить фильтр или поиск')}
                                primaryCta={{
                                    label: t('dashboard.leads.resetFilter', 'Сбросить фильтры'),
                                    onClick: () => { setStatusFilter('all'); setSearchQuery(''); },
                                    variant: 'outline',
                                }}
                                compact
                            />
                        )
                    ) : (
                        filteredLeads.map((lead) => {
                            const config = statusConfig[lead.status as LeadStatus] || statusConfig.new;
                            const StatusIcon = config.icon;
                            const telegramHref = getLeadTelegramHref(lead);

                            return (
                                <Card 
                                    key={lead.id} 
                                    className="p-5 glass border-white/10 shadow-glass hover:bg-white/5 transition-all rounded-[2rem] active:scale-[0.98]"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12 rounded-2xl shrink-0 border border-white/10 shadow-glass-sm">
                                                <AvatarFallback className={cn("rounded-2xl text-base font-black shadow-inner", config.bg, config.text)}>
                                                    {lead.name?.charAt(0)?.toUpperCase() || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <span className="font-bold text-base block mb-0.5">{lead.name}</span>
                                                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(lead.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
 
                                        {/* Status Dropdown */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Badge className={cn("cursor-pointer text-xs font-black uppercase tracking-widest h-9 px-4 rounded-xl shadow-glass-sm border-none", config.bg, config.text)}>
                                                    <StatusIcon className="h-3.5 w-3.5 mr-2" />
                                                    {t(`crm.status.${lead.status}`)}
                                                </Badge>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="glass-strong border-white/10 rounded-2xl min-w-[160px] p-2">
                                                {(['new', 'contacted', 'qualified', 'converted', 'lost'] as LeadStatus[]).map(s => (
                                                    <DropdownMenuItem
                                                        key={s}
                                                        onClick={() => updateLeadStatus(lead.id, s)}
                                                        className={cn(
                                                            "rounded-xl py-2.5 px-3 text-xs font-bold transition-colors",
                                                            lead.status === s ? "bg-primary/10 text-primary font-black" : "hover:bg-white/5"
                                                        )}
                                                    >
                                                        {t(`crm.status.${s}`)}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
 
                                    {/* Contact Info */}
                                    <div className="space-y-2 mb-4 px-1">
                                        {lead.email && (
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground/80 font-medium">
                                                <Mail className="h-4 w-4 text-primary/40" />
                                                <span className="truncate">{lead.email}</span>
                                            </div>
                                        )}
                                        {lead.phone && (
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground/80 font-medium">
                                                <Phone className="h-4 w-4 text-emerald-500/40" />
                                                <span>{lead.phone}</span>
                                            </div>
                                        )}
                                        {lead.notes && (
                                            <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/5">
                                                <p className="text-xs text-muted-foreground/70 italic line-clamp-2 leading-relaxed">&ldquo;{lead.notes}&rdquo;</p>
                                            </div>
                                        )}
                                    </div>
 
                                    {/* Quick Actions */}
                                    <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                                        {lead.phone && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-11 px-4 text-xs font-black uppercase tracking-widest rounded-xl text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 flex-1 shadow-glass-sm"
                                                onClick={() => openWhatsApp(lead)}
                                            >
                                                <MessageCircle className="h-4 w-4 mr-2" />
                                                WA
                                            </Button>
                                        )}
                                        {telegramHref && (
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="h-11 px-4 text-xs font-black uppercase tracking-widest rounded-xl text-blue-500 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 flex-1 shadow-glass-sm"
                                                onClick={() => openTelegram(lead, telegramHref)}
                                            >
                                                <Send className="h-4 w-4 mr-2" />
                                                TG
                                            </Button>
                                        )}
                                        {lead.phone && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-11 w-11 rounded-xl text-muted-foreground/40 hover:text-foreground hover:bg-white/5"
                                                onClick={() => openCall(lead)}
                                            >
                                                <Phone className="h-5 w-5" />
                                            </Button>
                                        )}
                                        {lead.email && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-11 w-11 rounded-xl text-muted-foreground/40 hover:text-foreground hover:bg-white/5"
                                                onClick={() => openEmail(lead)}
                                            >
                                                <Mail className="h-5 w-5" />
                                            </Button>
                                        )}
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
});
