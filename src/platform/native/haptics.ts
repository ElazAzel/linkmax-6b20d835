/**
 * Native haptics wrapper.
 * Safe in web: gracefully no-ops if Capacitor / plugin unavailable.
 * Also falls back to navigator.vibrate on Android browsers.
 */
import { Capacitor } from '@capacitor/core';

type Intensity = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

let cachedHaptics: typeof import('@capacitor/haptics') | null | undefined;

async function loadHaptics() {
  if (cachedHaptics !== undefined) return cachedHaptics;
  try {
    cachedHaptics = await import('@capacitor/haptics');
  } catch {
    cachedHaptics = null;
  }
  return cachedHaptics;
}

const webVibrate = (pattern: number | number[]) => {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      (navigator.vibrate as (p: number | number[]) => boolean)(pattern);
    }
  } catch {
    /* noop */
  }
};

export async function haptic(intensity: Intensity = 'light'): Promise<void> {
  const isNative = Capacitor?.isNativePlatform?.() ?? false;

  if (!isNative) {
    // Web fallback (Android Chrome): short vibration only
    switch (intensity) {
      case 'heavy': return webVibrate(25);
      case 'medium': return webVibrate(15);
      case 'success': return webVibrate(20);
      case 'warning': return webVibrate(30);
      case 'error': return webVibrate([20, 40, 20]);
      case 'selection': return webVibrate(5);
      case 'light':
      default: return webVibrate(10);
    }
  }

  const mod = await loadHaptics();
  if (!mod) return;
  const { Haptics, ImpactStyle, NotificationType } = mod;

  try {
    switch (intensity) {
      case 'heavy':
        await Haptics.impact({ style: ImpactStyle.Heavy });
        return;
      case 'medium':
        await Haptics.impact({ style: ImpactStyle.Medium });
        return;
      case 'success':
        await Haptics.notification({ type: NotificationType.Success });
        return;
      case 'warning':
        await Haptics.notification({ type: NotificationType.Warning });
        return;
      case 'error':
        await Haptics.notification({ type: NotificationType.Error });
        return;
      case 'selection':
        await Haptics.selectionStart();
        await Haptics.selectionEnd();
        return;
      case 'light':
      default:
        await Haptics.impact({ style: ImpactStyle.Light });
        return;
    }
  } catch {
    /* noop */
  }
}

// Convenience shortcuts
export const hapticLight = () => haptic('light');
export const hapticMedium = () => haptic('medium');
export const hapticSelection = () => haptic('selection');
export const hapticSuccess = () => haptic('success');
export const hapticError = () => haptic('error');
