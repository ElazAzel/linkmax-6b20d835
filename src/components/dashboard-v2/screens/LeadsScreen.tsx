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
                onMenuClick={() => {}}
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
                                        "h-11 px-5 rounded-2xl text-[10px] uppercase font-black tracking-widest whitespace-nowrap transition-all flex items-center gap-2.5 shadow-glass-sm",
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
                                        "h-5 min-w-[20px] px-1 rounded-md text-[9px] border-none",
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
                        <div className="grid grid-cols-1 gap-4">
                            {[1, 2, 3].map(i => (
                                <Card key={i} className="p-8 glass border-white/10 animate-pulse rounded-[2rem]">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-2xl" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-white/10 rounded w-1/3" />
                                            <div className="h-3 bg-white/10 rounded w-1/4" />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    ) : filteredLeads.length === 0 ? (
                        <Card className="p-12 text-center glass border-white/10 shadow-glass rounded-[2.5rem]">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                                <Inbox className="h-10 w-10 text-muted-foreground opacity-30" />
                            </div>
                            <h3 className="text-xl font-black mb-2">{t('dashboard.leads.emptyTitle', 'Пока нет лидов')}</h3>
                            <p className="text-sm text-muted-foreground px-4 font-medium leading-relaxed">
                                {t('dashboard.leads.emptyDesc', 'Здесь появятся заявки от ваших клиентов через формы и квизы на странице.')}
                            </p>
                        </Card>
                    ) : (
                        filteredLeads.map((lead) => {
                            const config = statusConfig[lead.status as LeadStatus] || statusConfig.new;
                            const StatusIcon = config.icon;

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
                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(lead.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
 
                                        {/* Status Dropdown */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Badge className={cn("cursor-pointer text-[10px] font-black uppercase tracking-widest h-9 px-4 rounded-xl shadow-glass-sm border-none", config.bg, config.text)}>
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
                                            <>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-11 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 flex-1 shadow-glass-sm"
                                                    onClick={() => openWhatsApp(lead.phone!)}
                                                >
                                                    <MessageCircle className="h-4 w-4 mr-2" />
                                                    WA
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-11 px-4 text-[10px] font-black uppercase tracking-widest rounded-xl text-blue-500 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 flex-1 shadow-glass-sm"
                                                    onClick={() => openTelegram(lead.phone!)}
                                                >
                                                    <Send className="h-4 w-4 mr-2" />
                                                    TG
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-11 w-11 rounded-xl text-muted-foreground/40 hover:text-foreground hover:bg-white/5"
                                                    onClick={() => openCall(lead.phone!)}
                                                >
                                                    <Phone className="h-5 w-5" />
                                                </Button>
                                            </>
                                        )}
                                        {lead.email && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-11 w-11 rounded-xl text-muted-foreground/40 hover:text-foreground hover:bg-white/5"
                                                onClick={() => openEmail(lead.email!)}
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
