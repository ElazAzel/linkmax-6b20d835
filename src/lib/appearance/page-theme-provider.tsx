import type { ReactNode } from 'react';
import type { PageThemeScope } from './style-utils';
import { PageThemeContext } from './page-theme-context';

export function PageThemeProvider({ scope, children }: { scope: PageThemeScope; children: ReactNode }) {
  return <PageThemeContext.Provider value={scope}>{children}</PageThemeContext.Provider>;
}
