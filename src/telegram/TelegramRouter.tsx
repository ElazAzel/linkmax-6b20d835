import { useTelegram } from './TelegramContext';
import { useTelegramZone } from './hooks/useTelegramZone';
import { useZoneAnalytics } from '@/hooks/zones/useZoneAnalytics';
import { CRMScreen } from './screens/CRMScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { BookingsScreen } from './screens/BookingsScreen';
import { PageEditorScreen } from './screens/PageEditorScreen';
import type { TelegramScreen } from './types';

// ---- Icons (inline SVG for zero-dep bottom nav) ----

const HomeIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const PageIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
);

const LeadsIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
);

const CalendarIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

const MoreIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
    </svg>
);

// ---- Loading Screen ----

function LoadingScreen() {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: 16,
        }}>
            <div className="tg-spinner" />
            <p className="tg-text-hint" style={{ fontSize: 14 }}>Загрузка LinkMAX...</p>
        </div>
    );
}

// ---- Error Screen ----

function ErrorScreen({ error }: { error: string | null }) {
    const isNotInTelegram = error === 'not_in_telegram';

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 32,
            textAlign: 'center',
            gap: 16,
        }}>
            <div style={{ fontSize: 48 }}>{isNotInTelegram ? '📱' : '⚠️'}</div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>
                {isNotInTelegram
                    ? 'Откройте в Telegram'
                    : 'Ошибка загрузки'}
            </h2>
            <p className="tg-text-hint" style={{ fontSize: 15, maxWidth: 280 }}>
                {isNotInTelegram
                    ? 'Это приложение работает только внутри Telegram. Откройте @linkmaxmy_bot и нажмите "Launch App".'
                    : error || 'Что-то пошло не так. Попробуйте перезапустить приложение.'}
            </p>
            {isNotInTelegram && (
                <a
                    href="https://t.me/linkmaxmy_bot"
                    className="tg-button"
                    style={{ maxWidth: 280, textDecoration: 'none' }}
                >
                    Открыть в Telegram
                </a>
            )}
        </div>
    );
}

// ---- Home Screen ----

function HomeScreen() {
    const { user, haptic, setScreen } = useTelegram();
    const { zoneId } = useTelegramZone();
    const { metrics, loading } = useZoneAnalytics(zoneId);

    const quickActions = [
        {
            icon: '📄',
            bg: 'var(--tg-theme-secondary-bg-color)',
            title: 'Моя страница',
            desc: 'Редактировать и опубликовать',
            screen: 'page' as TelegramScreen,
        },
        {
            icon: '📩',
            bg: 'var(--tg-theme-secondary-bg-color)',
            title: 'Лиды',
            desc: 'Входящие заявки',
            screen: 'crm' as TelegramScreen,
        },
        {
            icon: '📅',
            bg: 'var(--tg-theme-secondary-bg-color)',
            title: 'Бронирования',
            desc: 'Записи и расписание',
            screen: 'bookings' as TelegramScreen,
        },
        {
            icon: '💳',
            bg: 'var(--tg-theme-secondary-bg-color)',
            title: 'Платежи',
            desc: 'Инвойсы и тариф',
            screen: 'payments' as TelegramScreen,
        },
    ];

    return (
        <div className="tg-screen tg-fade-in">
            {/* Greeting */}
            <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0 }}>
                    Привет, {user?.first_name || 'друг'} 👋
                </h1>
                <p className="tg-text-hint" style={{ fontSize: 15, marginTop: 4 }}>
                    Ваш бизнес-центр в Telegram
                </p>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <div className="tg-stat-card">
                    <span className="tg-stat-value">
                        {loading ? '...' : metrics?.deals?.open || 0}
                    </span>
                    <span className="tg-stat-label">Лиды</span>
                </div>
                <div className="tg-stat-card">
                    <span className="tg-stat-value">
                        {loading ? '...' : metrics?.tasks?.pending || 0}
                    </span>
                    <span className="tg-stat-label">Дела</span>
                </div>
                <div className="tg-stat-card">
                    <span className="tg-stat-value">
                        {loading ? '...' : (metrics?.invoices?.totalPaidAmount ? `${metrics.invoices.totalPaidAmount}₽` : '0₽')}
                    </span>
                    <span className="tg-stat-label">Выручка</span>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="tg-section">
                <div className="tg-section-header">Инструменты</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {quickActions.map((action) => (
                        <div
                            key={action.screen}
                            className="tg-quick-action"
                            onClick={() => {
                                haptic('selection');
                                setScreen(action.screen);
                            }}
                        >
                            <div
                                className="tg-quick-action-icon"
                                style={{ fontSize: 20 }}
                            >
                                {action.icon}
                            </div>
                            <div className="tg-quick-action-text">
                                <div className="tg-quick-action-title">{action.title}</div>
                                <div className="tg-quick-action-desc">{action.desc}</div>
                            </div>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.3, flexShrink: 0 }}>
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ---- Stub Screens (P1: will be replaced with full implementations) ----

function StubScreen({ title, icon }: { title: string; icon: string }) {
    const { goBack } = useTelegram();

    return (
        <div className="tg-screen tg-fade-in" style={{ textAlign: 'center', paddingTop: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{title}</h2>
            <p className="tg-text-hint" style={{ fontSize: 15 }}>
                Скоро появится в следующем обновлении
            </p>
            <button
                className="tg-button tg-button--secondary"
                style={{ maxWidth: 200, margin: '24px auto 0' }}
                onClick={goBack}
            >
                Назад
            </button>
        </div>
    );
}

// ---- Router ----

export function TelegramRouter() {
    const { route, isLoading, error } = useTelegram();
    const { isLoading: zoneLoading } = useTelegramZone();

    if (isLoading || zoneLoading || route.screen === 'loading') return <LoadingScreen />;
    if (error || route.screen === 'error') return <ErrorScreen error={error} />;

    switch (route.screen) {
        case 'home':
            return <HomeScreen />;
        case 'page':
            return <PageEditorScreen />;
        case 'crm':
            return <CRMScreen />;
        case 'bookings':
            return <BookingsScreen />;
        case 'payments':
            return <StubScreen title="Платежи" icon="💳" />;
        case 'settings':
            return <StubScreen title="Настройки" icon="⚙️" />;
        case 'onboarding':
            return <OnboardingScreen />;
        case 'lead_detail':
            return <StubScreen title={`Лид ${route.entityId || ''}`} icon="👤" />;
        case 'deal_detail':
            return <StubScreen title={`Сделка ${route.entityId || ''}`} icon="💰" />;
        default:
            return <HomeScreen />;
    }
}

// ---- Bottom Navigation ----

export function BottomNavigation() {
    const { route, setScreen, haptic } = useTelegram();
    const currentScreen = route.screen;

    const tabs: { screen: TelegramScreen; label: string; icon: React.ReactNode }[] = [
        { screen: 'home', label: 'Главная', icon: <HomeIcon /> },
        { screen: 'page', label: 'Страница', icon: <PageIcon /> },
        { screen: 'crm', label: 'Лиды', icon: <LeadsIcon /> },
        { screen: 'bookings', label: 'Записи', icon: <CalendarIcon /> },
        { screen: 'settings', label: 'Ещё', icon: <MoreIcon /> },
    ];

    return (
        <nav className="tg-bottom-nav">
            {tabs.map((tab) => (
                <div
                    key={tab.screen}
                    className={`tg-bottom-nav-item ${currentScreen === tab.screen ? 'tg-bottom-nav-item--active' : ''
                        }`}
                    onClick={() => {
                        if (currentScreen !== tab.screen) {
                            haptic('selection');
                            setScreen(tab.screen);
                        }
                    }}
                >
                    {tab.icon}
                    <span>{tab.label}</span>
                </div>
            ))}
        </nav>
    );
}
