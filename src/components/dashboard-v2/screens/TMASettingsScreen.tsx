import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Smartphone, 
  Bot, 
  Send, 
  Zap,
  Globe,
  BellRing,
  ExternalLink,
  User,
  Layout,
  Languages
} from 'lucide-react';
import { LanguageSelector } from '@/components/ui/language-selector';
import { motion } from 'framer-motion';
import { useTMA } from '@/platform/tma/TMAProvider';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export const TMASettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const { isTMA, user, theme } = useTMA();

  return (
    <motion.div 
      className="p-6 space-y-8 max-w-4xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('tma.settingsTitle', 'Telegram Mini App')}</h1>
          {isTMA && <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/20">Active Session</Badge>}
        </div>
        <p className="text-muted-foreground text-lg">
          {t('tma.settingsSubtitle', 'Configure your presence within the Telegram ecosystem.')}
        </p>
      </div>

      {isTMA && user && (
        <Card className="p-6 bg-muted/30 border-dashed">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              <AvatarImage src={user.photo_url} />
              <AvatarFallback><User /></AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-lg">{user.first_name} {user.last_name}</p>
              <p className="text-sm text-muted-foreground">@{user.username || user.id}</p>
            </div>
            <div className="ml-auto flex flex-col items-end">
              <Badge variant="outline" className="capitalize">{theme} Mode</Badge>
              <p className="text-[10px] text-muted-foreground mt-1">v{window.Telegram?.WebApp?.version || '7.0'}</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Bot Connection */}
        <Card className="p-6 h-full flex flex-col justify-between border-primary/10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">{t('tma.botConnection', 'Bot Connection')}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('tma.botDesc', 'Connect your own Telegram Bot to provide a white-label experience for your customers.')}
            </p>
            <div className="p-4 bg-muted/50 rounded-lg border border-dashed text-center">
              <p className="text-xs text-muted-foreground font-mono">@LinkMaxOfficialBot</p>
            </div>
          </div>
          <Button className="mt-6 w-full" variant="outline">
            {t('tma.setupBot', 'Configure Bot Token')}
          </Button>
        </Card>

        {/* Mini App UI Control */}
        <Card className="p-6 h-full flex flex-col border-primary/10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">{t('tma.uiControl', 'UI Control')}</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                <span className="text-sm">{t('tma.syncTheme', 'Sync Theme Colors')}</span>
                <Badge variant="outline" className="text-[10px] text-green-600 bg-green-50 border-green-200">ON</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                <span className="text-sm">{t('tma.hapticFeedback', 'Haptic Feedback')}</span>
                <Badge variant="outline" className="text-[10px] text-green-600 bg-green-50 border-green-200">ON</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors">
                <span className="text-sm">{t('tma.expandedMode', 'Full Height Mode')}</span>
                <Badge variant="outline" className="text-[10px] text-blue-600 bg-blue-50 border-blue-200">AUTO</Badge>
              </div>
            </div>
          </div>
        </Card>
        {/* Language Selection */}
        <Card className="p-6 h-full flex flex-col border-primary/10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold">{t('tma.language', 'Language')}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('tma.languageDesc', 'Choose your preferred interface language.')}
            </p>
            <div className="flex items-center gap-3 pt-2">
              <LanguageSelector showLabel showFlag variant="outline" size="lg" className="w-full justify-between" />
            </div>
          </div>
        </Card>
      </div>

      {/* Advanced Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-6">{t('tma.advancedSettings', 'Advanced Bot Features')}</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg"><BellRing className="h-4 w-4" /></div>
              <div>
                <p className="font-medium">{t('tma.pushNotifications', 'Push Notifications')}</p>
                <p className="text-xs text-muted-foreground">{t('tma.pushDesc', 'Send service updates directly via the bot.')}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">Pro</Badge>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-muted rounded-lg"><Globe className="h-4 w-4" /></div>
              <div>
                <p className="font-medium">{t('tma.customDomain', 'Bot Domain Mapping')}</p>
                <p className="text-xs text-muted-foreground">{t('tma.domainDesc', 'Map your bot to a custom subdomain.')}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">Premium+</Badge>
          </div>
        </div>
      </Card>

      <div className="flex justify-center gap-8 text-sm text-muted-foreground pb-8">
        <a href="https://core.telegram.org/bots/webapps" target="_blank" rel="noreferrer" className="hover:text-primary flex items-center gap-1">
          Telegram Documentation <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </motion.div>
  );
};
