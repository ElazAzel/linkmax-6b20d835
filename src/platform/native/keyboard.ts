/**
 * Capacitor Keyboard helper.
 * - On native iOS/Android: configures resize mode and smooth scroll-into-view
 *   when keyboard opens (so inputs / textareas aren't hidden).
 * - On web: no-op.
 */
import { Capacitor } from '@capacitor/core';

let installed = false;

export async function installKeyboardHandlers(): Promise<void> {
  if (installed) return;
  installed = true;

  if (!Capacitor?.isNativePlatform?.()) return;

  try {
    const { Keyboard, KeyboardResize } = await import('@capacitor/keyboard');

    // Body resize keeps layout natural; inputs stay above the keyboard.
    await Keyboard.setResizeMode({ mode: KeyboardResize.Body }).catch(() => {});
    await Keyboard.setScroll({ isDisabled: false }).catch(() => {});

    Keyboard.addListener('keyboardWillShow', (info) => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return;
      const isField =
        el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.getAttribute('contenteditable') === 'true';
      if (!isField) return;

      const rect = el.getBoundingClientRect();
      const visibleHeight = window.innerHeight - (info?.keyboardHeight ?? 0);
      if (rect.bottom > visibleHeight - 16) {
        const delta = rect.bottom - (visibleHeight - 24);
        window.scrollBy({ top: delta, behavior: 'smooth' });
      }
    });

    Keyboard.addListener('keyboardDidHide', () => {
      // Optional: snap scroll back if needed; left default so the user's
      // position remains where they last were.
    });
  } catch {
    /* plugin unavailable — ignore */
  }
}
