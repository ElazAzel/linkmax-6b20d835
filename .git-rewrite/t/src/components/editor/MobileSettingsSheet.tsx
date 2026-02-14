import { memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Crown, 
  Grid3X3,
  MessageCircle, 
  Sparkles, 
  User, 
  Link2,
  LogOut,
  X,
  Bell,
  Send,
  Tag,
  Image,
  ExternalLink,
  Check,
  Loader2,
  Users,
  UserPlus,
  BarChart3,
  Package,
  Save,
  Shield,
  Palette,
} from 'lucide-react';
import { CollaborationPanel } from '@/components/collaboration/CollaborationPanel';
import { openPremiumPurchase } from '@/lib/upgrade-utils';
import { ReferralPanel } from '@/components/referral/ReferralPanel';
import { AutomationsPanel } from '@/components/crm/AutomationsPanel';
import { LeadsPanel } from '@/components/crm/LeadsPanel';
import { FriendsPanel } from '@/components/friends/FriendsPanel';
import { NicheSelector } from '@/components/settings/NicheSelector';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';
import { PageBackgroundSettings } from './PageBackgroundSettings';
import type { ProfileBlock, EditorMode, GridConfig, PageBackground } from '@/types/page';
import type { Niche } from '@/lib/niches';

interface MobileSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Username settings
  usernameInput: string;
  onUsernameChange: (value: string) => void;
  onUpdateUsername: () => void;
  usernameSaving: boolean;
  
  // Profile settings
  profileBlock?: ProfileBlock;
  onUpdateProfile: (updates: Partial<ProfileBlock>) => void;
  
  // Premium status
  isPremium: boolean;
  premiumTier?: 'free' | 'pro';
  premiumLoading: boolean;
  
  // Chatbot settings
  chatbotContext: string;
  onChatbotContextChange: (value: string) => void;
  onSave: () => void;
  
  // AI Tools
  onOpenSEOGenerator: () => void;
  
  // Grid settings
  editorMode?: EditorMode;
  gridConfig?: GridConfig;
  onGridConfigChange?: (config: Partial<GridConfig>) => void;
  
  // Email notifications
  emailNotificationsEnabled?: boolean;
  onEmailNotificationsChange?: (enabled: boolean) => void;
  
  // Telegram notifications
  telegramEnabled?: boolean;
  telegramChatId?: string;
  onTelegramChange?: (enabled: boolean, chatId: string | null) => void;
  
  // User ID for referral
  userId?: string;
  
  // Page ID for collaborations
  pageId?: string;
  
  // Niche
  niche?: Niche;
  onNicheChange?: (niche: Niche) => void;
  
  // Preview URL
  previewUrl?: string;
  onPreviewUrlChange?: (url: string | null) => void;
  
  // Templates
  onOpenSaveTemplate?: () => void;
  onOpenMyTemplates?: () => void;
  
  // Page Background
  pageBackground?: PageBackground;
  onPageBackgroundChange?: (background: PageBackground | undefined) => void;
  canUseCustomPageBackground?: boolean;
  
  // Sign out
  onSignOut: () => void;
}

export const MobileSettingsSheet = memo(function MobileSettingsSheet({
  open,
  onOpenChange,
  usernameInput,
  onUsernameChange,
  onUpdateUsername,
  usernameSaving,
  profileBlock,
  onUpdateProfile,
  isPremium,
  premiumTier = 'free',
  premiumLoading,
  chatbotContext,
  onChatbotContextChange,
  onSave,
  onOpenSEOGenerator,
  editorMode,
  gridConfig,
  onGridConfigChange,
  emailNotificationsEnabled,
  onEmailNotificationsChange,
  telegramEnabled,
  telegramChatId,
  onTelegramChange,
  userId,
  pageId,
  niche,
  onNicheChange,
  previewUrl,
  onPreviewUrlChange,
  onOpenSaveTemplate,
  onOpenMyTemplates,
  pageBackground,
  onPageBackgroundChange,
  canUseCustomPageBackground,
  onSignOut,
}: MobileSettingsSheetProps) {
  const { t } = useTranslation();
  const [localTelegramChatId, setLocalTelegramChatId] = useState(telegramChatId || '');
  const [telegramValidating, setTelegramValidating] = useState(false);
  const [telegramValidated, setTelegramValidated] = useState(false);
  const [leadsPanelOpen, setLeadsPanelOpen] = useState(false);

  // Sync local state with prop changes
  useEffect(() => {
    setLocalTelegramChatId(telegramChatId || '');
    setTelegramValidated(!!telegramChatId);
  }, [telegramChatId]);

  const handleValidateAndSaveTelegram = async () => {
    if (!localTelegramChatId.trim()) return;
    
    setTelegramValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-telegram', {
        body: { chatId: localTelegramChatId.trim() }
      });

      if (error) {
        toast.error(t('settings.telegramError', 'Failed to validate Telegram'));
        return;
      }

      if (data.valid) {
        onTelegramChange?.(true, localTelegramChatId.trim());
        setTelegramValidated(true);
        toast.success(t('settings.telegramConnected', 'Telegram connected! Check your messages.'));
      } else {
        const errorMsg = data.error === 'invalid_chat_id' 
          ? t('settings.telegramInvalidId', 'Invalid Chat ID. Make sure you sent /start to @userinfobot')
          : data.error === 'cannot_send_message'
          ? t('settings.telegramCantSend', 'Cannot send messages. Start the bot first: @LinkMAXBot')
          : t('settings.telegramError', 'Failed to validate Telegram');
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error('Telegram validation error:', error);
      toast.error(t('settings.telegramError', 'Failed to validate Telegram'));
    } finally {
      setTelegramValidating(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[90vh] p-0 rounded-t-[2.5rem] bg-card/90 backdrop-blur-2xl border-t border-border/30 shadow-glass-xl [&>button]:hidden">
          <SheetHeader className="p-6 pb-4 border-b border-border/20 sticky top-0 bg-card/80 backdrop-blur-xl z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-black">{t('mobileToolbar.settings', 'Настройки')}</SheetTitle>
            <Button variant="ghost" size="lg" onClick={() => onOpenChange(false)} className="rounded-2xl hover:bg-card/60 h-12 w-12">
              <X className="h-6 w-6" />
            </Button>
          </div>
          <SheetDescription className="sr-only">{t('settings.pageAndAccount', 'Настройки страницы и аккаунта')}</SheetDescription>
        </SheetHeader>
        
        <div className="overflow-y-auto h-full pb-28">
          <Tabs defaultValue="link" className="w-full">
            <TabsList className="w-full sticky top-0 bg-card/80 backdrop-blur-xl z-10 h-14 rounded-none border-b border-border/20 px-3 justify-between">
              <TabsTrigger value="link" className="rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-xl h-10 w-10 p-0 flex items-center justify-center">
                <Link2 className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="profile" className="rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-xl h-10 w-10 p-0 flex items-center justify-center">
                <User className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="chatbot" className="rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-xl h-10 w-10 p-0 flex items-center justify-center">
                <MessageCircle className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="collabs" className="rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-xl h-10 w-10 p-0 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="friends" className="rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-xl h-10 w-10 p-0 flex items-center justify-center">
                <UserPlus className="h-5 w-5" />
              </TabsTrigger>
              <TabsTrigger value="premium" className="rounded-xl data-[state=active]:bg-primary/10 data-[state=active]:backdrop-blur-xl h-10 w-10 p-0 flex items-center justify-center">
                <Crown className="h-5 w-5" />
              </TabsTrigger>
            </TabsList>
            
            {/* Link Tab - BOLD */}
            <TabsContent value="link" className="p-5 space-y-5 mt-0">
              <Card className="p-6 bg-card/50 backdrop-blur-xl border border-border/20 rounded-3xl shadow-glass">
                <h3 className="text-lg font-bold mb-5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Link2 className="h-5 w-5 text-primary" />
                  </div>
                  {t('settings.yourLink', 'Ваша ссылка')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">{t('settings.username', 'Имя пользователя')}</Label>
                    <div className="flex gap-3 mt-3">
                      <Input
                        value={usernameInput}
                        onChange={(e) => onUsernameChange(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                        placeholder="username"
                        maxLength={30}
                        disabled={usernameSaving}
                        className="bg-card/60 backdrop-blur-xl border-border/30 rounded-2xl h-14 text-lg font-medium"
                      />
                      <Button 
                        size="lg" 
                        onClick={onUpdateUsername}
                        disabled={usernameSaving || !usernameInput.trim()}
                        className="rounded-2xl shadow-glass h-14 px-6 font-bold"
                      >
                        {usernameSaving ? '...' : t('common.save', 'Сохранить')}
                      </Button>
                    </div>
                    {usernameInput && (
                      <p className="text-sm text-muted-foreground mt-4 break-all bg-muted/30 backdrop-blur-xl p-4 rounded-2xl font-medium">
                        {window.location.origin}/{usernameInput}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
              
              {/* Grid Settings - only show in grid mode */}
              {editorMode === 'grid' && onGridConfigChange && (
                <Card className="p-5 bg-card/40 backdrop-blur-xl border border-border/20 rounded-2xl shadow-glass">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Grid3X3 className="h-4 w-4 text-primary" />
                    </div>
                    {t('settings.gridSettings', 'Настройки сетки')}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">{t('settings.desktopColumns', 'Колонки на ПК')}</Label>
                      <Select
                        value={String(gridConfig?.columnsDesktop || 3)}
                        onValueChange={(val) => onGridConfigChange({ columnsDesktop: parseInt(val) })}
                      >
                        <SelectTrigger className="mt-2 bg-card/60 backdrop-blur-xl border-border/30 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">2 {t('settings.columns', 'колонки')}</SelectItem>
                          <SelectItem value="3">3 {t('settings.columns', 'колонки')}</SelectItem>
                          <SelectItem value="4">4 {t('settings.columns', 'колонки')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">{t('settings.mobileColumns', 'Колонки на мобильном')}</Label>
                      <Select
                        value={String(gridConfig?.columnsMobile || 2)}
                        onValueChange={(val) => onGridConfigChange({ columnsMobile: parseInt(val) })}
                      >
                        <SelectTrigger className="mt-2 bg-card/60 backdrop-blur-xl border-border/30 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 {t('settings.column', 'колонка')}</SelectItem>
                          <SelectItem value="2">2 {t('settings.columns', 'колонки')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>
            
            {/* Profile Tab */}
            <TabsContent value="profile" className="p-4 space-y-4 mt-0">
              {profileBlock && (
                <Card className="p-5 bg-card/40 backdrop-blur-xl border border-border/20 rounded-2xl shadow-glass">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    {t('settings.profileInfo', 'Информация профиля')}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">{t('settings.name', 'Имя')}</Label>
                      <Input
                        value={typeof profileBlock.name === 'string' ? profileBlock.name : profileBlock.name?.ru || ''}
                        onChange={(e) => onUpdateProfile({ name: e.target.value })}
                        className="mt-2 bg-card/60 backdrop-blur-xl border-border/30 rounded-xl"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">{t('settings.bio', 'Описание')}</Label>
                      <Textarea
                        value={typeof profileBlock.bio === 'string' ? profileBlock.bio : profileBlock.bio?.ru || ''}
                        onChange={(e) => onUpdateProfile({ bio: e.target.value })}
                        rows={3}
                        className="mt-2 bg-card/60 backdrop-blur-xl border-border/30 rounded-xl"
                      />
                    </div>
                  </div>
                </Card>
              )}
              
              {/* Niche/Category */}
              {onNicheChange && (
                <Card className="p-5 bg-card/40 backdrop-blur-xl border border-border/20 rounded-2xl shadow-glass">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Tag className="h-4 w-4 text-primary" />
                    </div>
                    {t('settings.niche', 'Category')}
                  </h3>
                  <NicheSelector value={niche} onChange={onNicheChange} />
                </Card>
              )}

              {/* Gallery Preview Image */}
              {onPreviewUrlChange && (
                <Card className="p-5 bg-card/40 backdrop-blur-xl border border-border/20 rounded-2xl shadow-glass">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                      <Image className="h-4 w-4 text-violet-500" />
                    </div>
                    {t('settings.preview', 'Gallery Preview')}
                  </h3>
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {t('settings.previewDesc', 'Custom image shown in the gallery')}
                    </p>
                    <MediaUpload
                      value={previewUrl || ''}
                      onChange={(url) => onPreviewUrlChange(url || null)}
                      allowGif={isPremium}
                    />
                    {previewUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPreviewUrlChange(null)}
                        className="text-xs text-muted-foreground hover:text-destructive w-full"
                      >
                        {t('settings.removePreview', 'Remove custom preview')}
                      </Button>
                    )}
                  </div>
                </Card>
              )}

              {/* Page Background Settings */}
              {onPageBackgroundChange && (
                <Card className="p-5 bg-card/40 backdrop-blur-xl border border-border/20 rounded-2xl shadow-glass">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                      <Palette className="h-4 w-4 text-indigo-500" />
                    </div>
                    {t('settings.pageBackground', 'Фон страницы')}
                  </h3>
                  <PageBackgroundSettings
                    background={pageBackground}
                    onChange={onPageBackgroundChange}
                    canUseFeature={canUseCustomPageBackground ?? false}
                  />
                </Card>
              )}
            </TabsContent>
            
            {/* Chatbot Tab */}
            <TabsContent value="chatbot" className="p-4 space-y-4 mt-0">
              <Card className="p-5 bg-card/40 backdrop-blur-xl border border-border/20 rounded-2xl shadow-glass">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  {t('settings.chatbotContext', 'Контекст AI чатбота')}
                </h3>
                <div className="space-y-3">
                  <Textarea
                    value={chatbotContext}
                    onChange={(e) => onChatbotContextChange(e.target.value)}
                    onBlur={onSave}
                    placeholder={t('settings.chatbotPlaceholder', 'Добавьте скрытый контекст для AI чатбота (цены, услуги, доступность...)')}
                    rows={6}
                    className="text-sm bg-card/60 backdrop-blur-xl border-border/30 rounded-xl"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('settings.chatbotHelp', 'Помогает AI точно отвечать на вопросы посетителей')}
                  </p>
                </div>
              </Card>
              
              <Card className="p-5 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent backdrop-blur-xl border border-primary/20 rounded-2xl shadow-glass">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  {t('settings.aiTools', 'AI инструменты')}
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full justify-start rounded-xl bg-card/40 backdrop-blur-xl border-border/30 hover:bg-card/60"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenSEOGenerator();
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-2 text-primary" />
                  {t('settings.seoGenerator', 'SEO генератор')}
                </Button>
              </Card>
            </TabsContent>
            
            {/* Collabs Tab */}
            <TabsContent value="collabs" className="p-4 mt-0">
              <CollaborationPanel userId={userId} pageId={pageId} />
            </TabsContent>
            
            {/* Friends Tab */}
            <TabsContent value="friends" className="p-4 space-y-4 mt-0">
              <Card className="p-5 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent backdrop-blur-xl border border-border/20 rounded-2xl shadow-glass">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-400/20 to-purple-500/20 flex items-center justify-center">
                    <UserPlus className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{t('settings.friends', 'Друзья')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.friendsDesc', 'Добавляйте друзей и получайте бонусы')}
                    </p>
                  </div>
                </div>
                <Button
                  className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  onClick={() => {
                    onOpenChange(false);
                    // Will be handled by parent
                    window.dispatchEvent(new CustomEvent('openFriends'));
                  }}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('settings.openFriendsPanel', 'Открыть панель друзей')}
                </Button>
              </Card>
            </TabsContent>
            
            {/* Premium Tab */}
            <TabsContent value="premium" className="p-4 space-y-4 mt-0">
              {!premiumLoading && (
                <Card className={`p-5 backdrop-blur-xl border rounded-2xl shadow-glass ${isPremium ? 'bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-transparent border-amber-500/30' : 'bg-card/40 border-border/20'}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center backdrop-blur-xl ${isPremium ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30' : 'bg-muted/50'}`}>
                      <Crown className={`h-6 w-6 ${isPremium ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {isPremium ? t('settings.premiumActive', 'Премиум активен') : t('settings.freePlan', 'Бесплатный план')}
                      </h3>
                      {!isPremium && (
                        <p className="text-sm text-muted-foreground">
                          {t('settings.upgradeToUnlock', 'Обновитесь для доступа ко всем функциям')}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button 
                    onClick={() => {
                      onOpenChange(false);
                      window.location.href = '/pricing';
                    }}
                    className={`w-full rounded-xl ${!isPremium ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600' : ''} shadow-glass-lg transition-all duration-300 hover:scale-[1.02]`}
                    variant={isPremium ? 'outline' : 'default'}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    {isPremium ? t('pricing.currentPlan', 'Текущий план') : t('pricing.subscribe', 'Подписаться')}
                  </Button>
                </Card>
              )}
              
              {/* CRM - Premium only */}
              {isPremium && (
                <Card className="p-5 bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-transparent backdrop-blur-xl border border-emerald-500/20 rounded-2xl shadow-glass">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{t('crm.title', 'CRM')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('crm.description', 'Manage your leads and analytics')}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                    onClick={() => setLeadsPanelOpen(true)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    {t('crm.openPanel', 'Open CRM')}
                  </Button>
                </Card>
              )}
              
              {/* Notifications */}
              <Card className="p-5 bg-card/40 backdrop-blur-xl border border-border/20 rounded-2xl shadow-glass">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Bell className="h-4 w-4 text-green-500" />
                  </div>
                  {t('settings.notifications', 'Notifications')}
                </h3>
                <div className="space-y-4">
                  {/* Email */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-background/30 border border-border/20">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">{t('settings.emailLabel', 'Email')}</Label>
                      <p className="text-xs text-muted-foreground">{t('settings.emailDesc', 'New leads via email')}</p>
                    </div>
                    <Switch
                      checked={emailNotificationsEnabled ?? true}
                      onCheckedChange={onEmailNotificationsChange}
                    />
                  </div>
                  
                  {/* Telegram */}
                  <div className="p-3 rounded-xl bg-background/30 border border-border/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-blue-500" />
                        <div>
                          <Label className="text-sm font-medium">{t('settings.telegramLabel', 'Telegram')}</Label>
                          <p className="text-xs text-muted-foreground">{t('settings.telegramDesc', 'Instant notifications')}</p>
                        </div>
                      </div>
                      <Switch
                        checked={telegramEnabled ?? false}
                        onCheckedChange={(enabled) => {
                          if (!enabled) {
                            onTelegramChange?.(false, null);
                          } else if (localTelegramChatId.trim()) {
                            onTelegramChange?.(true, localTelegramChatId.trim());
                          }
                        }}
                      />
                    </div>
                    
                    {/* Telegram Setup */}
                    <div className="space-y-2 pt-2 border-t border-border/20">
                      <Label className="text-xs text-muted-foreground">{t('settings.telegramChatId', 'Your Chat ID')}</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="123456789"
                          value={localTelegramChatId}
                          onChange={(e) => {
                            setLocalTelegramChatId(e.target.value.replace(/\D/g, ''));
                            setTelegramValidated(false);
                          }}
                          className="bg-background/50 text-sm font-mono rounded-xl"
                        />
                        <Button
                          size="sm"
                          onClick={handleValidateAndSaveTelegram}
                          disabled={!localTelegramChatId.trim() || telegramValidating || telegramValidated}
                          className="shrink-0 rounded-xl"
                        >
                          {telegramValidating ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : telegramValidated ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            t('settings.telegramVerify', 'Verify')
                          )}
                        </Button>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{t('settings.telegramHelp', 'Get your ID from')}</span>
                        <a 
                          href="https://t.me/userinfobot" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-400 inline-flex items-center gap-0.5"
                        >
                          @userinfobot
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              
              {/* Referral Program */}
              <ReferralPanel userId={userId} />
              
              {/* CRM Automations - Premium only */}
              {isPremium && userId && (
                <AutomationsPanel userId={userId} isPremium={isPremium} />
              )}
              
              {/* Templates Section */}
              {(onOpenSaveTemplate || onOpenMyTemplates) && (
                <Card className="p-5 bg-card/40 backdrop-blur-xl border border-border/20 rounded-2xl shadow-glass">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-orange-500/10 flex items-center justify-center">
                      <Package className="h-4 w-4 text-orange-500" />
                    </div>
                    {t('settings.templates', 'Шаблоны')}
                  </h3>
                  <div className="space-y-2">
                    {onOpenSaveTemplate && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start rounded-xl bg-card/40 backdrop-blur-xl border-border/30 hover:bg-card/60"
                        onClick={() => {
                          onOpenChange(false);
                          onOpenSaveTemplate();
                        }}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {t('settings.saveAsTemplate', 'Сохранить как шаблон')}
                      </Button>
                    )}
                    {onOpenMyTemplates && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start rounded-xl bg-card/40 backdrop-blur-xl border-border/30 hover:bg-card/60"
                        onClick={() => {
                          onOpenChange(false);
                          onOpenMyTemplates();
                        }}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        {t('settings.myTemplates', 'Мои шаблоны')}
                      </Button>
                    )}
                  </div>
                </Card>
              )}
              
              {/* Verification Section */}
              <Card className="p-5 bg-card/40 backdrop-blur-xl border border-border/20 rounded-2xl shadow-glass">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-blue-500" />
                  </div>
                  {t('settings.verification', 'Верификация')}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {t('settings.verificationDesc', 'Подтвердите личность для получения значка верификации')}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl bg-card/40 backdrop-blur-xl border-border/30 hover:bg-card/60"
                  onClick={() => {
                    onOpenChange(false);
                    window.dispatchEvent(new CustomEvent('openVerification'));
                  }}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  {t('settings.openVerification', 'Пройти верификацию')}
                </Button>
              </Card>
              
              {/* Sign Out */}
              <Card className="p-5 bg-card/40 backdrop-blur-xl border border-border/20 rounded-2xl shadow-glass">
                <Button 
                  variant="outline" 
                  onClick={onSignOut}
                  className="w-full text-destructive hover:text-destructive rounded-xl bg-destructive/5 border-destructive/20 hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('auth.signOut', 'Выйти')}
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
    
    {/* CRM Leads Panel */}
    <LeadsPanel open={leadsPanelOpen} onOpenChange={setLeadsPanelOpen} />
  </>
  );
});
