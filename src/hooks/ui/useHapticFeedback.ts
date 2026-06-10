import { useCallback, useMemo } from 'react';
import {
  hapticLight,
  hapticMedium,
  hapticHeavy,
  hapticSuccess,
  hapticError,
  hapticWarning,
  hapticSelection,
} from '@/platform/native/haptics';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection' | 'impact';

/**
 * Unified haptics hook — routes through the native bridge (@capacitor/haptics
 * on iOS/Android) and falls back to navigator.vibrate on web.
 */
export function useHapticFeedback() {
  const vibrate = useCallback((pattern: HapticPattern = 'medium') => {
    switch (pattern) {
      case 'light':
      case 'selection':
        (pattern === 'selection' ? hapticSelection : hapticLight)();
        return true;
      case 'medium':
      case 'impact':
        hapticMedium();
        return true;
      case 'heavy':
        hapticHeavy();
        return true;
      case 'success':
        hapticSuccess();
        return true;
      case 'error':
        hapticError();
        return true;
      case 'warning':
        hapticWarning();
        return true;
      default:
        hapticMedium();
        return true;
    }
  }, []);

  return useMemo(() => ({
    vibrate,
    lightTap: () => hapticLight(),
    mediumTap: () => hapticMedium(),
    heavyTap: () => hapticHeavy(),
    success: () => hapticSuccess(),
    error: () => hapticError(),
    warning: () => hapticWarning(),
    selection: () => hapticSelection(),
    impact: () => hapticMedium(),
    isSupported: true,
  }), [vibrate]);
}
