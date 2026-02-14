/**
 * AccountSettingsScreen - User-level settings (account-scoped)
 * Profile, billing, language, security
 */
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Bell,
  Shield,
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
  CreditCard,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DashboardHeader } from '../layout/DashboardHeader';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { TelegramVerification } from '@/components/auth/TelegramVerification';
import { VerificationPanel } from '@/components/settings/VerificationPanel';
import { cn } from '@/lib/utils';
import type { ProfileBlock } from '@/types/page';
import type { PremiumTier } from '@/hooks/usePremiumStatus';

interface AccountSettingsScreenProps {
  usernameInput: string;
  onUsernameChange: (value: string) => void;
  onUpdateUsername: () => void;
  usernameSaving: boolean;
  displayName?: string;
  avatarUrl?: string;
  isPremium: boolean;
  premiumTier?: PremiumTier;
  emailNotificationsEnabled: boolean;
  onEmailNotificationsChange: (enabled: boolean) => void;
  telegramEnabled: boolean;
  telegramChatId: string;
  onTelegramChange: (enabled: boolean, chatId?: string) => void;
  onSignOut: () => void;
  onOpenFriends: () => void;
  onOpenSaveTemplate: () => void;
  onOpenMyTemplates: () => void;
  onOpenTokens: () => void;
  onOpenAchievements: () => void;
  onBack: () => void;
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
          {badge && <Badge className="text-xs">{badge}</Badge>}
        </div>
        {description && <p className="text-sm text-muted-foreground truncate">{description}</p>}
      </div>
      {rightElement || (onClick && <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />)}
    </Wrapper>
  );
}

export const AccountSettingsScreen = memo(function AccountSettingsScreen(props: AccountSettingsScreenProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showVerification, setShowVerification] = useState(false);
  const [showTelegramVerification, setShowTelegramVerification] = useState(false);

  return (
    <div className="min-h-screen safe-area-top">
      <DashboardHeader 
        title={t('dashboard.accountSettings.title', 'Account Settings')} 
        showBack
        onBack={props.onBack}
      />

      <div className="px-5 py-6 space-y-6">
        {/* Profile Card */}
        <Card className="p-5">
          <div className="flex items-center gap-4 mb-5">
            <Avatar className="h-16 w-16 rounded-2xl border-2 border-border">
              <AvatarImage src={props.avatarUrl || ''} alt={props.displayName || ''} />
              <AvatarFallback className="rounded-2xl text-xl font-bold bg-primary/10 text-primary">
                {(props.displayName || 'U').charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold truncate">{props.displayName || t('dashboard.accountSettings.user', 'User')}</h2>
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
              {t('dashboard.accountSettings.username', 'Username')}
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
            <div className="font-bold">{t('dashboard.accountSettings.tokens', 'Tokens')}</div>
            <div className="text-xs text-muted-foreground">{t('dashboard.accountSettings.tokensDesc', 'Balance & history')}</div>
          </button>

          <button
            onClick={props.onOpenAchievements}
            className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-left transition-all active:scale-[0.98]"
          >
            <Trophy className="h-6 w-6 text-amber-500 mb-2" />
            <div className="font-bold">{t('dashboard.accountSettings.achievements', 'Achievements')}</div>
            <div className="text-xs text-muted-foreground">{t('dashboard.accountSettings.achievementsDesc', 'Your progress')}</div>
          </button>
        </div>

        {/* Account Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
            {t('dashboard.accountSettings.account', 'Account')}
          </h3>
          <Card className="divide-y divide-border/50 overflow-hidden">
            <SettingsItem
              icon={Users}
              iconBg="bg-pink-500/15"
              iconColor="text-pink-500"
              label={t('dashboard.accountSettings.friends', 'Friends')}
              onClick={props.onOpenFriends}
            />
            <SettingsItem
              icon={LayoutTemplate}
              iconBg="bg-emerald-500/15"
              iconColor="text-emerald-500"
              label={t('dashboard.accountSettings.myTemplates', 'My Templates')}
              onClick={props.onOpenMyTemplates}
            />
            <SettingsItem
              icon={Save}
              iconBg="bg-blue-500/15"
              iconColor="text-blue-500"
              label={t('dashboard.accountSettings.saveTemplate', 'Save as Template')}
              onClick={props.onOpenSaveTemplate}
            />
            <SettingsItem
              icon={Shield}
              iconBg="bg-violet-500/15"
              iconColor="text-violet-500"
              label={t('dashboard.accountSettings.verification', 'Verification')}
              onClick={() => setShowVerification(true)}
            />
          </Card>
        </div>

        {/* Notifications Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
            {t('dashboard.accountSettings.notifications', 'Notifications')}
          </h3>
          <Card className="divide-y divide-border/50 overflow-hidden">
            <SettingsItem
              icon={Mail}
              iconBg="bg-blue-500/15"
              iconColor="text-blue-500"
              label={t('dashboard.accountSettings.emailNotifications', 'Email Notifications')}
              description={t('dashboard.accountSettings.emailNotificationsDesc', 'About new leads')}
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
                  <div className="font-medium">{t('dashboard.accountSettings.telegram', 'Telegram')}</div>
                  <p className="text-sm text-muted-foreground">
                    {props.telegramEnabled
                      ? t('dashboard.accountSettings.connected', 'Connected')
                      : t('dashboard.accountSettings.notConnected', 'Not connected')}
                  </p>
                </div>
                <Switch checked={props.telegramEnabled} onCheckedChange={(checked) => props.onTelegramChange(checked)} />
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
                <Button variant="outline" className="w-full mt-2" onClick={() => setShowTelegramVerification(true)}>
                  {t('dashboard.accountSettings.connectTelegram', 'Connect Telegram')}
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Appearance Section */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
            {t('dashboard.accountSettings.appearance', 'Appearance')}
          </h3>
          <Card className="divide-y divide-border/50 overflow-hidden">
            <SettingsItem
              icon={Globe}
              iconBg="bg-emerald-500/15"
              iconColor="text-emerald-500"
              label={t('dashboard.accountSettings.language', 'Language')}
              rightElement={<LanguageSwitcher />}
            />
          </Card>
        </div>

        {/* Plan & Billing */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
            {t('dashboard.accountSettings.planBilling', 'Plan & Billing')}
          </h3>
          <Card className="divide-y divide-border/50 overflow-hidden">
            <SettingsItem
              icon={Crown}
              iconBg={props.isPremium ? "bg-amber-500/15" : "bg-muted"}
              iconColor={props.isPremium ? "text-amber-500" : "text-muted-foreground"}
              label={props.isPremium ? t('dashboard.accountSettings.proPlan', 'Pro Plan') : t('dashboard.accountSettings.freePlan', 'Free Plan')}
              description={props.isPremium ? t('dashboard.accountSettings.manageSubscription', 'Manage subscription') : t('dashboard.accountSettings.upgradeForMore', 'Upgrade for more features')}
              onClick={() => navigate('/pricing')}
            />
            {props.isPremium && (
              <SettingsItem
                icon={CreditCard}
                iconBg="bg-slate-500/15"
                iconColor="text-slate-500"
                label={t('dashboard.accountSettings.billingHistory', 'Billing History')}
                onClick={() => {/* TODO: Open billing history */}}
              />
            )}
          </Card>
        </div>

        {/* Security */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
            {t('dashboard.accountSettings.security', 'Security')}
          </h3>
          <Card className="divide-y divide-border/50 overflow-hidden">
            <SettingsItem
              icon={Lock}
              iconBg="bg-red-500/15"
              iconColor="text-red-500"
              label={t('dashboard.accountSettings.changePassword', 'Change Password')}
              onClick={() => {/* TODO: Open password change */}}
            />
          </Card>
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full h-14 rounded-2xl text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          onClick={props.onSignOut}
        >
          <LogOut className="h-5 w-5 mr-2" />
          {t('dashboard.accountSettings.signOut', 'Sign Out')}
        </Button>
      </div>

      {/* Verification Panel */}
      {showVerification && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-auto p-4">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{t('dashboard.accountSettings.verification', 'Verification')}</h2>
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
