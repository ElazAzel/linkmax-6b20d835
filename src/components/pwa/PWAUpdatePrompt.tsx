import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import RefreshCw from 'lucide-react/dist/esm/icons/refresh-cw';

declare global {
  interface Window {
    workbox?: any;
  }
}

export function PWAUpdatePrompt() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                // New service worker content available — prompt user to refresh
              }
            });
          }
        });
      });
    }
  }, []);

  return null;
}
