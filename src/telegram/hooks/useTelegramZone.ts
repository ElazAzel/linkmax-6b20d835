import { useEffect, useState, useMemo } from 'react';
import { useZones } from '@/hooks/zones/useZones';
import { useTelegram } from '../TelegramContext';

/**
 * Hook for managing the current zone within the Telegram Mini App.
 * Automatically selects a zone if multiple exist, or triggers onboarding if none.
 */
export function useTelegramZone() {
    const { setScreen, route } = useTelegram();
    const { zones, currentZoneId, setCurrentZoneId, currentZone, loading } = useZones();
    const [isInitializing, setIsInitializing] = useState(true);

    // Auto-selection and onboarding logic
    useEffect(() => {
        if (loading) return;

        if (zones.length === 0) {
            // No zones found, redirect to onboarding if not already there
            if (route.screen !== 'onboarding' && route.screen !== 'loading') {
                setScreen('onboarding');
            }
        } else if (!currentZoneId && zones.length > 0) {
            // Zones exist but none selected, pick the first one
            setCurrentZoneId(zones[0].id);
        }

        setIsInitializing(false);
    }, [zones, loading, currentZoneId, setCurrentZoneId, setScreen, route.screen]);

    return {
        zone: currentZone,
        zoneId: currentZoneId,
        zones,
        isLoading: loading || isInitializing,
        setZone: setCurrentZoneId,
    };
}
