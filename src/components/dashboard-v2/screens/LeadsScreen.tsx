import { memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Inbox from 'lucide-react/dist/esm/icons/inbox';
import Filter from 'lucide-react/dist/esm/icons/filter';
import Search from 'lucide-react/dist/esm/icons/search';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import Clock from 'lucide-react/dist/esm/icons/clock';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardHeader } from '../layout/DashboardHeader';
import { supabase } from '@/platform/supabase/client';

export const LeadsScreen = memo(function LeadsScreen() {
    const { t } = useTranslation();
    const [leads, setLeads] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Example basic fetch logic
    useEffect(() => {
        async function fetchLeads() {
            try {
                const { data: pageData } = await (supabase as any).from('pages').select('id').eq('is_primary', true).single();
                if (pageData?.id) {
                    const { data, error } = await (supabase as any)
                        .from('leads')
                        .select('*')
                        .eq('page_id', pageData.id)
                        .order('created_at', { ascending: false });

                    if (data) setLeads(data as any[]);
                }
            } catch (e) {
                console.error("Error fetching leads", e);
            } finally {
                setLoading(false);
            }
        }
        fetchLeads();
    }, []);

    const filteredLeads = leads.filter(lead =>
        JSON.stringify(lead.form_data).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen safe-area-top">
            <DashboardHeader title={t('dashboard.leads.title', 'Лиды (CRM)')} />

            <div className="px-5 py-4 space-y-4">
                {/* Actions Bar */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('dashboard.leads.search', 'Поиск по лидам...')}
                            className="pl-9 h-11 rounded-xl bg-card border-none shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl shrink-0 bg-card border-none shadow-sm">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>

                {/* Lead List */}
                <div className="space-y-3 pb-24 h-[calc(100vh-160px)] overflow-y-auto hidden-scrollbar">
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
                        filteredLeads.map((lead) => (
                            <Card key={lead.id} className="p-4 border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        {lead.status === 'new' ? (
                                            <Badge className="bg-blue-500/10 text-blue-500 border-none px-2 rounded-lg">Новый</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground border-border px-2 rounded-lg">
                                                <CheckCircle className="h-3 w-3 mr-1" /> В работе
                                            </Badge>
                                        )}
                                        <span className="text-xs text-muted-foreground flex items-center">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {new Date(lead.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {Object.entries(lead.form_data).map(([key, value]) => (
                                        <div key={key} className="text-sm">
                                            <span className="font-medium capitalize text-muted-foreground">{key}: </span>
                                            <span>{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
});
