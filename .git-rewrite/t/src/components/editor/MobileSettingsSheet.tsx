import { memo, useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crown, 
  MessageCircle, 
  Sparkles, 
  User, 
  Link2,
  LogOut,
  X,
} from 'lucide-react';
import { openPremiumPurchase } from '@/lib/upgrade-utils';
import type { ProfileBlock } from '@/types/page';

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
  premiumLoading: boolean;
  
  // Chatbot settings
  chatbotContext: string;
  onChatbotContextChange: (value: string) => void;
  onSave: () => void;
  
  // AI Tools
  onOpenSEOGenerator: () => void;
  
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
  premiumLoading,
  chatbotContext,
  onChatbotContextChange,
  onSave,
  onOpenSEOGenerator,
  onSignOut,
}: MobileSettingsSheetProps) {
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-3xl">
        <SheetHeader className="p-4 pb-2 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <SheetTitle>Settings</SheetTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <SheetDescription className="sr-only">Page and account settings</SheetDescription>
        </SheetHeader>
        
        <div className="overflow-y-auto h-full pb-24">
          <Tabs defaultValue="link" className="w-full">
            <TabsList className="w-full sticky top-0 bg-background z-10 h-12 rounded-none border-b p-1">
              <TabsTrigger value="link" className="flex-1 gap-1.5">
                <Link2 className="h-4 w-4" />
                <span className="hidden xs:inline">Link</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex-1 gap-1.5">
                <User className="h-4 w-4" />
                <span className="hidden xs:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="chatbot" className="flex-1 gap-1.5">
                <MessageCircle className="h-4 w-4" />
                <span className="hidden xs:inline">AI</span>
              </TabsTrigger>
              <TabsTrigger value="premium" className="flex-1 gap-1.5">
                <Crown className="h-4 w-4" />
                <span className="hidden xs:inline">Plan</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Link Tab */}
            <TabsContent value="link" className="p-4 space-y-4 mt-0">
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Your Link
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label>Username</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={usernameInput}
                        onChange={(e) => onUsernameChange(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                        placeholder="username"
                        maxLength={30}
                        disabled={usernameSaving}
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
                      <p className="text-xs text-muted-foreground mt-2 break-all">
                        {window.location.origin}/{usernameInput}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            {/* Profile Tab */}
            <TabsContent value="profile" className="p-4 space-y-4 mt-0">
              {profileBlock && (
                <Card className="p-4">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile Info
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={typeof profileBlock.name === 'string' ? profileBlock.name : profileBlock.name?.ru || ''}
                        onChange={(e) => onUpdateProfile({ name: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Bio</Label>
                      <Textarea
                        value={typeof profileBlock.bio === 'string' ? profileBlock.bio : profileBlock.bio?.ru || ''}
                        onChange={(e) => onUpdateProfile({ bio: e.target.value })}
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </Card>
              )}
            </TabsContent>
            
            {/* Chatbot Tab */}
            <TabsContent value="chatbot" className="p-4 space-y-4 mt-0">
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  AI Chatbot Context
                </h3>
                <div className="space-y-3">
                  <Textarea
                    value={chatbotContext}
                    onChange={(e) => onChatbotContextChange(e.target.value)}
                    onBlur={onSave}
                    placeholder="Add hidden context for the AI chatbot (pricing, services, availability...)"
                    rows={6}
                    className="text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    This helps the AI answer visitor questions accurately
                  </p>
                </div>
              </Card>
              
              <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Tools
                </h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenSEOGenerator();
                  }}
                >
                  <Sparkles className="h-3 w-3 mr-2" />
                  SEO Generator
                </Button>
              </Card>
            </TabsContent>
            
            {/* Premium Tab */}
            <TabsContent value="premium" className="p-4 space-y-4 mt-0">
              {!premiumLoading && (
                <Card className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isPremium ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Crown className={`h-5 w-5 ${isPremium ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {isPremium ? 'Premium Active' : 'Free Plan'}
                      </h3>
                      {!isPremium && (
                        <p className="text-xs text-muted-foreground">
                          Upgrade to unlock all features
                        </p>
                      )}
                    </div>
                  </div>
                  {!isPremium && (
                    <Button 
                      onClick={openPremiumPurchase}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade to Premium
                    </Button>
                  )}
                </Card>
              )}
              
              {/* Sign Out */}
              <Card className="p-4">
                <Button 
                  variant="outline" 
                  onClick={onSignOut}
                  className="w-full text-destructive hover:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
});
