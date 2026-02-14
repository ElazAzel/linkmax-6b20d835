import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Crown, Grid3X3, MessageCircle, Sparkles, X, Bell, Send, Tag, Image, ExternalLink, Check, Loader2, Users } from 'lucide-react';
import { openPremiumPurchase } from '@/lib/upgrade-utils';
import type { ProfileBlock, GridConfig, EditorMode } from '@/types/page';
import { GalleryToggle } from '@/components/gallery/GalleryToggle';
import { StreakDisplay } from '@/components/streak/StreakDisplay';
import { DailyQuestsPanel } from '@/components/quests/DailyQuestsPanel';
import { NicheSelector } from '@/components/settings/NicheSelector';
import { MediaUpload } from '@/components/form-fields/MediaUpload';
import { MultilingualInput } from '@/components/form-fields/MultilingualInput';
import { CollaborationPanel } from '@/components/collaboration/CollaborationPanel';
import { migrateToMultilingual } from '@/lib/i18n-helpers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Quest } from '@/services/quests';
import type { Niche } from '@/lib/niches';

interface SettingsSidebarProps {
  show: boolean;
  onClose: () => void;
  usernameInput: string;
  onUsernameChange: (value: string) => void;
  onUpdateUsername: () => void;
  usernameSaving: boolean;
  profileBlock?: ProfileBlock;
  onUpdateProfile: (updates: Partial<ProfileBlock>) => void;
  isPremium: boolean;
  premiumLoading: boolean;
  chatbotContext: string;
  onChatbotContextChange: (value: string) => void;
  onSave: () => void;
  onOpenSEOGenerator: () => void;
  editorMode?: EditorMode;
  gridConfig?: GridConfig;
  onGridConfigChange?: (config: Partial<GridConfig>) => void;
  emailNotificationsEnabled?: boolean;
  onEmailNotificationsChange?: (enabled: boolean) => void;
  telegramEnabled?: boolean;
  telegramChatId?: string;
  onTelegramChange?: (enabled: boolean, chatId: string | null) => void;
  userId?: string;
  dailyQuests?: Quest[];
  completedQuests?: string[];
  questsProgress?: { completed: number; total: number; bonusEarned: number };
  questsLoading?: boolean;
  niche?: Niche;
  onNicheChange?: (niche: Niche) => void;
  previewUrl?: string;
  onPreviewUrlChange?: (url: string | null) => void;
  pageId?: string;
}

export function SettingsSidebar({
  show,
  onClose,
  usernameInput,
  onUsernameChange,
  onUpdateUsername,
  usernameSaving,
  profileBlock,
  onUpdateProfile,
  isPremium,
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
  dailyQuests,
  completedQuests,
  questsProgress,
  questsLoading,
  niche,
  onNicheChange,
  previewUrl,
  onPreviewUrlChange,
  pageId,
}: SettingsSidebarProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('settings');
  const [localTelegramChatId, setLocalTelegramChatId] = useState(telegramChatId || '');
  const [telegramValidating, setTelegramValidating] = useState(false);
  const [telegramValidated, setTelegramValidated] = useState(false);

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

  if (!show) return null;

  const getStringValue = (value: string | { ru?: string; en?: string; kk?: string } | undefined): string => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    return value.ru || value.en || value.kk || '';
  };

  return (
    <div className="fixed left-4 top-20 bottom-4 w-80 bg-card/50 backdrop-blur-2xl border border-border/30 rounded-2xl shadow-glass-lg z-40 overflow-y-auto hidden md:block">
      <div className="p-4 space-y-4">
        {/* Header with Close and Tabs */}
        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-2 bg-background/50">
              <TabsTrigger value="settings" className="text-xs">Настройки</TabsTrigger>
              <TabsTrigger value="collabs" className="text-xs">
                <Users className="h-3 w-3 mr-1" />
                Коллабы
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-foreground/5 ml-2">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {activeTab === 'collabs' && userId && pageId ? (
          <CollaborationPanel userId={userId} pageId={pageId} />
        ) : (
          <div className="space-y-6">

        {/* Grid Settings - only show in grid mode */}
        {editorMode === 'grid' && onGridConfigChange && (
          <Card className="p-4 bg-card/60 backdrop-blur-xl border-border/30">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Grid3X3 className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold">Grid Settings</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Desktop Columns</Label>
                <Select
                  value={String(gridConfig?.columnsDesktop || 3)}
                  onValueChange={(val) => onGridConfigChange({ columnsDesktop: parseInt(val) })}
                >
                  <SelectTrigger className="bg-background/50 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">2 columns</SelectItem>
                    <SelectItem value="3">3 columns</SelectItem>
                    <SelectItem value="4">4 columns</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Mobile Columns</Label>
                <Select
                  value={String(gridConfig?.columnsMobile || 2)}
                  onValueChange={(val) => onGridConfigChange({ columnsMobile: parseInt(val) })}
                >
                  <SelectTrigger className="bg-background/50 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 column</SelectItem>
                    <SelectItem value="2">2 columns</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        )}

        {/* Username Settings */}
        <Card className="p-4 bg-card/60 backdrop-blur-xl border-border/30">
          <h3 className="font-semibold mb-4">Your Link</h3>
          <div className="space-y-3">
            <div>
              <Label>Username</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={usernameInput}
                  onChange={(e) =>
                    onUsernameChange(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))
                  }
                  placeholder="username"
                  maxLength={30}
                  disabled={usernameSaving}
                  className="bg-background/50"
                />
                <Button
                  size="sm"
                  onClick={onUpdateUsername}
                  disabled={usernameSaving || !usernameInput.trim()}
                >
                  {usernameSaving ? '...' : 'Save'}
                </Button>
              </div>
              {usernameInput && (
                <p className="text-xs text-muted-foreground mt-1">
                  Your link: {window.location.origin}/{usernameInput}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Profile Settings */}
        {profileBlock && (
          <Card className="p-4 bg-card/60 backdrop-blur-xl border-border/30">
            <h3 className="font-semibold mb-4">{t('settings.profile', 'Profile')}</h3>
            <div className="space-y-4">
              <MultilingualInput
                label={t('settings.name', 'Name')}
                value={migrateToMultilingual(profileBlock.name)}
                onChange={(value) => onUpdateProfile({ name: value })}
                placeholder={t('settings.namePlaceholder', 'Your name')}
              />
              <MultilingualInput
                label={t('settings.bio', 'Bio')}
                value={migrateToMultilingual(profileBlock.bio)}
                onChange={(value) => onUpdateProfile({ bio: value })}
                type="textarea"
                placeholder={t('settings.bioPlaceholder', 'Tell about yourself')}
              />
            </div>
          </Card>
        )}

        {/* Niche/Category */}
        {onNicheChange && (
          <Card className="p-4 bg-card/60 backdrop-blur-xl border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <Tag className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-semibold">{t('settings.niche', 'Category')}</h3>
            </div>
            <NicheSelector value={niche} onChange={onNicheChange} />
          </Card>
        )}

        {/* Page Preview Image */}
        {onPreviewUrlChange && (
          <Card className="p-4 bg-card/60 backdrop-blur-xl border-border/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-lg bg-violet-500/10">
                <Image className="h-4 w-4 text-violet-500" />
              </div>
              <h3 className="font-semibold">{t('settings.preview', 'Gallery Preview')}</h3>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                {t('settings.previewDesc', 'Custom image shown in the gallery')}
              </Label>
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
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  {t('settings.removePreview', 'Remove custom preview')}
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Premium Status */}
        {!premiumLoading && (
          <Card
            className={`p-4 backdrop-blur-xl border-border/30 ${
              isPremium ? 'bg-primary/10' : 'bg-card/60'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${isPremium ? 'bg-primary/20' : 'bg-muted'}`}>
                <Crown
                  className={`h-4 w-4 ${isPremium ? 'text-primary' : 'text-muted-foreground'}`}
                />
              </div>
              <span className="font-semibold">{isPremium ? 'Premium Active' : 'Free Plan'}</span>
            </div>
            {!isPremium && (
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  Upgrade to unlock all blocks and features
                </p>
                <Button
                  size="sm"
                  onClick={openPremiumPurchase}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25"
                >
                  <Crown className="h-3.5 w-3.5 mr-1.5" />
                  Upgrade to Premium
                </Button>
              </>
            )}
          </Card>
        )}

        {/* Streak Display */}
        <StreakDisplay userId={userId} />

        {/* Daily Quests */}
        {dailyQuests && questsProgress && (
          <DailyQuestsPanel
            quests={dailyQuests}
            completedQuests={completedQuests || []}
            progress={questsProgress}
            loading={questsLoading}
          />
        )}

        {/* Gallery Toggle */}
        <GalleryToggle userId={userId} />

        {/* Notifications Settings */}
        <Card className="p-4 bg-card/60 backdrop-blur-xl border-border/30">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 rounded-lg bg-green-500/10">
              <Bell className="h-4 w-4 text-green-500" />
            </div>
            <h3 className="font-semibold">{t('settings.notifications', 'Notifications')}</h3>
          </div>
          <div className="space-y-4">
            {/* Email */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-background/30 border border-border/20">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Email</Label>
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
                    <Label className="text-sm font-medium">Telegram</Label>
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
                    className="bg-background/50 text-sm font-mono"
                  />
                  <Button
                    size="sm"
                    onClick={handleValidateAndSaveTelegram}
                    disabled={!localTelegramChatId.trim() || telegramValidating || telegramValidated}
                    className="shrink-0"
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
        <Card className="p-4 bg-card/60 backdrop-blur-xl border-border/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-blue-500/10">
              <MessageCircle className="h-4 w-4 text-blue-500" />
            </div>
            <h3 className="font-semibold">AI Chatbot Context</h3>
          </div>
          <div className="space-y-2">
            <Label>Hidden Information</Label>
            <Textarea
              value={chatbotContext}
              onChange={(e) => onChatbotContextChange(e.target.value)}
              onBlur={onSave}
              placeholder="Add context for the AI chatbot..."
              rows={6}
              className="text-sm bg-background/50"
            />
          </div>
        </Card>

        {/* AI Tools */}
        <Card className="p-4 bg-gradient-to-br from-primary/10 via-violet-500/5 to-blue-500/10 backdrop-blur-xl border-primary/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">AI Tools</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start bg-background/50 hover:bg-background/70"
            onClick={onOpenSEOGenerator}
          >
            <Sparkles className="h-3 w-3 mr-2" />
            SEO Generator
          </Button>
        </Card>
          </div>
        )}
      </div>
    </div>
  );
}
