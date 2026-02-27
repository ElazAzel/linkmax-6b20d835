import { useState, useEffect } from 'react';
import { supabase } from '@/platform/supabase/client';
// Tables not in generated types - using any
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Check from 'lucide-react/dist/esm/icons/check';
import X from 'lucide-react/dist/esm/icons/x';
import Clock from 'lucide-react/dist/esm/icons/clock';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/utils';

type PayoutRequestWithProfile = {
    id: string;
    user_id: string;
    amount: number;
    status: string;
    payment_method: string | null;
    payment_details: any;
    admin_notes: string | null;
    processed_by: string | null;
    processed_at: string | null;
    created_at: string;
    updated_at: string;
    user_profiles: {
        display_name: string | null;
        username: string | null;
    } | null;
};

export const AdminFintechTab = () => {
    const [requests, setRequests] = useState<PayoutRequestWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase as any)
                .from('token_withdrawals')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Fetch user profiles separately
            const userIds = Array.from(new Set((data || []).map((d: any) => String(d.user_id)))) as string[];
            const { data: profiles } = userIds.length > 0 
                ? await supabase.from('user_profiles').select('id, display_name, username').in('id', userIds)
                : { data: [] as any[] };

            const profileMap = new Map((profiles || []).map(p => [p.id, p]));
            const enriched = (data || []).map((d: any) => ({
                ...d,
                user_profiles: profileMap.get(d.user_id) || null,
            }));
            setRequests(enriched);
        } catch (err: any) {
            toast.error("Failed to fetch requests: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (id: string, status: 'completed' | 'rejected') => {
        try {
            setActionLoading(id);
            const { error } = await supabase
                .from('token_withdrawals')
                .update({
                    status,
                    processed_at: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;

            toast.success(`Request marked as ${status}`);
            fetchRequests();
        } catch (err: any) {
            toast.error("Action failed: " + err.message);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Управление выплатами</h2>
                    <p className="text-muted-foreground">Обработка запросов пользователей на вывод средств</p>
                </div>
                <Button onClick={fetchRequests} variant="outline" size="sm">
                    <Clock className="mr-2 h-4 w-4" />
                    Обновить
                </Button>
            </div>

            <Card className="glass-card border-white/10">
                <CardHeader>
                    <CardTitle>Запросы на вывод ({requests.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Пользователь</TableHead>
                                <TableHead>Сумма</TableHead>
                                <TableHead>Метод</TableHead>
                                <TableHead>Дата</TableHead>
                                <TableHead>Статус</TableHead>
                                <TableHead className="text-right">Действия</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                                        Запросов пока нет
                                    </TableCell>
                                </TableRow>
                            ) : (
                                requests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold">{req.user_profiles?.display_name || 'N/A'}</span>
                                                <span className="text-xs text-muted-foreground">@{req.user_profiles?.username}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-bold text-lg">
                                            {req.amount.toLocaleString()} ₸
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-primary/5">
                                                {req.payment_method || 'Другое'}
                                            </Badge>
                                            <p className="text-[10px] mt-1 text-muted-foreground truncate max-w-[150px]">
                                                {req.payment_details?.notes || ''}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {format(new Date(req.created_at), 'dd.MM.yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn(
                                                "capitalize",
                                                req.status === 'pending' ? "bg-amber-500/20 text-amber-500" :
                                                    req.status === 'completed' ? "bg-emerald-500/20 text-emerald-500" :
                                                        "bg-red-500/20 text-red-500"
                                            )}>
                                                {req.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {req.status === 'pending' && (
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-emerald-500 hover:bg-emerald-500/10"
                                                        onClick={() => handleAction(req.id, 'completed')}
                                                        disabled={!!actionLoading}
                                                    >
                                                        {actionLoading === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-500 hover:bg-red-500/10"
                                                        onClick={() => handleAction(req.id, 'rejected')}
                                                        disabled={!!actionLoading}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

