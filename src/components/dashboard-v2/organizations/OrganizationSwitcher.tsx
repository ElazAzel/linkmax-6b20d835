import React, { useState } from 'react';
import { useOrganizations } from '@/hooks/useOrganizations';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, Plus, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { organizationsService } from '@/services/organizations';
import { toast } from 'sonner';

interface OrganizationSwitcherProps {
    collapsed?: boolean;
}

export function OrganizationSwitcher({ collapsed }: OrganizationSwitcherProps) {
    const { organizations, currentOrg, switchOrganization, loading, refreshOrganizations } = useOrganizations();
    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [creating, setCreating] = useState(false);

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!newName.trim()) return;
        setCreating(true);
        const { data, error } = await organizationsService.createOrganization(newName.trim());
        setCreating(false);
        if (error) {
            toast.error('Не удалось создать команду');
        } else if (data) {
            toast.success('Команда создана');
            setShowCreate(false);
            setNewName('');
            await refreshOrganizations();
            switchOrganization(data);
        }
    }

    if (loading) {
        return (
            <div className={cn("px-4 py-2", collapsed && "px-2")}>
                <div className="h-10 w-full bg-white/5 animate-pulse rounded-xl" />
            </div>
        );
    }

    const isPersonal = currentOrg?.name === 'Personal Organization';

    return (
        <div className={cn("px-4 py-2", collapsed && "px-2")}>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-between h-12 px-3 hover:bg-white/5 rounded-xl border border-white/5 bg-white/5 backdrop-blur-sm transition-all",
                            collapsed && "justify-center px-0 w-10 h-10"
                        )}
                    >
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className={cn(
                                "h-6 w-6 rounded-md flex items-center justify-center shrink-0",
                                isPersonal ? "bg-primary/20 text-primary" : "bg-amber-500/20 text-amber-500"
                            )}>
                                {isPersonal ? <User className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                            </div>
                            {!collapsed && (
                                <span className="text-sm font-medium truncate max-w-[120px]">
                                    {currentOrg?.name || 'Select Org'}
                                </span>
                            )}
                        </div>
                        {!collapsed && <ChevronDown className="h-4 w-4 ml-2 text-muted-foreground" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 glass-card border-white/10" align="start">
                    <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                        Ваши организации
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/5" />
                    {organizations.map((org) => {
                        const orgIsPersonal = org.name === 'Personal Organization';
                        return (
                            <DropdownMenuItem
                                key={org.id}
                                onClick={() => switchOrganization(org)}
                                className={cn(
                                    "flex items-center gap-2 py-2 cursor-pointer focus:bg-primary/10",
                                    currentOrg?.id === org.id && "bg-primary/5 text-primary"
                                )}
                            >
                                <div className={cn(
                                    "h-5 w-5 rounded flex items-center justify-center shrink-0",
                                    orgIsPersonal ? "bg-primary/20 text-primary" : "bg-amber-500/10 text-amber-500"
                                )}>
                                    {orgIsPersonal ? <User className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                                </div>
                                <span className="truncate">{org.name}</span>
                            </DropdownMenuItem>
                        );
                    })}
                    <DropdownMenuSeparator className="bg-white/5" />
                    <DropdownMenuItem
                        onClick={() => setShowCreate(true)}
                        className="flex items-center gap-2 py-2 cursor-pointer text-primary focus:bg-primary/10"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Создать команду</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Создать команду</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <Input
                            placeholder="Название команды"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            autoFocus
                            required
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                                Отмена
                            </Button>
                            <Button type="submit" disabled={creating || !newName.trim()}>
                                {creating ? 'Создание...' : 'Создать'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
