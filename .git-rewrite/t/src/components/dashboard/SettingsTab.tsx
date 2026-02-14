/**
 * SettingsTab - App settings with sections for profile, notifications, etc.
 * Mobile-optimized with large touch targets
 */
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  LogOut,
  ChevronRight,
  Crown,
  Check,
  Coins,
  Trophy,
  Users,
  LayoutTemplate,
  Save,
  Link2,
  MessageCircle,
  Mail,
  ImageIcon,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { NicheSelector } from '@/components/settings/NicheSelector';
import { TelegramVerification } from '@/components/auth/TelegramVerification';
import { VerificationPanel } from '@/components/settings/VerificationPanel';
import { cn } from '@/lib/utils';
import type { ProfileBlock } from '@/types/page';
import type { Niche } from '@/lib/niches';
import type { PremiumTier } from '@/hooks/usePremiumStatus';
import { getTranslatedString } from '@/lib/i18n-helpers';
import { useTranslation as useI18nTranslation } from 'react-i18next';

interface SettingsTabProps {
  usernameInput: string;
  onUsernameChange: (value: string) => void;
  onUpdateUsername: () => void;
  usernameSaving: boolean;
  profileBlock?: ProfileBlock;
  onUpdateProfile: (updates: Partial<ProfileBlock>) => void;
  isPremium: boolean;
  premiumTier?: PremiumTier;
  premiumLoading: boolean;
  chatbotContext: string;
  onChatbotContextChange: (value: string) => void;
  onSave: () => void;
  emailNotificationsEnabled: boolean;
  onEmailNotificationsChange: (enabled: boolean) => void;
  telegramEnabled: boolean;
  telegramChatId: string;
  onTelegramChange: (enabled: boolean, chatId?: string) => void;
  userId?: string;
  pageId?: string;
  niche?: Niche;
  onNicheChange: (niche: Niche) => void;
  pageBackground?: any;
  onPageBackgroundChange: (background: any) => void;
  canUseCustomPageBackground: boolean;
  onSignOut: () => void;
  onOpenFriends: () => void;
  onOpenSaveTemplate: () => void;
  onOpenMyTemplates: () => void;
  onOpenTokens: () => void;
  onOpenAchievements: () => void;
}

interface SettingsItemProps {
  icon: React.ComponentType<{ className?: string }>;
  iconBg?: string;
  iconColor?: string;
  label: string;
  description?: string;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  badge?: string;
}

function SettingsItem({ 
  icon: Icon, 
  iconBg = 'bg-muted',
  iconColor = 'text-foreground',
  label, 
  description, 
  onClick, 
  rightElement,
  badge,
}: SettingsItemProps) {
  const Wrapper = onClick ? 'button' : 'div';
  
  return (
    <Wrapper
      className={cn(
        "w-full flex items-center gap-4 p-4 text-left",
        onClick && "hover:bg-muted/50 active:bg-muted transition-colors"
      )}
      onClick={onClick}
    >
      <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center shrink-0", iconBg)}>
        <Icon className={cn("h-5 w-5", iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{label}</span>
          {badge && (
            <Badge className="text-xs">{badge}</Badge>
          )}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        )}
      </div>
      {rightElement || (onClick && <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />)}
    </Wrapper>
  );
}

export const SettingsTab = memo(function SettingsTab(props: SettingsTabProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showVerification, setShowVerification] = useState(false);
  const [showTelegramVerification, setShowTelegramVerification] = useState(false);

  const avatarUrl = props.profileBlock?.avatar;
  const rawName = props.profileBlock?.name;
  const name = rawName 
    ? getTranslatedString(rawName, i18n.language as any) || t('settings.myPage', 'Моя страница')
    : t('settings.myPage', 'Моя страница');
  const displayName = typeof name === 'string' ? name : t('settings.myPage', 'Моя страница');

  return (
    <div className="min-h-screen safe-area-top pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-nav px-5 py-4">
        <h1 className="text-2xl font-black">{t('settings.title', 'Настройки')}</h1>
      </header>

      <div className="px-5 py-6 space-y-6">
        {/* Profile Card */}
        <Card className="p-5">
          <div className="flex items-center gap-4 mb-5">
            <Avatar className="h-16 w-16 rounded-2xl border-2 border-border">
              <AvatarImage src={avatarUrl || ''} alt={displayName} />
              <AvatarFallback className="rounded-2xl text-xl font-bold bg-primary/10 text-primary">
                {displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold truncate">{displayName}</h2>
                {props.isPremium && (
                  <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
                    <Crown className="h-3 w-3 mr-1" />
                    PRO
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{props.usernameInput}</p>
            </div>
          </div>

          {/* Username Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              {t('settings.username', 'Имя пользователя')}
            </label>
            <div className="flex gap-2">
              <Input
                value={props.usernameInput}
                onChange={(e) => props.onUsernameChange(e.target.value)}
                placeholder="username"
                className="h-12 rounded-xl"
              />
              <Button
                onClick={props.onUpdateUsername}
                disabled={props.usernameSaving}
                className="h-12 px-5 rounded-xl"
              >
                {props.usernameSaving ? '...' : <Check className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={props.onOpenTokens}
            className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-violet-500/10 border border-primary/20 text-left transition-all active:scale-[0.98]"
          >
            <Coins className="h-6 w-6 text-primary mb-2" />
            <div className="font-bold">{t('settings.tokens', 'Токены')}</div>
            <div className="text-xs text-muted-foreground">{t('settings.tokensDesc', 'Баланс и история')}</div>
          </button>
          
          <button
            onClick={props.onOpenAchievements}
            className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-left transition-all active:scale-[0.98]"
          >
            <Trophy className="h-6 w-6 text-amber-500 mb-2" />
            <div className="font-bold">{t('settings.achievements', 'Достижения')}</div>
            <div className="text-xs text-muted-foreground">{t('settings.achievementsDesc', 'Ваш прогресс')}</div>
          </button>
        </div>

        {/* Account Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
            {t('settings.account', 'Аккаунт')}
          </h3>
          <Card className="divide-y divide-border/50 overflow-hidden">
            <SettingsItem
              icon={Users}
              iconBg="bg-pink-500/15"
              iconColor="text-pink-500"
              label={t('settings.friends', 'Друзья')}
              onClick={props.onOpenFriends}
            />
            <SettingsItem
              icon={LayoutTemplate}
              iconBg="bg-emerald-500/15"
              iconColor="text-emerald-500"
              label={t('settings.myTemplates', 'Мои шаблоны')}
              onClick={props.onOpenMyTemplates}
            />
            <SettingsItem
              icon={Save}
              iconBg="bg-blue-500/15"
              iconColor="text-blue-500"
              label={t('settings.saveTemplate', 'Сохранить как шаблон')}
              onClick={props.onOpenSaveTemplate}
            />
            <SettingsItem
              icon={Shield}
              iconBg="bg-violet-500/15"
              iconColor="text-violet-500"
              label={t('settings.verification', 'Верификация')}
              onClick={() => setShowVerification(true)}
            />
          </Card>
        </div>

        {/* Page Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
            {t('settings.page', 'Страница')}
          </h3>
          <Card className="p-4 space-y-4">
            <NicheSelector
              value={props.niche}
              onChange={props.onNicheChange}
            />
          </Card>
        </div>

        {/* Notifications Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
            {t('settings.notifications', 'Уведомления')}
          </h3>
          <Card className="divide-y divide-border/50 overflow-hidden">
            <SettingsItem
              icon={Mail}
              iconBg="bg-blue-500/15"
              iconColor="text-blue-500"
              label={t('settings.emailNotifications', 'Email уведомления')}
              description={t('settings.emailNotificationsDesc', 'О новых заявках')}
              rightElement={
                <Switch
                  checked={props.emailNotificationsEnabled}
                  onCheckedChange={props.onEmailNotificationsChange}
                />
              }
            />
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-blue-500/15 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{t('settings.telegramNotifications', 'Telegram')}</div>
                  <p className="text-sm text-muted-foreground">
                    {props.telegramEnabled ? t('settings.connected', 'Подключён') : t('settings.notConnected', 'Не подключён')}
                  </p>
                </div>
                <Switch
                  checked={props.telegramEnabled}
                  onCheckedChange={(checked) => props.onTelegramChange(checked)}
                />
              </div>
              {props.telegramEnabled && showTelegramVerification && (
                <TelegramVerification 
                  onVerified={(chatId) => {
                    props.onTelegramChange(true, chatId);
                    setShowTelegramVerification(false);
                  }}
                  onBack={() => setShowTelegramVerification(false)}
                />
              )}
              {props.telegramEnabled && !showTelegramVerification && !props.telegramChatId && (
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => setShowTelegramVerification(true)}
                >
                  {t('settings.connectTelegram', 'Подключить Telegram')}
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Appearance Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
            {t('settings.appearance', 'Внешний вид')}
          </h3>
          <Card className="divide-y divide-border/50 overflow-hidden">
            <SettingsItem
              icon={Globe}
              iconBg="bg-emerald-500/15"
              iconColor="text-emerald-500"
              label={t('settings.language', 'Язык интерфейса')}
              rightElement={<LanguageSwitcher />}
            />
            <SettingsItem
              icon={ImageIcon}
              iconBg="bg-violet-500/15"
              iconColor="text-violet-500"
              label={t('settings.pageBackground', 'Фон страницы')}
              description={!props.canUseCustomPageBackground ? t('settings.premiumOnly', 'Только Premium') : undefined}
              badge={!props.canUseCustomPageBackground ? 'PRO' : undefined}
            />
          </Card>
        </div>

        {/* Premium */}
        {!props.isPremium && (
          <Card className="p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Crown className="h-6 w-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold mb-1">{t('settings.upgradeToPremium', 'Перейти на Premium')}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('settings.premiumBenefits', 'Все блоки, CRM, аналитика и многое другое')}
                </p>
                <Button 
                  className="h-11 rounded-xl"
                  onClick={() => navigate('/pricing')}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('settings.getPremium', 'Получить Premium')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full h-14 rounded-2xl text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          onClick={props.onSignOut}
        >
          <LogOut className="h-5 w-5 mr-2" />
          {t('settings.signOut', 'Выйти')}
        </Button>
      </div>

      {/* Verification Panel */}
      {showVerification && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-auto p-4">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{t('settings.verification', 'Верификация')}</h2>
              <Button variant="ghost" onClick={() => setShowVerification(false)}>
                ✕
              </Button>
            </div>
            <VerificationPanel />
          </div>
        </div>
      )}
    </div>
  );
});
