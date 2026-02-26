import React, { useState, useEffect } from 'react';
import { useOrganizations } from '@/hooks/useOrganizations';
import { organizationsService, OrganizationMember } from '@/services/organizations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { UserPlus, Settings, Trash2, Mail } from 'lucide-react';
import { toast } from 'sonner';

export const TeamManagementScreen = function TeamManagementScreen() {
    const { currentOrg } = useOrganizations();
    const [members, setMembers] = useState<OrganizationMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);

    useEffect(() => {
        if (currentOrg) {
            loadMembers();
        }
    }, [currentOrg]);

    async function loadMembers() {
        if (!currentOrg) return;
        setLoading(true);
        const data = await organizationsService.getOrganizationMembers(currentOrg.id);
        setMembers(data);
        setLoading(false);
    }

    async function handleInvite(e: React.FormEvent) {
        e.preventDefault();
        if (!currentOrg || !inviteEmail) return;

        setIsInviting(true);
        const { success, error } = await organizationsService.inviteMember(currentOrg.id, inviteEmail);
        setIsInviting(false);

        if (success) {
            toast.success('Приглашение отправлено');
            setInviteEmail('');
            loadMembers();
        } else {
            toast.error(error || 'Ошибка при отправке приглашения');
        }
    }

    if (!currentOrg) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <Settings className="h-12 w-12 text-muted-foreground animate-pulse" />
                <h2 className="text-xl font-medium">Выберите организацию для управления</h2>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{currentOrg.name}</h1>
                    <p className="text-muted-foreground mt-1">Управление участниками и ролями вашей команды</p>
                </div>

                {currentOrg.name !== 'Personal Organization' && (
                    <Card className="w-full md:w-96 glass-card border-white/10 overflow-hidden">
                        <CardContent className="p-4">
                            <form onSubmit={handleInvite} className="flex gap-2">
                                <Input
                                    placeholder="email@example.com"
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="bg-white/5 border-white/10"
                                    required
                                />
                                <Button type="submit" disabled={isInviting} size="sm" className="shrink-0">
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Пригласить
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                )}
            </div>

            <Card className="glass-card border-white/10">
                <CardHeader>
                    <CardTitle className="text-lg">Участники команды</CardTitle>
                    <CardDescription>Список всех активных участников и их права доступа</CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-4 py-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-12 w-full bg-white/5 animate-pulse rounded-lg" />
                            ))}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-white/5">
                                    <TableHead>Пользователь</TableHead>
                                    <TableHead>Роль</TableHead>
                                    <TableHead>Дата вступления</TableHead>
                                    <TableHead className="text-right">Действия</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((member) => (
                                    <TableRow key={member.id} className="hover:bg-white/5 border-white/5">
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border border-white/10">
                                                    <AvatarImage src={member.profile?.avatar_url || ''} />
                                                    <AvatarFallback>
                                                        {member.profile?.display_name?.charAt(0) || member.profile?.username?.charAt(0) || '?'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {member.profile?.display_name || member.profile?.username || 'Участник'}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground font-mono">
                                                        {member.profile?.username ? `@${member.profile.username}` : ''}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize bg-primary/5 border-primary/20 text-primary">
                                                {member.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm font-mono">
                                            {new Date(member.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {member.role !== 'owner' && (
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                        <Settings className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {currentOrg.name === 'Personal Organization' && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-4 items-start text-amber-500">
                    <Settings className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        <p className="font-medium">Личная организация</p>
                        <p className="text-sm opacity-90">
                            В личную организацию нельзя приглашать участников. Для коллективной работы создайте новую команду через меню выбора организаций в боковой панели.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
