import React from 'react';
import { TelegramProvider } from './TelegramContext';
import { TelegramRouter, BottomNavigation } from './TelegramRouter';
import './TelegramTheme.css';

/**
 * Root component for the Telegram Mini App.
 * This is the equivalent of App.tsx but optimized for Telegram:
 * - No PWA prompts, Cookie consent, Sentry
 * - Telegram-specific theme and safe area
 * - Lighter provider stack
 */
export default function TelegramApp() {
    return (
        <TelegramProvider>
            <div className="telegram-app">
                <TelegramRouter />
                <BottomNavigation />
            </div>
        </TelegramProvider>
    );
}
