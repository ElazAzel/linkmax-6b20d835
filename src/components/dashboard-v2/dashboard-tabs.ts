export type TabId = 'home' | 'editor' | 'pages' | 'activity' | 'insights' | 'finance' | 'monetize' | 'settings' | 'developers' | 'events' | 'leads' | 'team' | 'zone-dashboard' | 'zone-deals' | 'zone-contacts' | 'zone-inbox' | 'zone-tasks' | 'zone-automations' | 'zone-invoices' | 'zone-documents' | 'zone-calendar' | 'zone-events' | 'zone-products' | 'zone-settings' | 'zone-analytics' | 'zone-resources';

export const ZONE_TABS: TabId[] = ['zone-dashboard', 'zone-deals', 'zone-contacts', 'zone-inbox', 'zone-tasks', 'zone-automations', 'zone-invoices', 'zone-documents', 'zone-calendar', 'zone-events', 'zone-products', 'zone-settings', 'zone-analytics', 'zone-resources'];

export const ALL_TABS: TabId[] = ['home', 'editor', 'pages', 'activity', 'insights', 'finance', 'monetize', 'settings', 'developers', 'events', 'leads', 'team', ...ZONE_TABS];
