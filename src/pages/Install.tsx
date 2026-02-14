import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Download, Check, Smartphone, Monitor, Zap, Cloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const canonical = 'https://lnkmx.my/install';
  const seoTitle = t('install.seo.title', 'Install lnkmx');
  const seoDescription = t('install.seo.description', 'Install lnkmx as a PWA for quick access.');
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
      title: 'Быстрый доступ',
      description: 'Запуск в один клик с главного экрана',
    },
    {
      icon: Cloud,
      title: 'Работа оффлайн',
      description: 'Доступ к контенту без интернета',
    },
    {
      icon: Smartphone,
      title: 'Нативный интерфейс',
      description: 'Полноэкранный режим без браузера',
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
          <h1 className="text-3xl sm:text-4xl font-bold">Установить LinkMAX</h1>
          <p className="text-muted-foreground text-lg">
            Добавьте приложение на главный экран для лучшего опыта
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
                <h3 className="font-semibold text-lg mb-2">Приложение установлено!</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  LinkMAX готов к работе. Найдите иконку на главном экране.
                </p>
              </div>
              <Button onClick={() => navigate('/dashboard')} className="w-full sm:w-auto">
                Открыть приложение
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Android/Desktop - Browser Install */}
              {deferredPrompt && platform !== 'ios' && (
                <div className="text-center space-y-4">
                  <h3 className="font-semibold text-lg">Готово к установке</h3>
                  <p className="text-sm text-muted-foreground">
                    Нажмите кнопку ниже, чтобы установить LinkMAX на устройство
                  </p>
                  <Button onClick={handleInstall} className="w-full" size="lg">
                    <Download className="h-5 w-5 mr-2" />
                    Установить сейчас
                  </Button>
                </div>
              )}

              {/* iOS Instructions */}
              {platform === 'ios' && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-center">Инструкция для iOS</h3>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="font-semibold min-w-[24px]">1.</span>
                      <span>Нажмите кнопку "Поделиться" <span className="inline-block">⬆️</span> внизу Safari</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold min-w-[24px]">2.</span>
                      <span>Прокрутите вниз и выберите "На экран Домой"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold min-w-[24px]">3.</span>
                      <span>Нажмите "Добавить" в правом верхнем углу</span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Android Manual Instructions */}
              {platform === 'android' && !deferredPrompt && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-center">Инструкция для Android</h3>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="font-semibold min-w-[24px]">1.</span>
                      <span>Нажмите меню браузера (⋮) в правом верхнем углу</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold min-w-[24px]">2.</span>
                      <span>Выберите "Установить приложение" или "Добавить на главный экран"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-semibold min-w-[24px]">3.</span>
                      <span>Подтвердите установку</span>
                    </li>
                  </ol>
                </div>
              )}

              {/* Desktop Instructions */}
              {platform === 'desktop' && !deferredPrompt && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg text-center">Инструкция для Desktop</h3>
                  <p className="text-sm text-muted-foreground text-center">
                    В адресной строке браузера найдите иконку установки <Monitor className="inline h-4 w-4" /> 
                    {' '}или в меню браузера выберите "Установить LinkMAX"
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                  Вернуться на главную
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
