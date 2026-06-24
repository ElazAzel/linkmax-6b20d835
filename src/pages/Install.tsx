import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Cloud, Download, Monitor, Smartphone, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import { getAppDomain } from '@/lib/utils/url-helpers';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const canonical = `${getAppDomain()}/install`;
  const seoTitle = t('install.seo.title', 'Install LinkMAX');
  const seoDescription = t('install.seo.description', 'Install LinkMAX as a PWA for quick access.');
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const features = [
    {
      icon: Zap,
      title: t('install.features.quickAccess', 'Quick access'),
      description: t('install.features.quickAccessDesc', 'One-click launch from home screen'),
    },
    {
      icon: Cloud,
      title: t('install.features.offline', 'Offline mode'),
      description: t('install.features.offlineDesc', 'Access content without internet'),
    },
    {
      icon: Smartphone,
      title: t('install.features.native', 'Native interface'),
      description: t('install.features.nativeDesc', 'Full-screen mode without browser'),
    },
  ];

  return (
    <>
      <StaticSEOHead
        title={seoTitle}
        description={seoDescription}
        canonical={canonical}
        currentLanguage={i18n.language}
        indexable={false}
        alternates={[
          { hreflang: 'ru', href: `${canonical}?lang=ru` },
          { hreflang: 'en', href: `${canonical}?lang=en` },
          { hreflang: 'kk', href: `${canonical}?lang=kk` },
          { hreflang: 'x-default', href: canonical },
        ]}
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="h-20 w-20 rounded-2xl bg-primary/10 mx-auto flex items-center justify-center">
            <Download className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold">{t('install.title', 'Install LinkMAX.my')}</h1>
          <p className="text-muted-foreground text-lg">
            {t('install.subtitle', 'Add the app to your home screen for a better experience')}
          </p>
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-3 gap-4">
          {features.map((feature) => (
            <Card key={feature.title} className="p-4 text-center">
              <feature.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
              <h3 className="font-semibold mb-1 text-sm">{feature.title}</h3>
              <p className="text-xs text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Install Card */}
        <Card className="p-6">
          {isInstalled ? (
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-green-500/10 mx-auto flex items-center justify-center">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{t('install.installed.title', 'App installed!')}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('install.installed.desc', 'LinkMAX.my is ready. Find the icon on your home screen.')}
                </p>
              </div>
              <Button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto">
                {t('install.installed.open', 'Open app')}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Android/Desktop - Browser Install */}
              {deferredPrompt && platform !== 'ios' && (
                <div className="text-center space-y-4">
                  <h3 className="font-semibold text-lg">{t('install.ready.title', 'Ready to install')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('install.ready.desc', 'Click the button below to install LinkMAX.my on your device')}
                  </p>
                  <Button onClick={handleInstall} className="w-full" size="lg">
                    <Download className="h-5 w-5 mr-2" />
                    {t('install.ready.button', 'Install now')}
                  </Button>
                </div>
              )}

              {/* iOS Instructions */}
              {platform === 'ios' && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-center">{t('install.ios.title', 'Instructions for iOS')}</h3>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="font-semibold min-w-[24px]">1.</span>
                      <span>{t('install.ios.step1', 'Tap the "Share" button ⬆️ at the bottom of Safari')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold min-w-[24px]">2.</span>
                      <span>{t('install.ios.step2', 'Scroll down and select "Add to Home Screen"')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold min-w-[24px]">3.</span>
                      <span>{t('install.ios.step3', 'Tap "Add" in the top right corner')}</span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Android Manual Instructions */}
              {platform === 'android' && !deferredPrompt && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-center">{t('install.android.title', 'Instructions for Android')}</h3>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="font-semibold min-w-[24px]">1.</span>
                      <span>{t('install.android.step1', 'Tap the browser menu (⋮) in the top right corner')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold min-w-[24px]">2.</span>
                      <span>{t('install.android.step2', 'Select "Install app" or "Add to Home Screen"')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold min-w-[24px]">3.</span>
                      <span>{t('install.android.step3', 'Confirm installation')}</span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Desktop Instructions */}
              {platform === 'desktop' && !deferredPrompt && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-center">{t('install.desktop.title', 'Instructions for Desktop')}</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    {t('install.desktop.desc', 'Look for the install icon in the browser address bar or select "Install LinkMAX.my" from the browser menu')}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                  {t('install.backHome', 'Back to home')}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
      </div>
    </>
  );
}
