/**
 * ZoneCommandPalette - Global search (Cmd+K / Ctrl+K) for zone entities
 * Searches across contacts, deals, tasks within the current zone
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command';
import { useZoneContext } from '@/contexts/ZoneContext';
import { useZoneContacts } from '@/hooks/zones/useZoneContacts';
import { useZoneDeals } from '@/hooks/zones/useZoneDeals';
import { useZoneTasks } from '@/hooks/zones/useZoneTasks';
import User from 'lucide-react/dist/esm/icons/user';
import HandCoins from 'lucide-react/dist/esm/icons/hand-coins';
import ListTodo from 'lucide-react/dist/esm/icons/list-todo';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Receipt from 'lucide-react/dist/esm/icons/receipt';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Plus from 'lucide-react/dist/esm/icons/plus';
import CalendarIcon from 'lucide-react/dist/esm/icons/calendar';
import Zap from 'lucide-react/dist/esm/icons/zap';
import Package from 'lucide-react/dist/esm/icons/package';
import FileText from 'lucide-react/dist/esm/icons/file-text';
import Ticket from 'lucide-react/dist/esm/icons/ticket';
import { Badge } from '@/components/ui/badge';

export function ZoneCommandPalette() {
    const [open, setOpen] = useState(false);
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentZoneId } = useZoneContext();
    const { contacts } = useZoneContacts(currentZoneId);
    const { deals } = useZoneDeals(currentZoneId);
    const { tasks } = useZoneTasks(currentZoneId);

    // Keyboard shortcut: Cmd+K / Ctrl+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen(prev => !prev);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const goTo = useCallback(
        (path: string) => {
            navigate(path);
            setOpen(false);
        },
        [navigate],
    );

    // Navigation items
    const navItems = useMemo(
        () => [
            { label: t('zones.nav.dashboard', 'Дашборд'), icon: LayoutDashboard, path: '/zone/dashboard' },
            { label: t('zones.nav.deals', 'Сделки'), icon: HandCoins, path: '/zone/deals' },
            { label: t('zones.nav.contacts', 'Контакты'), icon: User, path: '/zone/contacts' },
            { label: t('zones.nav.tasks', 'Задачи'), icon: ListTodo, path: '/zone/tasks' },
            { label: t('zones.nav.inbox', 'Входящие'), icon: MessageSquare, path: '/zone/inbox' },
            { label: t('zones.nav.invoices', 'Счета'), icon: Receipt, path: '/zone/invoices' },
            { label: t('zones.nav.calendar', 'Календарь'), icon: CalendarIcon, path: '/zone/calendar' },
            { label: t('zones.nav.automations', 'Автоматизации'), icon: Zap, path: '/zone/automations' },
            { label: t('zones.nav.products', 'Товары'), icon: Package, path: '/zone/products' },
            { label: t('zones.nav.events', 'Мероприятия'), icon: Ticket, path: '/zone/events' },
            { label: t('zones.nav.documents', 'Документы'), icon: FileText, path: '/zone/documents' },
            { label: t('zones.nav.settings', 'Настройки'), icon: Settings, path: '/zone/settings' },
        ],
        [t],
    );

    if (!currentZoneId) return null;

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder={t('zones.search.placeholder', 'Поиск контактов, сделок, задач...')} />
            <CommandList>
                <CommandEmpty>{t('zones.search.noResults', 'Ничего не найдено')}</CommandEmpty>

                {/* Contacts */}
                {contacts.length > 0 && (
                    <CommandGroup heading={t('zones.search.contacts', 'Контакты')}>
                        {contacts.slice(0, 8).map(c => (
                            <CommandItem
                                key={c.id}
                                value={`contact ${c.name} ${c.email || ''} ${c.phone || ''}`}
                                onSelect={() => goTo('/zone/contacts')}
                            >
                                <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                <div className="flex flex-col flex-1 min-w-0">
                                    <span className="text-sm truncate">{c.name}</span>
                                    {c.email && <span className="text-xs text-muted-foreground truncate">{c.email}</span>}
                                </div>
                                {c.tags && c.tags.length > 0 && (
                                    <Badge variant="outline" className="text-xs ml-2 shrink-0">{c.tags[0]}</Badge>
                                )}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                )}

                {/* Deals */}
                {deals.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading={t('zones.search.deals', 'Сделки')}>
                            {deals.filter(d => d.status === 'open').slice(0, 8).map(d => (
                                <CommandItem
                                    key={d.id}
                                    value={`deal ${d.title} ${d.contact?.name || ''}`}
                                    onSelect={() => goTo('/zone/deals')}
                                >
                                    <HandCoins className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="text-sm truncate">{d.title}</span>
                                        {d.contact?.name && (
                                            <span className="text-xs text-muted-foreground truncate">{d.contact.name}</span>
                                        )}
                                    </div>
                                    {d.value_amount != null && d.value_amount > 0 && (
                                        <span className="text-xs text-muted-foreground ml-2 shrink-0">
                                            {d.value_amount.toLocaleString()} {d.currency || '₸'}
                                        </span>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}

                {/* Tasks */}
                {tasks.length > 0 && (
                    <>
                        <CommandSeparator />
                        <CommandGroup heading={t('zones.search.tasks', 'Задачи')}>
                            {tasks
                                .filter(tk => tk.status !== 'done' && tk.status !== 'cancelled')
                                .slice(0, 8)
                                .map(tk => (
                                    <CommandItem
                                        key={tk.id}
                                        value={`task ${tk.title} ${tk.description || ''}`}
                                        onSelect={() => goTo('/zone/tasks')}
                                    >
                                        <ListTodo className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-sm truncate">{tk.title}</span>
                                        </div>
                                        <Badge
                                            variant={tk.priority === 'urgent' ? 'destructive' : 'secondary'}
                                            className="text-xs ml-2 shrink-0"
                                        >
                                            {tk.priority}
                                        </Badge>
                                    </CommandItem>
                                ))}
                        </CommandGroup>
                    </>
                )}

                {/* Quick Actions */}
                <CommandSeparator />
                <CommandGroup heading={t('zones.search.quickActions', 'Быстрые действия')}>
                    <CommandItem onSelect={() => goTo('/zone/deals')}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('zones.search.newDeal', 'Создать сделку')}
                    </CommandItem>
                    <CommandItem onSelect={() => goTo('/zone/contacts')}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('zones.search.newContact', 'Добавить контакт')}
                    </CommandItem>
                    <CommandItem onSelect={() => goTo('/zone/tasks')}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t('zones.search.newTask', 'Создать задачу')}
                    </CommandItem>
                </CommandGroup>

                {/* Navigation */}
                <CommandSeparator />
                <CommandGroup heading={t('zones.search.navigation', 'Навигация')}>
                    {navItems.map(item => (
                        <CommandItem key={item.path} onSelect={() => goTo(item.path)} value={`nav ${item.label}`}>
                            <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                            {item.label}
                        </CommandItem>
                    ))}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
