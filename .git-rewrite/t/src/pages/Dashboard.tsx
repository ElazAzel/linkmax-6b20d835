import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  LogOut, 
  Save, 
  Eye, 
  Upload, 
  Crown, 
  Sparkles, 
  Wand2, 
  MessageCircle,
  LayoutTemplate,
  Trophy,
  Users,
  X,
  Undo2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCloudPageState } from '@/hooks/useCloudPageState';
import { usePremiumStatus } from '@/hooks/usePremiumStatus';
import { useBlockHints } from '@/hooks/useBlockHints';
import { useAchievements } from '@/hooks/useAchievements';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { PreviewEditor } from '@/components/editor/PreviewEditor';
import { TemplateGallery } from '@/components/editor/TemplateGallery';
import { MobileToolbar } from '@/components/editor/MobileToolbar';
import { MobileSettingsSheet } from '@/components/editor/MobileSettingsSheet';
import { PullToRefresh } from '@/components/editor/PullToRefresh';
import { BlockEditor } from '@/components/BlockEditor';
import { AIGenerator } from '@/components/AIGenerator';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { LocalStorageMigration } from '@/components/LocalStorageMigration';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { NicheOnboarding } from '@/components/onboarding/NicheOnboarding';
import { AchievementNotification } from '@/components/achievements/AchievementNotification';
import { InstallPromptDialog } from '@/components/InstallPromptDialog';
import { AchievementsPanel } from '@/components/achievements/AchievementsPanel';
import { LeadsPanel } from '@/components/crm/LeadsPanel';
import { Card } from '@/components/ui/card';
import { createBlock } from '@/lib/block-factory';
import { openPremiumPurchase } from '@/lib/upgrade-utils';
import { toast } from 'sonner';
import type { Block, ProfileBlock } from '@/types/page';
import type { UserStats } from '@/types/achievements';

interface DeletedBlockInfo {
  block: Block;
  position: number;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isPremium, isLoading: premiumLoading } = usePremiumStatus();
  const blockHints = useBlockHints();
  const achievements = useAchievements();
  const userProfile = useUserProfile(user?.id);
  const { playAdd, playDelete, playError } = useSoundEffects();
  const isMobile = useIsMobile();
  const haptic = useHapticFeedback();
  const {
    pageData,
    chatbotContext,
    setChatbotContext,
    loading,
    saving,
    save,
    publish,
    addBlock,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    updateTheme,
    refresh,
  } = useCloudPageState();

  const [migrationKey, setMigrationKey] = useState(0);
  const [editingBlock, setEditingBlock] = useState<Block | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [aiGeneratorType, setAiGeneratorType] = useState<'magic-title' | 'sales-copy' | 'seo' | 'ai-builder'>('ai-builder');
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showNicheOnboarding, setShowNicheOnboarding] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showLeads, setShowLeads] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState('');
  
  // Undo functionality
  const [lastDeletedBlock, setLastDeletedBlock] = useState<DeletedBlockInfo | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle undo - restore deleted block
  const handleUndo = useCallback(() => {
    if (!lastDeletedBlock || !pageData) return;
    
    haptic.success();
    addBlock(lastDeletedBlock.block, lastDeletedBlock.position);
    setLastDeletedBlock(null);
    
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    
    toast.success('Block restored');
  }, [lastDeletedBlock, pageData, addBlock, haptic]);

  // Handle delete with undo capability
  const handleDeleteBlock = useCallback((blockId: string) => {
    if (!pageData) return;
    
    const blockIndex = pageData.blocks.findIndex(b => b.id === blockId);
    const block = pageData.blocks.find(b => b.id === blockId);
    
    if (!block || block.type === 'profile') return;
    
    // Store for undo
    setLastDeletedBlock({ block, position: blockIndex });
    
    // Clear previous timeout
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    
    // Set timeout to clear undo option
    undoTimeoutRef.current = setTimeout(() => {
      setLastDeletedBlock(null);
      undoTimeoutRef.current = null;
    }, 5000);
    
    // Delete the block
    deleteBlock(blockId);
    playDelete();
    
    // Show toast with undo button
    toast(
      <div className="flex items-center gap-3">
        <span>Block deleted</span>
        <Button 
          size="sm" 
          variant="outline"
          className="h-7 px-2 gap-1"
          onClick={(e) => {
            e.stopPropagation();
            // Trigger undo
            if (block) {
              haptic.success();
              addBlock(block, blockIndex);
              setLastDeletedBlock(null);
              if (undoTimeoutRef.current) {
                clearTimeout(undoTimeoutRef.current);
                undoTimeoutRef.current = null;
              }
              toast.success('Block restored');
            }
          }}
        >
          <Undo2 className="h-3.5 w-3.5" />
          Undo
        </Button>
      </div>,
      {
        duration: 5000,
      }
    );
  }, [pageData, deleteBlock, playDelete, addBlock, haptic]);

  // Check achievements whenever blocks or features change
  useEffect(() => {
    if (!pageData || achievements.loading || !user) return;

    const blocksUsed = new Set(pageData.blocks.map(b => b.type));
    const featuresUsed = new Set<string>();
    
    // Track feature usage
    if (chatbotContext && chatbotContext.length > 0) {
      featuresUsed.add('chatbot');
    }

    const stats: UserStats = {
      blocksUsed,
      totalBlocks: pageData.blocks.length,
      featuresUsed,
      pageViews: 0,
      published: false,
    };

    achievements.checkAchievements(stats);
  }, [pageData, chatbotContext, achievements, user]);

  // Initialize username input
  useEffect(() => {
    if (userProfile.profile?.username) {
      setUsernameInput(userProfile.profile.username);
    }
  }, [userProfile.profile]);

  // Check if user has completed niche onboarding (show first for new users)
  useEffect(() => {
    const hasCompletedNicheOnboarding = localStorage.getItem('linkmax_niche_onboarding_completed');
    const hasCompletedOnboarding = localStorage.getItem('linkmax_onboarding_completed');
    
    if (!hasCompletedNicheOnboarding && user && pageData) {
      setTimeout(() => setShowNicheOnboarding(true), 500);
    } else if (!hasCompletedOnboarding && user && pageData) {
      setTimeout(() => setShowOnboarding(true), 1000);
    }
  }, [user, pageData]);

  // Redirect if not logged in
  useEffect(() => {
    if (!user && !loading) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleInsertBlock = (blockType: string, position: number) => {
    try {
      const newBlock = createBlock(blockType);
      
      const premiumBlocks = ['video', 'carousel', 'custom_code', 'form', 'newsletter', 'testimonial', 'scratch', 'search'];
      if (premiumBlocks.includes(blockType) && !isPremium) {
        toast.error('This block requires Premium');
        playError();
        return;
      }

      addBlock(newBlock, position);
      playAdd();
      toast.success('Block added');
      
      blockHints.showHint(blockType, newBlock.id);
    } catch (error) {
      toast.error('Failed to add block');
      playError();
      console.error(error);
    }
  };

  const handleEditBlock = (block: Block) => {
    setEditingBlock(block);
    setEditorOpen(true);
  };

  const handleSaveBlock = (updates: Partial<Block>) => {
    if (editingBlock) {
      updateBlock(editingBlock.id, updates);
    }
  };

  const handleApplyTemplate = (blocks: Block[]) => {
    blocks.forEach((block, index) => {
      addBlock({ ...block, id: `${block.type}-${Date.now()}-${index}` });
    });
    toast.success(`Added ${blocks.length} blocks from template`);
  };

  const handleAIResult = (result: any) => {
    if (aiGeneratorType === 'ai-builder') {
      const { profile, blocks } = result;
      
      const profileBlock = pageData?.blocks.find(b => b.type === 'profile');
      if (profile && profileBlock) {
        updateBlock(profileBlock.id, { 
          name: profile.name, 
          bio: profile.bio 
        });
      }
      
      blocks.forEach((blockData: any, index: number) => {
        const newBlock: Block = {
          id: `${blockData.type}-${Date.now()}-${index}`,
          ...blockData,
        };
        addBlock(newBlock);
      });
      
      toast.success(`Added ${blocks.length} blocks from AI`);
    }
  };

  const handleUpdateUsername = async () => {
    if (!usernameInput.trim()) {
      toast.error('Please enter a username');
      return;
    }

    const success = await userProfile.updateUsername(usernameInput.trim());
    if (success) {
      await save();
    }
  };

  const handleShare = async () => {
    const slug = await publish();
    if (slug) {
      const url = `${window.location.origin}/${slug}`;
      navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
      
      const hasSeenInstallPrompt = localStorage.getItem('linkmax_install_prompt_shown');
      if (!hasSeenInstallPrompt) {
        setPublishedUrl(url);
        setTimeout(() => setShowInstallPrompt(true), 1000);
        localStorage.setItem('linkmax_install_prompt_shown', 'true');
      }
    }
  };

  const handlePreview = async () => {
    await save();
    const slug = await publish();
    if (slug) {
      window.open(`/${slug}`, '_blank');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('linkmax_onboarding_completed', 'true');
    setShowOnboarding(false);
    toast.success('Добро пожаловать! Начните создавать свою страницу.');
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem('linkmax_onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  const handleNicheOnboardingComplete = (profile: { name: string; bio: string }, blocks: Block[]) => {
    const profileBlock = pageData?.blocks.find(b => b.type === 'profile');
    if (profile && profileBlock) {
      updateBlock(profileBlock.id, { 
        name: profile.name, 
        bio: profile.bio 
      });
    }
    
    blocks.forEach((block) => {
      addBlock(block);
    });
    
    setShowNicheOnboarding(false);
    setTimeout(() => setShowOnboarding(true), 500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your page...</p>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load page</p>
        </div>
      </div>
    );
  }

  const profileBlock = pageData.blocks.find(b => b.type === 'profile') as ProfileBlock | undefined;

  return (
    <div className="min-h-screen bg-background">
      {/* Migration Notice */}
      {user && (
        <LocalStorageMigration 
          key={migrationKey}
          userId={user.id} 
          onMigrated={() => {
            setMigrationKey(prev => prev + 1);
            window.location.reload();
          }}
        />
      )}

      {/* Desktop Header - Hidden on Mobile */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-sm shadow-sm hidden md:block">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 animate-fade-in">
            <img src="/pwa-maskable-512x512.png" alt="LinkMAX" className="h-8 w-8 animate-scale-in hover-scale" />
            <h1 className="text-xl font-bold text-primary">LinkMAX</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* AI Tools */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setAiGeneratorType('ai-builder');
                setAiGeneratorOpen(true);
              }}
            >
              <Wand2 className="h-4 w-4 mr-2" />
              AI Builder
            </Button>

            {/* Templates */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setTemplateGalleryOpen(true)}
            >
              <LayoutTemplate className="h-4 w-4 mr-2" />
              Templates
            </Button>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Settings Toggle */}
            <Button 
              variant={showSettings ? "default" : "ghost"} 
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Settings
            </Button>

            {/* CRM Button */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowLeads(true)}
            >
              <Users className="h-4 w-4 mr-2" />
              CRM
            </Button>

            {/* Achievements Button */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAchievements(true)}
              className="relative"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Achievements
              {achievements.getProgress().unlocked > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold flex items-center justify-center text-primary-foreground">
                  {achievements.getProgress().unlocked}
                </span>
              )}
            </Button>

            <div className="h-6 w-px bg-border" />

            {/* Save */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={save} 
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>

            {/* Preview */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePreview}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>

            {/* Publish/Share */}
            <Button size="sm" onClick={handleShare} data-onboarding="share-button">
              <Upload className="h-4 w-4 mr-2" />
              Share
            </Button>

            <div className="h-6 w-px bg-border" />

            {/* Sign Out */}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Header - Simplified */}
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur-sm shadow-sm md:hidden">
        <div className="px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/pwa-maskable-512x512.png" alt="LinkMAX" className="h-7 w-7" />
            <h1 className="text-lg font-bold text-primary">LinkMAX</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative">
        {/* Desktop Settings Sidebar */}
        {showSettings && !isMobile && (
          <div className="fixed left-0 top-14 bottom-0 w-80 bg-card border-r shadow-lg z-40 overflow-y-auto hidden md:block">
            <div className="p-6 space-y-6">
              {/* Close Button */}
              <div className="flex justify-end">
                <Button variant="ghost" size="icon" onClick={() => setShowSettings(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Username Settings */}
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Your Link</h3>
                <div className="space-y-3">
                  <div>
                    <Label>Username</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                        placeholder="username"
                        maxLength={30}
                        disabled={userProfile.saving}
                      />
                      <Button 
                        size="sm" 
                        onClick={handleUpdateUsername}
                        disabled={userProfile.saving || !usernameInput.trim()}
                      >
                        {userProfile.saving ? '...' : 'Save'}
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
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Profile</h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={typeof profileBlock.name === 'string' ? profileBlock.name : profileBlock.name?.ru || ''}
                        onChange={(e) => updateBlock(profileBlock.id, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Bio</Label>
                      <Textarea
                        value={typeof profileBlock.bio === 'string' ? profileBlock.bio : profileBlock.bio?.ru || ''}
                        onChange={(e) => updateBlock(profileBlock.id, { bio: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                </Card>
              )}

              {/* Premium Status */}
              {!premiumLoading && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className={`h-4 w-4 ${isPremium ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="font-semibold">
                      {isPremium ? 'Premium Active' : 'Free Plan'}
                    </span>
                  </div>
                  {!isPremium && (
                    <>
                      <p className="text-xs text-muted-foreground mb-3">
                        Upgrade to unlock all blocks and features
                      </p>
                      <Button 
                        size="sm" 
                        onClick={openPremiumPurchase}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      >
                        <Crown className="h-3.5 w-3.5 mr-1.5" />
                        Upgrade to Premium
                      </Button>
                    </>
                  )}
                </Card>
              )}

              {/* Chatbot Settings */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle className="h-4 w-4" />
                  <h3 className="font-semibold">AI Chatbot Context</h3>
                </div>
                <div className="space-y-2">
                  <Label>Hidden Information</Label>
                  <Textarea
                    value={chatbotContext}
                    onChange={(e) => setChatbotContext(e.target.value)}
                    onBlur={save}
                    placeholder="Add context for the AI chatbot..."
                    rows={6}
                    className="text-sm"
                  />
                </div>
              </Card>

              {/* AI Tools */}
              <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">AI Tools</h3>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setAiGeneratorType('seo');
                    setAiGeneratorOpen(true);
                  }}
                >
                  <Sparkles className="h-3 w-3 mr-2" />
                  SEO Generator
                </Button>
              </Card>
            </div>
          </div>
        )}

        {/* Preview Editor with Pull to Refresh */}
        <div className={`transition-all duration-300 ${showSettings && !isMobile ? 'md:ml-80' : ''}`}>
          <PullToRefresh
            onRefresh={async () => {
              if (refresh) {
                await refresh();
                toast.success('Page refreshed');
              }
            }}
            disabled={loading || saving}
          >
            <div className="py-4 pb-24 md:pb-8">
              <PreviewEditor
                blocks={pageData.blocks}
                isPremium={isPremium}
                onInsertBlock={handleInsertBlock}
                onEditBlock={handleEditBlock}
                onDeleteBlock={handleDeleteBlock}
                onReorderBlocks={reorderBlocks}
                onUpdateBlock={updateBlock}
                activeBlockHint={blockHints.activeHint}
                onDismissHint={blockHints.dismissHint}
              />
            </div>
          </PullToRefresh>
        </div>
      </div>

      {/* Mobile Bottom Toolbar */}
      {isMobile && (
        <MobileToolbar
          saving={saving}
          onSave={save}
          onPreview={handlePreview}
          onShare={handleShare}
          onOpenSettings={() => setShowMobileSettings(true)}
          onOpenAIBuilder={() => {
            setAiGeneratorType('ai-builder');
            setAiGeneratorOpen(true);
          }}
          onOpenTemplates={() => setTemplateGalleryOpen(true)}
          onOpenAchievements={() => setShowAchievements(true)}
          onOpenCRM={() => setShowLeads(true)}
          achievementCount={achievements.getProgress().unlocked}
        />
      )}

      {/* Mobile Settings Sheet */}
      <MobileSettingsSheet
        open={showMobileSettings}
        onOpenChange={setShowMobileSettings}
        usernameInput={usernameInput}
        onUsernameChange={setUsernameInput}
        onUpdateUsername={handleUpdateUsername}
        usernameSaving={userProfile.saving}
        profileBlock={profileBlock}
        onUpdateProfile={(updates) => {
          if (profileBlock) {
            updateBlock(profileBlock.id, updates);
          }
        }}
        isPremium={isPremium}
        premiumLoading={premiumLoading}
        chatbotContext={chatbotContext}
        onChatbotContextChange={setChatbotContext}
        onSave={save}
        onOpenSEOGenerator={() => {
          setAiGeneratorType('seo');
          setAiGeneratorOpen(true);
        }}
        onSignOut={handleSignOut}
      />

      {/* Modals */}
      {editingBlock && (
        <BlockEditor
          block={editingBlock}
          isOpen={editorOpen}
          onClose={() => setEditorOpen(false)}
          onSave={handleSaveBlock}
        />
      )}

      <TemplateGallery
        open={templateGalleryOpen}
        onClose={() => setTemplateGalleryOpen(false)}
        onSelect={handleApplyTemplate}
      />

      {aiGeneratorOpen && (
        <AIGenerator
          type={aiGeneratorType}
          isOpen={aiGeneratorOpen}
          onClose={() => setAiGeneratorOpen(false)}
          onResult={handleAIResult}
        />
      )}

      {/* Niche Onboarding */}
      {showNicheOnboarding && (
        <NicheOnboarding
          isOpen={showNicheOnboarding}
          onClose={() => {
            localStorage.setItem('linkmax_niche_onboarding_completed', 'true');
            setShowNicheOnboarding(false);
          }}
          onComplete={handleNicheOnboardingComplete}
        />
      )}

      {/* Onboarding Tour */}
      {showOnboarding && (
        <OnboardingTour
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Achievement Notification */}
      {achievements.newAchievement && (
        <AchievementNotification
          achievement={achievements.newAchievement}
          onDismiss={achievements.dismissAchievementNotification}
        />
      )}

      {/* Achievements Panel */}
      {showAchievements && (
        <AchievementsPanel onClose={() => setShowAchievements(false)} />
      )}

      {/* Leads Panel (CRM) */}
      <LeadsPanel open={showLeads} onOpenChange={setShowLeads} />

      {/* Install Prompt Dialog */}
      <InstallPromptDialog
        open={showInstallPrompt}
        onClose={() => setShowInstallPrompt(false)}
        pageUrl={publishedUrl}
      />
    </div>
  );
}
