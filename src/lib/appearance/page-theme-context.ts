import { createContext, useContext, type CSSProperties } from 'react';
import type { PageThemeScope } from './style-utils';

// React context follows portals; inherited DOM variables do not.
export const PageThemeContext = createContext<PageThemeScope | null>(null);

/** Cabinet overlays retain their app theme when outside the page provider. */
export function usePageThemePortalProps(style?: CSSProperties) {
  const scope = useContext(PageThemeContext);
  return {
    className: scope?.className,
    style: scope ? { ...scope.style, color: 'hsl(var(--foreground))', ...style } : style,
  };
}
