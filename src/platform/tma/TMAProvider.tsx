import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface TMAContextType {
  isTMA: boolean;
  webApp: any;
  user: any;
  theme: 'light' | 'dark';
  expand: () => void;
  close: () => void;
  setMainButton: (text: string, onClick: () => void, visible?: boolean) => void;
  hideMainButton: () => void;
}

const TMAContext = createContext<TMAContextType | undefined>(undefined);

export const TMAProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTMA, setIsTMA] = useState(false);
  const [webApp, setWebApp] = useState<any>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Access Telegram WebApp from window
    const tg = (window as any).Telegram?.WebApp;

    if (tg) {
      setIsTMA(true);
      setWebApp(tg);
      setTheme(tg.colorScheme || 'light');
      
      // Expand to full height
      tg.expand();

      // Notify Telegram that the app is ready
      tg.ready();

      // Sync theme colors to CSS variables
      const syncTheme = () => {
        const root = document.documentElement;
        if (tg.themeParams) {
          Object.entries(tg.themeParams).forEach(([key, value]) => {
            // Convert camelCase to kebab-case for CSS variables
            const cssKey = `--tg-theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
            root.style.setProperty(cssKey, value as string);
          });
          
          // Custom mapping for Shadcn/UI integration
          if (tg.themeParams.bg_color) root.style.setProperty('--background', tg.themeParams.bg_color);
          if (tg.themeParams.text_color) root.style.setProperty('--foreground', tg.themeParams.text_color);
          if (tg.themeParams.button_color) root.style.setProperty('--primary', tg.themeParams.button_color);
        }
      };

      syncTheme();
      
      // Listen for theme changes
      tg.onEvent('themeChanged', syncTheme);
      
      return () => {
        tg.offEvent('themeChanged', syncTheme);
      };
    }
  }, []);

  const expand = () => webApp?.expand();
  const close = () => webApp?.close();

  const setMainButton = (text: string, onClick: () => void, visible = true) => {
    if (!webApp?.MainButton) return;
    
    webApp.MainButton.setText(text);
    webApp.MainButton.onClick(onClick);
    if (visible) webApp.MainButton.show();
    else webApp.MainButton.hide();
  };

  const hideMainButton = () => {
    webApp?.MainButton?.hide();
  };

  const value = {
    isTMA,
    webApp,
    user: webApp?.initDataUnsafe?.user || null,
    theme,
    expand,
    close,
    setMainButton,
    hideMainButton
  };

  return (
    <TMAContext.Provider value={value}>
      {children}
    </TMAContext.Provider>
  );
};

export const useTMA = () => {
  const context = useContext(TMAContext);
  if (context === undefined) {
    // Fallback for non-TMA environments to prevent crashes
    return {
      isTMA: false,
      webApp: null,
      user: null,
      theme: 'light',
      expand: () => {},
      close: () => {},
      setMainButton: () => {},
      hideMainButton: () => {}
    } as TMAContextType;
  }
  return context;
};
