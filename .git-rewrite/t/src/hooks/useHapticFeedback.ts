import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' | 'selection' | 'impact';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  error: [50, 100, 50],
  warning: [30, 50, 30],
  selection: 5,
  impact: [20, 30],
};

export function useHapticFeedback() {
  const vibrate = useCallback((pattern: HapticPattern = 'medium') => {
    // Check if Vibration API is supported
    if (!navigator.vibrate) {
      return false;
    }

    try {
      navigator.vibrate(patterns[pattern]);
      return true;
    } catch (error) {
      // Silently fail - haptic feedback is not critical
      return false;
    }
  }, []);

  const lightTap = useCallback(() => vibrate('light'), [vibrate]);
  const mediumTap = useCallback(() => vibrate('medium'), [vibrate]);
  const heavyTap = useCallback(() => vibrate('heavy'), [vibrate]);
  const success = useCallback(() => vibrate('success'), [vibrate]);
  const error = useCallback(() => vibrate('error'), [vibrate]);
  const warning = useCallback(() => vibrate('warning'), [vibrate]);
  const selection = useCallback(() => vibrate('selection'), [vibrate]);
  const impact = useCallback(() => vibrate('impact'), [vibrate]);

  return {
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    success,
    error,
    warning,
    selection,
    impact,
    isSupported: typeof navigator !== 'undefined' && 'vibrate' in navigator,
  };
}
