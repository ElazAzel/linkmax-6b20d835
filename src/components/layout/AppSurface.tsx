import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isAppSurfacePath } from '@/design-system/surface';

/**
 * Switches <html> between the LinkMAX interface tokens (`lm-app`) and the
 * frozen page tokens used by pages built by users. It lives on <html> so
 * Radix portals (dialogs, sheets, popovers) get the same tokens as the screen.
 */
export function AppSurface() {
  const { pathname } = useLocation();
  const isApp = isAppSurfacePath(pathname);

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('lm-app', isApp);
  }, [isApp]);

  return null;
}
