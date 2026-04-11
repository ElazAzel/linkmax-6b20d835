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
  ExternalLink
} from 'lucide-react';
import { motion } from 'framer-motion';

export const TMASettingsScreen: React.FC = () => {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="p-6 space-y-8 max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{t('tma.settingsTitle', 'Telegram Mini App')}</h1>
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20">β Beta</Badge>
        </div>
        <p className="text-muted-foreground text-lg">
          {t('tma.settingsSubtitle', 'Configure your presence within the Telegram ecosystem.')}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Bot Connection */}
        <motion.div variants={itemVariants}>
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
                <p className="text-xs text-muted-foreground font-mono">@YourBotName</p>
              </div>
            </div>
            <Button className="mt-6 w-full" variant="outline">
              {t('tma.setupBot', 'Configure Bot Token')}
            </Button>
          </Card>
        </motion.div>

        {/* Mini App Preview */}
        <motion.div variants={itemVariants}>
          <Card className="p-6 h-full flex flex-col justify-between border-primary/10">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold">{t('tma.miniappTitle', 'TMA Preview')}</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                {t('tma.miniappDesc', 'Preview how your pages look inside the Telegram Mini App browser.')}
              </p>
              <div className="aspect-[9/12] w-full bg-muted/30 rounded-t-3xl border-x border-t flex flex-col overflow-hidden">
                <div className="h-8 bg-zinc-800 flex items-center px-4 justify-between">
                  <div className="w-12 h-1 bg-white/20 rounded-full" />
                  <div className="flex gap-1">
                    <div className="w-1 h-1 bg-white/40 rounded-full" />
                    <div className="w-1 h-1 bg-white/40 rounded-full" />
                    <div className="w-1 h-1 bg-white/40 rounded-full" />
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-8 text-center text-xs text-muted-foreground italic">
                  Preview loading...
                </div>
              </div>
            </div>
            <Button className="mt-4 w-full">
              <Zap className="h-4 w-4 mr-2" />
              {t('tma.openWebApp', 'Open Mini App')}
            </Button>
          </Card>
        </motion.div>
      </div>

      {/* Advanced Settings */}
      <motion.div variants={itemVariants}>
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
      </motion.div>

      <div className="flex justify-center gap-8 text-sm text-muted-foreground pb-8">
        <a href="https://core.telegram.org/bots/webapps" target="_blank" rel="noreferrer" className="hover:text-primary flex items-center gap-1">
          Telegram Documentation <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </motion.div>
  );
};
