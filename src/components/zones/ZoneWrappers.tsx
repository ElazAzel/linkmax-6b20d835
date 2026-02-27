import { lazy } from 'react';
import { useZoneContext } from '@/contexts/ZoneContext';

// Lazy load zone screens
const ZoneDashboard = lazy(() => import('./ZoneDashboard').then(m => ({ default: m.ZoneDashboard })));
const ZoneDealsScreen = lazy(() => import('./ZoneDealsScreen').then(m => ({ default: m.ZoneDealsScreen })));
const ZoneContactsScreen = lazy(() => import('./ZoneContactsScreen').then(m => ({ default: m.ZoneContactsScreen })));
const ZoneInboxScreen = lazy(() => import('./ZoneInboxScreen').then(m => ({ default: m.ZoneInboxScreen })));
const ZoneTasksScreen = lazy(() => import('./ZoneTasksScreen').then(m => ({ default: m.ZoneTasksScreen })));
const ZoneSettingsScreen = lazy(() => import('./ZoneSettingsScreen').then(m => ({ default: m.ZoneSettingsScreen })));
const ZoneAutomationsScreen = lazy(() => import('./ZoneAutomationsScreen').then(m => ({ default: m.ZoneAutomationsScreen })));
const ZoneInvoicesScreen = lazy(() => import('./ZoneInvoicesScreen').then(m => ({ default: m.ZoneInvoicesScreen })));

/** Zone screen wrappers that read ZoneContext */
export function ZoneDashboardWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <div className="p-6 text-center text-muted-foreground">Выберите или создайте зону</div>;
    return <ZoneDashboard zoneId={currentZoneId} />;
}

export function ZoneDealsScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <div className="p-6 text-center text-muted-foreground">Выберите или создайте зону</div>;
    return <ZoneDealsScreen zoneId={currentZoneId} />;
}

export function ZoneContactsScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <div className="p-6 text-center text-muted-foreground">Выберите или создайте зону</div>;
    return <ZoneContactsScreen zoneId={currentZoneId} />;
}

export function ZoneInboxScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <div className="p-6 text-center text-muted-foreground">Выберите или создайте зону</div>;
    return <ZoneInboxScreen zoneId={currentZoneId} />;
}

export function ZoneTasksScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <div className="p-6 text-center text-muted-foreground">Выберите или создайте зону</div>;
    return <ZoneTasksScreen zoneId={currentZoneId} />;
}

export function ZoneSettingsScreenWrapper() {
    const { currentZone, members, myRole, refetch } = useZoneContext();
    if (!currentZone) return <div className="p-6 text-center text-muted-foreground">Выберите или создайте зону</div>;
    return <ZoneSettingsScreen zone={currentZone} members={members} myRole={myRole} onRefetch={refetch} />;
}

export function ZoneAutomationsScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <div className="p-6 text-center text-muted-foreground">Выберите или создайте зону</div>;
    return <ZoneAutomationsScreen zoneId={currentZoneId} />;
}

export function ZoneInvoicesScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <div className="p-6 text-center text-muted-foreground">Выберите или создайте зону</div>;
    return <ZoneInvoicesScreen zoneId={currentZoneId} />;
}
