/**
 * TypeScript definitions for Telegram Mini Apps WebApp API
 * Based on https://core.telegram.org/bots/webapps#initializing-mini-apps
 */

// ---- User & Chat ----

export interface TelegramUser {
    id: number;
    is_bot?: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
    allows_write_to_pm?: boolean;
    added_to_attachment_menu?: boolean;
    photo_url?: string;
}

export interface TelegramChat {
    id: number;
    type: 'group' | 'supergroup' | 'channel';
    title: string;
    username?: string;
    photo_url?: string;
}

// ---- Theme ----

export interface ThemeParams {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
    header_bg_color?: string;
    bottom_bar_bg_color?: string;
    accent_text_color?: string;
    section_bg_color?: string;
    section_header_text_color?: string;
    section_separator_color?: string;
    subtitle_text_color?: string;
    destructive_text_color?: string;
}

// ---- Safe Area ----

export interface SafeAreaInset {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

export interface ContentSafeAreaInset {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

// ---- Buttons ----

export interface BottomButton {
    type: 'main' | 'secondary';
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    hasShineEffect: boolean;
    position: 'left' | 'right' | 'top' | 'bottom';
    isProgressVisible: boolean;
    setText: (text: string) => BottomButton;
    onClick: (callback: () => void) => BottomButton;
    offClick: (callback: () => void) => BottomButton;
    show: () => BottomButton;
    hide: () => BottomButton;
    enable: () => BottomButton;
    disable: () => BottomButton;
    showProgress: (leaveActive?: boolean) => BottomButton;
    hideProgress: () => BottomButton;
    setParams: (params: Partial<BottomButtonParams>) => BottomButton;
}

export interface BottomButtonParams {
    text?: string;
    color?: string;
    text_color?: string;
    has_shine_effect?: boolean;
    position?: 'left' | 'right' | 'top' | 'bottom';
    is_active?: boolean;
    is_visible?: boolean;
}

export interface BackButton {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
}

export interface SettingsButton {
    isVisible: boolean;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
}

// ---- Haptic Feedback ----

export interface HapticFeedback {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => HapticFeedback;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => HapticFeedback;
    selectionChanged: () => HapticFeedback;
}

// ---- Popups ----

export interface PopupParams {
    title?: string;
    message: string;
    buttons?: PopupButton[];
}

export interface PopupButton {
    id?: string;
    type?: 'default' | 'ok' | 'close' | 'cancel' | 'destructive';
    text?: string;
}

// ---- WebApp ----

export interface TelegramWebApp {
    // Init
    initData: string;
    initDataUnsafe: {
        query_id?: string;
        user?: TelegramUser;
        receiver?: TelegramUser;
        chat?: TelegramChat;
        chat_type?: string;
        chat_instance?: string;
        start_param?: string;
        can_send_after?: number;
        auth_date: number;
        hash: string;
    };
    version: string;
    platform: string;
    colorScheme: 'light' | 'dark';
    themeParams: ThemeParams;
    isExpanded: boolean;
    viewportHeight: number;
    viewportStableHeight: number;
    headerColor: string;
    backgroundColor: string;
    bottomBarColor: string;
    isClosingConfirmationEnabled: boolean;
    isVerticalSwipesEnabled: boolean;
    isFullscreen: boolean;
    isOrientationLocked: boolean;
    isActive: boolean;

    // Safe Area
    safeAreaInset: SafeAreaInset;
    contentSafeAreaInset: ContentSafeAreaInset;

    // Buttons
    BackButton: BackButton;
    MainButton: BottomButton;
    SecondaryButton: BottomButton;
    SettingsButton: SettingsButton;

    // Haptic
    HapticFeedback: HapticFeedback;

    // Methods
    isVersionAtLeast: (version: string) => boolean;
    setHeaderColor: (color: string) => void;
    setBackgroundColor: (color: string) => void;
    setBottomBarColor: (color: string) => void;
    enableClosingConfirmation: () => void;
    disableClosingConfirmation: () => void;
    enableVerticalSwipes: () => void;
    disableVerticalSwipes: () => void;
    requestFullscreen: () => void;
    exitFullscreen: () => void;
    lockOrientation: () => void;
    unlockOrientation: () => void;
    addToHomeScreen: () => void;
    checkHomeScreenStatus: (callback: (status: string) => void) => void;

    // Popups & Actions
    showPopup: (params: PopupParams, callback?: (buttonId: string) => void) => void;
    showAlert: (message: string, callback?: () => void) => void;
    showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
    showScanQrPopup: (params: { text?: string }, callback?: (data: string) => boolean) => void;
    closeScanQrPopup: () => void;
    readTextFromClipboard: (callback?: (text: string | null) => void) => void;
    requestWriteAccess: (callback?: (granted: boolean) => void) => void;
    requestContact: (callback?: (granted: boolean) => void) => void;
    shareToStory: (mediaUrl: string, params?: { text?: string; widget_link?: { url: string; name?: string } }) => void;
    shareMessage: (msgId: string, callback?: (shared: boolean) => void) => void;

    // Navigation
    switchInlineQuery: (query: string, chooseChatTypes?: string[]) => void;
    openLink: (url: string, options?: { try_instant_view?: boolean; try_browser?: string }) => void;
    openTelegramLink: (url: string) => void;
    openInvoice: (url: string, callback?: (status: string) => void) => void;

    // Lifecycle
    ready: () => void;
    expand: () => void;
    close: () => void;
    sendData: (data: string) => void;

    // Events
    onEvent: (eventType: string, callback: (...args: any[]) => void) => void;
    offEvent: (eventType: string, callback: (...args: any[]) => void) => void;
}

// ---- Window augmentation ----

declare global {
    interface Window {
        Telegram?: {
            WebApp: TelegramWebApp;
        };
    }
}

// ---- Config types for our app ----

export interface BottomButtonConfig {
    text: string;
    color?: string;
    textColor?: string;
    isActive?: boolean;
    hasShineEffect?: boolean;
    showProgress?: boolean;
    onClick: () => void;
}

export interface TelegramAuthResult {
    valid: boolean;
    user?: {
        id: string;
        telegram_user_id: number;
        username?: string;
        first_name: string;
        last_name?: string;
        language_code?: string;
        is_premium?: boolean;
    };
    start_param?: string;
    launch_source?: string;
    magic_link?: {
        token_hash: string;
        redirect_to: string;
    } | null;
    error?: string;
}

/** Screen name type for deep-link routing */
export type TelegramScreen =
    | 'home'
    | 'page'
    | 'crm'
    | 'bookings'
    | 'payments'
    | 'settings'
    | 'onboarding'
    | 'lead_detail'
    | 'deal_detail'
    | 'loading'
    | 'error';

export interface DeepLinkRoute {
    screen: TelegramScreen;
    entityId?: string;
    params?: Record<string, string>;
}
