import { memo, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import Filter from 'lucide-react/dist/esm/icons/filter';
import Search from 'lucide-react/dist/esm/icons/search';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
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
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { exportLeadsToExcel } from '@/lib/export/excel-export-leads';
import type { Lead } from '@/hooks/crm/useLeads';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';

const STATUS_FILTERS = ['all', 'new', 'contacted', 'qualified', 'converted', 'lost'] as const;

export const LeadsScreen = memo(function LeadsScreen() {
    const { t } = useTranslation();
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTERS[number]>('all');

    const fetchLeads = useCallback(async () => {
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
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchLeads(); }, [fetchLeads]);

    const updateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
        try {
            const { error } = await supabase
                .from('leads')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', leadId);

            if (error) throw error;
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
            toast.success(t('crm.status.' + newStatus));
        } catch (e) {
            console.error('Status update error', e);
            toast.error(t('dashboard.leads.updateError', 'Ошибка обновления'));
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
            exportLeadsToExcel({ leads }),
            {
                loading: t('dashboard.leads.exporting', 'Экспорт...'),
                success: t('crm.exportSuccess', 'Лиды экспортированы'),
                error: t('dashboard.leads.exportError', 'Ошибка экспорта'),
            }
        );
    };

    const openWhatsApp = (phone: string) => {
        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
    };

    const openTelegram = (phone: string) => {
        window.open(`https://t.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
    };

    const openCall = (phone: string) => {
        window.open(`tel:${phone}`, '_self');
    };

    const openEmail = (email: string) => {
        window.open(`mailto:${email}`, '_self');
    };

    return (
        <div className="min-h-screen safe-area-top">
            <DashboardHeader
                title={t('dashboard.leads.title', 'Лиды (CRM)')}
                actions={
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
                }
            />

            <div className="px-5 py-4 space-y-4">
                {/* Status Filter Pills */}
                <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 min-w-max">
                        {STATUS_FILTERS.map((status) => {
                            const count = stats[status];
                            const isActive = statusFilter === status;
                            return (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={cn(
                                        "h-9 px-4 rounded-full text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2",
                                        isActive
                                            ? "bg-foreground text-background shadow-lg scale-105"
                                            : "bg-muted/60 text-muted-foreground hover:bg-muted"
                                    )}
                                >
                                    {status === 'all'
                                        ? t('dashboard.leads.filterAll', 'Все')
                                        : t(`crm.status.${status}`)
                                    }
                                    <span className="text-xs opacity-70">({count})</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t('dashboard.leads.search', 'Поиск по лидам...')}
                        className="pl-9 h-11 rounded-xl bg-card border-none shadow-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Lead List */}
                <div className="space-y-3 pb-24 h-[calc(100vh-260px)] overflow-y-auto hidden-scrollbar">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground animate-pulse">
                            <div className="w-12 h-12 bg-muted rounded-full mb-4" />
                            <div className="h-4 w-24 bg-muted rounded mb-2" />
                        </div>
                    ) : filteredLeads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                                <Inbox className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-bold mb-1">{t('dashboard.leads.emptyTitle', 'Пока нет лидов')}</h3>
                            <p className="text-sm text-muted-foreground px-4">
                                {t('dashboard.leads.emptyDesc', 'Здесь появятся заявки от ваших клиентов через формы и квизы на странице.')}
                            </p>
                        </div>
                    ) : (
                        filteredLeads.map((lead) => {
                            const config = statusConfig[lead.status as LeadStatus] || statusConfig.new;
                            const StatusIcon = config.icon;

                            return (
                                <Card key={lead.id} className="p-4 border-none shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10 rounded-xl shrink-0">
                                                <AvatarFallback className={cn("rounded-xl text-sm font-bold", config.bg, config.text)}>
                                                    {lead.name?.charAt(0)?.toUpperCase() || '?'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <span className="font-bold text-sm">{lead.name}</span>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(lead.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Dropdown */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Badge className={cn("cursor-pointer text-xs font-bold h-7 px-2.5 border-0", config.bg, config.text)}>
                                                    <StatusIcon className="h-3 w-3 mr-1" />
                                                    {t(`crm.status.${lead.status}`)}
                                                </Badge>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {(['new', 'contacted', 'qualified', 'converted', 'lost'] as LeadStatus[]).map(s => (
                                                    <DropdownMenuItem
                                                        key={s}
                                                        onClick={() => updateLeadStatus(lead.id, s)}
                                                        className={cn(lead.status === s && "font-bold")}
                                                    >
                                                        {t(`crm.status.${s}`)}
                                                    </DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Contact Info */}
                                    <div className="space-y-1.5 mb-3">
                                        {lead.email && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Mail className="h-3.5 w-3.5" />
                                                <span className="truncate">{lead.email}</span>
                                            </div>
                                        )}
                                        {lead.phone && (
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Phone className="h-3.5 w-3.5" />
                                                <span>{lead.phone}</span>
                                            </div>
                                        )}
                                        {lead.notes && (
                                            <p className="text-xs text-muted-foreground/70 line-clamp-2 mt-1">{lead.notes}</p>
                                        )}
                                    </div>

                                    {/* Quick Actions */}
                                    <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                                        {lead.phone && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2.5 text-xs rounded-lg text-emerald-600 hover:bg-emerald-500/10"
                                                    onClick={() => openWhatsApp(lead.phone!)}
                                                >
                                                    <MessageCircle className="h-3.5 w-3.5 mr-1" />
                                                    WhatsApp
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2.5 text-xs rounded-lg text-blue-500 hover:bg-blue-500/10"
                                                    onClick={() => openTelegram(lead.phone!)}
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                                                    Telegram
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                                                    onClick={() => openCall(lead.phone!)}
                                                >
                                                    <Phone className="h-3.5 w-3.5" />
                                                </Button>
                                            </>
                                        )}
                                        {lead.email && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                                                onClick={() => openEmail(lead.email!)}
                                            >
                                                <Mail className="h-3.5 w-3.5" />
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
