import { lazy, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useZoneContext } from '@/contexts/ZoneContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScreenErrorBoundary } from '@/components/dashboard-v2/common';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Building2 from 'lucide-react/dist/esm/icons/building-2';

// Lazy load zone screens
const ZoneDashboard = lazy(() => import('./ZoneDashboard').then(m => ({ default: m.ZoneDashboard })));
const ZoneDealsScreen = lazy(() => import('./ZoneDealsScreen').then(m => ({ default: m.ZoneDealsScreen })));
const ZoneContactsScreen = lazy(() => import('./ZoneContactsScreen').then(m => ({ default: m.ZoneContactsScreen })));
const ZoneInboxScreen = lazy(() => import('./ZoneInboxScreen').then(m => ({ default: m.ZoneInboxScreen })));
const ZoneTasksScreen = lazy(() => import('./ZoneTasksScreen').then(m => ({ default: m.ZoneTasksScreen })));
const ZoneSettingsScreen = lazy(() => import('./ZoneSettingsScreen').then(m => ({ default: m.ZoneSettingsScreen })));
const ZoneAutomationsScreen = lazy(() => import('./ZoneAutomationsScreen').then(m => ({ default: m.ZoneAutomationsScreen })));
const ZoneInvoicesScreen = lazy(() => import('./ZoneInvoicesScreen').then(m => ({ default: m.ZoneInvoicesScreen })));
const ZoneAnalyticsScreen = lazy(() => import('./ZoneAnalyticsScreen').then(m => ({ default: m.ZoneAnalyticsScreen })));
const ZoneBookingsCalendarScreen = lazy(() => import('./ZoneBookingsCalendarScreen').then(m => ({ default: m.ZoneBookingsCalendarScreen })));
const ZoneEventsScreen = lazy(() => import('./ZoneEventsScreen').then(m => ({ default: m.ZoneEventsScreen })));
const ZoneProductsScreen = lazy(() => import('./ZoneProductsScreen').then(m => ({ default: m.ZoneProductsScreen })));
const ZoneDocumentsScreen = lazy(() => import('./documents/ZoneDocumentsScreen').then(m => ({ default: m.ZoneDocumentsScreen })));
const ResourcesScreen = lazy(() => import('@/components/dashboard-v2/screens/ResourcesScreen').then(m => ({ default: m.ResourcesScreen })));

function NoZone() {
    const { t } = useTranslation();
    const { createZone } = useZoneContext();
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);

    const slugify = (s: string) =>
        s.toLowerCase().trim().replace(/[^a-z0-9а-я\s-]/gi, '').replace(/\s+/g, '-').slice(0, 40) || `zone-${Date.now()}`;

    const handleCreate = async () => {
        const trimmed = name.trim();
        if (!trimmed) return;
        setBusy(true);
        try {
            await createZone(trimmed, slugify(trimmed));
            toast.success(t('zones.created', 'Зона создана'));
            setOpen(false);
            setName('');
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : t('zones.createError', 'Не удалось создать зону');
            console.error(err);
            toast.error(msg);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="p-8 flex flex-col items-center justify-center text-center min-h-[50vh]">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Building2 className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">{t('zones.empty.title', 'У вас пока нет бизнес-зоны')}</h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
                {t('zones.empty.desc', 'Зона объединяет сделки, контакты, инвойсы и документы для команды. Создайте первую за 10 секунд.')}
            </p>
            <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('zones.create', 'Создать зону')}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('zones.create', 'Создать зону')}</DialogTitle>
                        <DialogDescription>
                            {t('zones.createHint', 'Например: «Студия Алия», «Агентство Astana», «Моё ИП».')}
                        </DialogDescription>
                    </DialogHeader>
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('zones.namePlaceholder', 'Название зоны')}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        autoFocus
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
                            {t('common.cancel', 'Отмена')}
                        </Button>
                        <Button onClick={handleCreate} disabled={!name.trim() || busy}>
                            {busy ? t('common.loading', 'Создаём...') : t('common.create', 'Создать')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

/** Zone screen wrappers that read ZoneContext */
export function ZoneDashboardWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ScreenErrorBoundary screenName="ZoneDashboard"><ZoneDashboard zoneId={currentZoneId} /></ScreenErrorBoundary>;
}

export function ZoneDealsScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ScreenErrorBoundary screenName="ZoneDealsScreen"><ZoneDealsScreen zoneId={currentZoneId} /></ScreenErrorBoundary>;
}

export function ZoneContactsScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ScreenErrorBoundary screenName="ZoneContactsScreen"><ZoneContactsScreen zoneId={currentZoneId} /></ScreenErrorBoundary>;
}

export function ZoneInboxScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ScreenErrorBoundary screenName="ZoneInboxScreen"><ZoneInboxScreen zoneId={currentZoneId} /></ScreenErrorBoundary>;
}

export function ZoneTasksScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ScreenErrorBoundary screenName="ZoneTasksScreen"><ZoneTasksScreen zoneId={currentZoneId} /></ScreenErrorBoundary>;
}

export function ZoneSettingsScreenWrapper() {
    const { currentZone, members, myRole, refetch } = useZoneContext();
    if (!currentZone) return <NoZone />;
    return <ScreenErrorBoundary screenName="ZoneSettingsScreen"><ZoneSettingsScreen zone={currentZone} members={members} myRole={myRole} onRefetch={refetch} /></ScreenErrorBoundary>;
}

export function ZoneAutomationsScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ScreenErrorBoundary screenName="ZoneAutomationsScreen"><ZoneAutomationsScreen zoneId={currentZoneId} /></ScreenErrorBoundary>;
}

export function ZoneInvoicesScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ScreenErrorBoundary screenName="ZoneInvoicesScreen"><ZoneInvoicesScreen zoneId={currentZoneId} /></ScreenErrorBoundary>;
}

export function ZoneAnalyticsScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ScreenErrorBoundary screenName="ZoneAnalyticsScreen"><ZoneAnalyticsScreen zoneId={currentZoneId} /></ScreenErrorBoundary>;
}

export function ZoneBookingsCalendarScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ScreenErrorBoundary screenName="ZoneBookingsCalendarScreen"><ZoneBookingsCalendarScreen zoneId={currentZoneId} /></ScreenErrorBoundary>;
}

export function ZoneEventsScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ScreenErrorBoundary screenName="ZoneEventsScreen"><ZoneEventsScreen zoneId={currentZoneId} /></ScreenErrorBoundary>;
}

export function ZoneProductsScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ScreenErrorBoundary screenName="ZoneProductsScreen"><ZoneProductsScreen zoneId={currentZoneId} /></ScreenErrorBoundary>;
}

export function ZoneDocumentsScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ScreenErrorBoundary screenName="ZoneDocumentsScreen"><ZoneDocumentsScreen /></ScreenErrorBoundary>;
}

export function ZoneResourcesScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ScreenErrorBoundary screenName="ZoneResourcesScreen"><ResourcesScreen zoneId={currentZoneId} /></ScreenErrorBoundary>;
}
