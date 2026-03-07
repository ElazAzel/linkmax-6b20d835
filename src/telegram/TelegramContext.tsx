import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
    type ReactNode,
} from 'react';
import type {
    TelegramWebApp,
    TelegramUser,
    ThemeParams,
    BottomButtonConfig,
    TelegramAuthResult,
    DeepLinkRoute,
    TelegramScreen,
} from './types';
import { supabase } from '@/platform/supabase/client';

// ---- Deep-link parser ----

export function parseStartParam(startParam?: string): DeepLinkRoute {
    if (!startParam) return { screen: 'home' };

    const param = startParam.toLowerCase();

    // Entity deep links: lead_<id>, deal_<id>
    if (param.startsWith('lead_')) {
        return { screen: 'lead_detail', entityId: startParam.slice(5) };
    }
    if (param.startsWith('deal_')) {
        return { screen: 'deal_detail', entityId: startParam.slice(5) };
    }
    if (param.startsWith('ref_')) {
        return { screen: 'home', params: { ref: startParam.slice(4) } };
    }

    // Screen deep links
    const screenMap: Record<string, TelegramScreen> = {
        home: 'home',
        page: 'page',
        crm: 'crm',
        leads: 'crm',
        bookings: 'bookings',
        calendar: 'bookings',
        pay: 'payments',
        billing: 'payments',
        payments: 'payments',
        settings: 'settings',
        onboarding: 'onboarding',
    };

    return { screen: screenMap[param] || 'home' };
}

// ---- Context ----

interface TelegramContextValue {
    // State
    webApp: TelegramWebApp | null;
    user: TelegramAuthResult['user'] | null;
    initData: string | null;
    startParam: string | undefined;
    route: DeepLinkRoute;
    isReady: boolean;
    isTelegram: boolean;
    isLoading: boolean;
    error: string | null;
    platform: string;
    colorScheme: 'light' | 'dark';
    themeParams: ThemeParams;

    // Navigation
    setScreen: (screen: TelegramScreen, entityId?: string) => void;
    goBack: () => void;

    // Telegram API wrappers
    haptic: (
        type: 'impact' | 'notification' | 'selection',
        style?: string
    ) => void;
    showBackButton: (show: boolean) => void;
    setBottomButton: (config: BottomButtonConfig | null) => void;
    close: () => void;
    expand: () => void;
    requestFullscreen: () => void;
}

const TelegramContext = createContext<TelegramContextValue | null>(null);

// ---- Provider ----

interface TelegramProviderProps {
    children: ReactNode;
}

export function TelegramProvider({ children }: TelegramProviderProps) {
    const [webApp, setWebApp] = useState<TelegramWebApp | null>(null);
    const [user, setUser] = useState<TelegramAuthResult['user'] | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [route, setRoute] = useState<DeepLinkRoute>({ screen: 'loading' });
    const screenHistoryRef = useRef<TelegramScreen[]>([]);
    const backButtonCbRef = useRef<(() => void) | null>(null);
    const mainButtonCbRef = useRef<(() => void) | null>(null);

    const isTelegram = !!webApp;
    const initData = webApp?.initData || null;
    const startParam = webApp?.initDataUnsafe?.start_param;
    const platform = webApp?.platform || 'unknown';
    const colorScheme = webApp?.colorScheme || 'light';
    const themeParams = webApp?.themeParams || {};

    // ---- Initialize Telegram WebApp ----
    useEffect(() => {
        const tg = window.Telegram?.WebApp;

        if (!tg) {
            console.warn('Telegram WebApp SDK not available — running outside Telegram');
            setIsLoading(false);
            setError('not_in_telegram');
            setRoute({ screen: 'error' });
            return;
        }

        // Call ready() to signal the app is loaded
        tg.ready();
        tg.expand();

        setWebApp(tg);

        // Apply safe area CSS variables
        applySafeArea(tg);

        // Listen for theme changes
        tg.onEvent('themeChanged', () => {
            applyThemeColors(tg);
        });

        // Listen for safe area changes
        tg.onEvent('safeAreaChanged', () => applySafeArea(tg));
        tg.onEvent('contentSafeAreaChanged', () => applySafeArea(tg));

        // Validate initData on server
        validateAuth(tg);

        return () => {
            // Cleanup
            if (backButtonCbRef.current) {
                tg.BackButton.offClick(backButtonCbRef.current);
            }
            if (mainButtonCbRef.current) {
                tg.MainButton.offClick(mainButtonCbRef.current);
            }
        };
    }, []);

    // ---- Validate authentication ----
    async function validateAuth(tg: TelegramWebApp) {
        try {
            setIsLoading(true);

            const { data, error: invokeError } = await supabase.functions.invoke(
                'validate-telegram-miniapp',
                { body: { initData: tg.initData } }
            );

            if (invokeError) {
                throw new Error(invokeError.message || 'Validation failed');
            }

            if (!data?.valid) {
                throw new Error(data?.error || 'Invalid initData');
            }

            if (data.session) {
                const { error: setSessionError } = await supabase.auth.setSession({
                    access_token: data.session.access_token,
                    refresh_token: data.session.refresh_token,
                });

                if (setSessionError) {
                    console.error('[TelegramApp] Failed to set session:', setSessionError);
                }
            }

            setUser(data.user);
            setIsReady(true);

            // Parse deep link route
            const parsedRoute = parseStartParam(
                tg.initDataUnsafe?.start_param
            );
            setRoute(parsedRoute);
            screenHistoryRef.current = [parsedRoute.screen];

            console.log(
                `[TelegramApp] Authenticated: ${data.user.first_name} (${data.user.telegram_user_id}), screen: ${parsedRoute.screen}`
            );
        } catch (err: any) {
            console.error('[TelegramApp] Auth failed:', err);
            setError(err.message);
            setRoute({ screen: 'error' });
        } finally {
            setIsLoading(false);
        }
    }

    // ---- Navigation ----
    const setScreen = useCallback(
        (screen: TelegramScreen, entityId?: string) => {
            screenHistoryRef.current.push(screen);
            setRoute({ screen, entityId });

            // Show BackButton if we have history
            if (webApp && screenHistoryRef.current.length > 1) {
                webApp.BackButton.show();
            }
        },
        [webApp]
    );

    const goBack = useCallback(() => {
        if (screenHistoryRef.current.length > 1) {
            screenHistoryRef.current.pop();
            const prev =
                screenHistoryRef.current[screenHistoryRef.current.length - 1];
            setRoute({ screen: prev });

            // Hide BackButton if at root
            if (screenHistoryRef.current.length <= 1 && webApp) {
                webApp.BackButton.hide();
            }
        } else {
            webApp?.close();
        }
    }, [webApp]);

    // Setup BackButton handler
    useEffect(() => {
        if (!webApp) return;

        // Cleanup previous handler
        if (backButtonCbRef.current) {
            webApp.BackButton.offClick(backButtonCbRef.current);
        }

        backButtonCbRef.current = goBack;
        webApp.BackButton.onClick(goBack);
    }, [webApp, goBack]);

    // ---- Haptic feedback ----
    const haptic = useCallback(
        (type: 'impact' | 'notification' | 'selection', style?: string) => {
            if (!webApp) return;
            try {
                if (type === 'impact') {
                    webApp.HapticFeedback.impactOccurred(
                        (style as any) || 'medium'
                    );
                } else if (type === 'notification') {
                    webApp.HapticFeedback.notificationOccurred(
                        (style as any) || 'success'
                    );
                } else {
                    webApp.HapticFeedback.selectionChanged();
                }
            } catch {
                // Haptic may not be available on all platforms
            }
        },
        [webApp]
    );

    // ---- BackButton visibility ----
    const showBackButton = useCallback(
        (show: boolean) => {
            if (!webApp) return;
            show ? webApp.BackButton.show() : webApp.BackButton.hide();
        },
        [webApp]
    );

    // ---- BottomButton (MainButton) ----
    const setBottomButton = useCallback(
        (config: BottomButtonConfig | null) => {
            if (!webApp) return;

            // Cleanup existing handler
            if (mainButtonCbRef.current) {
                webApp.MainButton.offClick(mainButtonCbRef.current);
                mainButtonCbRef.current = null;
            }

            if (!config) {
                webApp.MainButton.hide();
                return;
            }

            webApp.MainButton.setParams({
                text: config.text,
                color: config.color,
                text_color: config.textColor,
                is_active: config.isActive !== false,
                is_visible: true,
                has_shine_effect: config.hasShineEffect,
            });

            mainButtonCbRef.current = config.onClick;
            webApp.MainButton.onClick(config.onClick);
            webApp.MainButton.show();

            if (config.showProgress) {
                webApp.MainButton.showProgress(false);
            }
        },
        [webApp]
    );

    // ---- Lifecycle ----
    const close = useCallback(() => webApp?.close(), [webApp]);
    const expand = useCallback(() => webApp?.expand(), [webApp]);
    const requestFullscreen = useCallback(() => {
        try {
            webApp?.requestFullscreen();
        } catch {
            // May not be supported
        }
    }, [webApp]);

    const value: TelegramContextValue = {
        webApp,
        user,
        initData,
        startParam,
        route,
        isReady,
        isTelegram,
        isLoading,
        error,
        platform,
        colorScheme,
        themeParams,
        setScreen,
        goBack,
        haptic,
        showBackButton,
        setBottomButton,
        close,
        expand,
        requestFullscreen,
    };

    return (
        <TelegramContext.Provider value={value}>
            {children}
        </TelegramContext.Provider>
    );
}

// ---- Hook ----

export function useTelegram(): TelegramContextValue {
    const context = useContext(TelegramContext);
    if (!context) {
        throw new Error('useTelegram must be used within a TelegramProvider');
    }
    return context;
}

// ---- CSS Helpers ----

function applySafeArea(tg: TelegramWebApp) {
    const root = document.documentElement;
    if (tg.safeAreaInset) {
        root.style.setProperty('--tg-safe-area-top', `${tg.safeAreaInset.top}px`);
        root.style.setProperty('--tg-safe-area-bottom', `${tg.safeAreaInset.bottom}px`);
        root.style.setProperty('--tg-safe-area-left', `${tg.safeAreaInset.left}px`);
        root.style.setProperty('--tg-safe-area-right', `${tg.safeAreaInset.right}px`);
    }
    if (tg.contentSafeAreaInset) {
        root.style.setProperty('--tg-content-safe-top', `${tg.contentSafeAreaInset.top}px`);
        root.style.setProperty('--tg-content-safe-bottom', `${tg.contentSafeAreaInset.bottom}px`);
    }
}

function applyThemeColors(tg: TelegramWebApp) {
    const root = document.documentElement;
    const tp = tg.themeParams;

    if (tp.bg_color) root.style.setProperty('--tg-bg-color', tp.bg_color);
    if (tp.text_color) root.style.setProperty('--tg-text-color', tp.text_color);
    if (tp.hint_color) root.style.setProperty('--tg-hint-color', tp.hint_color);
    if (tp.link_color) root.style.setProperty('--tg-link-color', tp.link_color);
    if (tp.button_color) root.style.setProperty('--tg-button-color', tp.button_color);
    if (tp.button_text_color) root.style.setProperty('--tg-button-text-color', tp.button_text_color);
    if (tp.secondary_bg_color) root.style.setProperty('--tg-secondary-bg-color', tp.secondary_bg_color);
    if (tp.header_bg_color) root.style.setProperty('--tg-header-bg-color', tp.header_bg_color);
    if (tp.accent_text_color) root.style.setProperty('--tg-accent-text-color', tp.accent_text_color);
    if (tp.section_bg_color) root.style.setProperty('--tg-section-bg-color', tp.section_bg_color);
    if (tp.destructive_text_color) root.style.setProperty('--tg-destructive-text-color', tp.destructive_text_color);
}
