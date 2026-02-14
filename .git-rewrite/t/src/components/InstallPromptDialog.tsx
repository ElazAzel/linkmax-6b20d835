import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, Smartphone, Monitor, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface InstallPromptProps {
  open: boolean;
  onClose: () => void;
  pageUrl: string;
}

type DeviceType = 'desktop' | 'android' | 'ios';

function detectDevice(): DeviceType {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  }
  if (/android/.test(userAgent)) {
    return 'android';
  }
  return 'desktop';
}

export function InstallPromptDialog({ open, onClose, pageUrl }: InstallPromptProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<DeviceType>(detectDevice());
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        onClose();
      }
      setDeferredPrompt(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            {t('install.title', 'Install LinkMAX')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t('install.description', 'Install LinkMAX on your device for quick access')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('install.subtitle', 'Your page is published! Install LinkMAX for quick access and offline editing.')}
          </p>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">{t('install.yourLink', 'Your link:')}</p>
            <p className="font-medium text-primary break-all">{pageUrl}</p>
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DeviceType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="ios" className="flex items-center gap-1">
                <Apple className="h-4 w-4" />
                <span className="hidden sm:inline">iPhone</span>
              </TabsTrigger>
              <TabsTrigger value="android" className="flex items-center gap-1">
                <Smartphone className="h-4 w-4" />
                <span className="hidden sm:inline">Android</span>
              </TabsTrigger>
              <TabsTrigger value="desktop" className="flex items-center gap-1">
                <Monitor className="h-4 w-4" />
                <span className="hidden sm:inline">{t('install.desktop', 'Desktop')}</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ios" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">{t('install.ios.step1', 'Open in Safari')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('install.ios.step1desc', 'Make sure you\'re using Safari browser')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">{t('install.ios.step2', 'Tap Share button')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('install.ios.step2desc', 'Find the Share icon at the bottom of Safari')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">{t('install.ios.step3', '"Add to Home Screen"')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('install.ios.step3desc', 'Scroll down and tap "Add to Home Screen"')}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="android" className="space-y-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">{t('install.android.step1', 'Open browser menu')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('install.android.step1desc', 'Tap the three dots in the top right corner')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">{t('install.android.step2', '"Install app" or "Add to Home screen"')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('install.android.step2desc', 'Select the install option from the menu')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">{t('install.android.step3', 'Confirm installation')}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('install.android.step3desc', 'Tap "Install" to add LinkMAX to your home screen')}
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="desktop" className="space-y-4 mt-4">
              {deferredPrompt ? (
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t('install.desktop.ready', 'LinkMAX is ready to be installed!')}
                  </p>
                  <Button onClick={handleInstallPWA} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    {t('install.desktop.installNow', 'Install Now')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div>
                      <p className="font-medium">{t('install.desktop.step1', 'Look for install icon')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('install.desktop.step1desc', 'Find the install icon in the address bar (Chrome, Edge)')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div>
                      <p className="font-medium">{t('install.desktop.step2', 'Click "Install"')}</p>
                      <p className="text-sm text-muted-foreground">
                        {t('install.desktop.step2desc', 'Confirm the installation to add LinkMAX to your desktop')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              {t('install.later', 'Maybe Later')}
            </Button>
            <Button 
              className="flex-1" 
              onClick={() => {
                navigator.clipboard.writeText(pageUrl);
                onClose();
              }}
            >
              {t('install.copyLink', 'Copy Link')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
