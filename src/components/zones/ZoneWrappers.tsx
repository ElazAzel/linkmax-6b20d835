import { lazy } from 'react';
import { useTranslation } from 'react-i18next';
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
const ZoneAnalyticsScreen = lazy(() => import('./ZoneAnalyticsScreen').then(m => ({ default: m.ZoneAnalyticsScreen })));
const ZoneBookingsCalendarScreen = lazy(() => import('./ZoneBookingsCalendarScreen').then(m => ({ default: m.ZoneBookingsCalendarScreen })));
const ZoneEventsScreen = lazy(() => import('./ZoneEventsScreen').then(m => ({ default: m.ZoneEventsScreen })));
const ZoneProductsScreen = lazy(() => import('./ZoneProductsScreen').then(m => ({ default: m.ZoneProductsScreen })));
const ZoneDocumentsScreen = lazy(() => import('./documents/ZoneDocumentsScreen').then(m => ({ default: m.ZoneDocumentsScreen })));
const ResourcesScreen = lazy(() => import('@/components/dashboard-v2/screens/ResourcesScreen').then(m => ({ default: m.ResourcesScreen })));

function NoZone() {
    const { t } = useTranslation();
    return <div className="p-6 text-center text-muted-foreground">{t('zones.selectOrCreate', 'Выберите или создайте зону')}</div>;
}

/** Zone screen wrappers that read ZoneContext */
export function ZoneDashboardWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ZoneDashboard zoneId={currentZoneId} />;
}

export function ZoneDealsScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ZoneDealsScreen zoneId={currentZoneId} />;
}

export function ZoneContactsScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ZoneContactsScreen zoneId={currentZoneId} />;
}

export function ZoneInboxScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ZoneInboxScreen zoneId={currentZoneId} />;
}

export function ZoneTasksScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ZoneTasksScreen zoneId={currentZoneId} />;
}

export function ZoneSettingsScreenWrapper() {
    const { currentZone, members, myRole, refetch } = useZoneContext();
    if (!currentZone) return <NoZone />;
    return <ZoneSettingsScreen zone={currentZone} members={members} myRole={myRole} onRefetch={refetch} />;
}

export function ZoneAutomationsScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ZoneAutomationsScreen zoneId={currentZoneId} />;
}

export function ZoneInvoicesScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ZoneInvoicesScreen zoneId={currentZoneId} />;
}

export function ZoneAnalyticsScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ZoneAnalyticsScreen zoneId={currentZoneId} />;
}

export function ZoneBookingsCalendarScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ZoneBookingsCalendarScreen zoneId={currentZoneId} />;
}

export function ZoneEventsScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ZoneEventsScreen zoneId={currentZoneId} />;
}

export function ZoneProductsScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ZoneProductsScreen zoneId={currentZoneId} />;
}

export function ZoneDocumentsScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ZoneDocumentsScreen />;
}

export function ZoneResourcesScreenWrapper() {
    const { currentZoneId } = useZoneContext();
    if (!currentZoneId) return <NoZone />;
    return <ResourcesScreen zoneId={currentZoneId} />;
}
