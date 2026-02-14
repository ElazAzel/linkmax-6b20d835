import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { Sparkles, Gift } from 'lucide-react';
import { z } from 'zod';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { applyReferralCode } from '@/services/referral';
import { TelegramVerification } from '@/components/auth/TelegramVerification';
import { supabase } from '@/integrations/supabase/client';

const authSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

type SignupStep = 'credentials' | 'telegram';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const { user, signUp, signIn, signInWithGoogle, signInWithApple } = useAuth();
  const { playSuccess, playError } = useSoundEffects();
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<'google' | 'apple' | null>(null);
  
  // Signup flow state
  const [signupStep, setSignupStep] = useState<SignupStep>('credentials');
  const [pendingEmail, setPendingEmail] = useState('');
  const [pendingPassword, setPendingPassword] = useState('');
  
  // Get referral code from URL
  const refCode = searchParams.get('ref');

  // Redirect if already logged in and apply referral
  useEffect(() => {
    if (user) {
      // Apply referral code if present
      if (refCode) {
        applyReferralCode(refCode, user.id).then((result) => {
          if (result.success) {
            toast.success(`🎉 +${result.bonusDays} дней Premium за реферальный код!`);
          }
        });
      }
      navigate('/dashboard');
    }
  }, [user, navigate, refCode]);

  const handleSignUpStep1 = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = formData.get('signup-email') as string;
    const password = formData.get('signup-password') as string;

    // Validate with zod schema
    const validation = authSchema.safeParse({ email, password });
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      playError();
      return;
    }

    // Save credentials and move to Telegram step
    setPendingEmail(validation.data.email);
    setPendingPassword(validation.data.password);
    setSignupStep('telegram');
  };

  const handleTelegramVerified = async (telegramChatId: string) => {
    setIsLoading(true);

    const { error } = await signUp(pendingEmail, pendingPassword);

    if (error) {
      console.error('Signup error:', error);
      toast.error(error.message || t('messages.failedToSignUp'));
      playError();
      setIsLoading(false);
      setSignupStep('credentials');
      return;
    }

    // Update user profile with telegram chat id after signup
    // This will be handled by the auth state change and profile creation trigger
    // We'll store the chat ID temporarily and update it after the user is created
    localStorage.setItem('pending_telegram_chat_id', telegramChatId);

    playSuccess();
    toast.success(t('messages.accountCreated'));
    // Auth state change will trigger redirect
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('signin-email') as string;
    const password = formData.get('signin-password') as string;

    // Validate with zod schema
    const validation = authSchema.safeParse({ email, password });
    
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      playError();
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(validation.data.email, validation.data.password);

    if (error) {
      console.error('Signin error:', error);
      toast.error(error.message || t('messages.failedToSignIn'));
      playError();
      setIsLoading(false);
      return;
    }

    playSuccess();
    toast.success(t('auth.welcomeBack'));
    // Auth state change will trigger redirect
  };

  const handleGoogleSignIn = async () => {
    setIsOAuthLoading('google');
    const { error } = await signInWithGoogle();
    if (error) {
      toast.error(error.message || t('messages.failedToSignIn'));
      playError();
    }
    setIsOAuthLoading(null);
  };

  const handleAppleSignIn = async () => {
    setIsOAuthLoading('apple');
    const { error } = await signInWithApple();
    if (error) {
      toast.error(error.message || t('messages.failedToSignIn'));
      playError();
    }
    setIsOAuthLoading(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-bl from-primary/20 via-violet-500/10 to-transparent rounded-full blur-[150px] animate-morph" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/15 via-cyan-500/10 to-transparent rounded-full blur-[120px] animate-morph" style={{ animationDelay: '-7s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent rounded-full blur-[100px] animate-float-slow" />
      </div>
      
      <div className="w-full max-w-md space-y-6">
        {/* Referral Banner */}
        {refCode && (
          <Card className="bg-gradient-to-r from-violet-500/20 to-purple-500/20 backdrop-blur-xl border-violet-500/30 rounded-2xl p-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-violet-500/30 flex items-center justify-center">
                <Gift className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <p className="font-medium text-sm">Вас пригласили!</p>
                <p className="text-xs text-muted-foreground">
                  Зарегистрируйтесь и получите +3 дня Premium
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-3 animate-fade-in">
            <div className="h-16 w-16 rounded-2xl bg-card/60 backdrop-blur-2xl border border-border/30 shadow-glass-lg flex items-center justify-center animate-scale-in">
              <img src="/pwa-maskable-512x512.png" alt="LinkMAX" className="h-10 w-10" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-primary to-violet-500 bg-clip-text text-transparent animate-fade-in" style={{ animationDelay: '0.1s' }}>
            {t('auth.title')}
          </h1>
          <p className="text-muted-foreground mt-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            {t('auth.subtitle')}
          </p>
          <div className="mt-4 flex justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Auth Card - Liquid Glass */}
        <Card className="bg-card/60 backdrop-blur-2xl border border-border/30 rounded-3xl shadow-glass-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">{t('auth.getStarted')}</CardTitle>
            <CardDescription>
              {t('auth.signInToAccount')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* OAuth Buttons - Hidden until configured */}
            {/* TODO: Uncomment when Google/Apple OAuth is configured in Lovable Cloud
            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 h-12 rounded-2xl bg-card/40 backdrop-blur-xl border-border/30 hover:bg-card/60 hover:border-border/50 transition-all duration-300"
                onClick={handleGoogleSignIn}
                disabled={isOAuthLoading !== null || isLoading}
              >
                {isOAuthLoading === 'google' ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {t('auth.continueWithGoogle')}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 h-12 rounded-2xl bg-card/40 backdrop-blur-xl border-border/30 hover:bg-card/60 hover:border-border/50 transition-all duration-300"
                onClick={handleAppleSignIn}
                disabled={isOAuthLoading !== null || isLoading}
              >
                {isOAuthLoading === 'apple' ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                )}
                {t('auth.continueWithApple')}
              </Button>
            </div>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/30" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-transparent backdrop-blur-xl px-3 text-muted-foreground">{t('auth.orContinueWith')}</span>
              </div>
            </div>
            */}

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/30 backdrop-blur-xl rounded-2xl p-1">
                <TabsTrigger value="signin" className="rounded-xl data-[state=active]:bg-card/80 data-[state=active]:backdrop-blur-xl data-[state=active]:shadow-glass">{t('auth.signIn')}</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-xl data-[state=active]:bg-card/80 data-[state=active]:backdrop-blur-xl data-[state=active]:shadow-glass">{t('auth.signUp')}</TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm text-muted-foreground">{t('auth.email')}</Label>
                    <Input
                      id="signin-email"
                      name="signin-email"
                      type="email"
                      placeholder="your@email.com"
                      required
                      className="h-12 rounded-xl bg-card/40 backdrop-blur-xl border-border/30 focus:border-primary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm text-muted-foreground">{t('auth.password')}</Label>
                    <Input
                      id="signin-password"
                      name="signin-password"
                      type="password"
                      placeholder="••••••••"
                      required
                      className="h-12 rounded-xl bg-card/40 backdrop-blur-xl border-border/30 focus:border-primary/50"
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl shadow-glass-lg transition-all duration-300 hover:scale-[1.02]" disabled={isLoading || isOAuthLoading !== null}>
                    {isLoading ? t('auth.signingIn') : t('auth.signIn')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                {signupStep === 'credentials' ? (
                  <form onSubmit={handleSignUpStep1} className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm text-muted-foreground">{t('auth.email')}</Label>
                      <Input
                        id="signup-email"
                        name="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        required
                        className="h-12 rounded-xl bg-card/40 backdrop-blur-xl border-border/30 focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm text-muted-foreground">{t('auth.password')}</Label>
                      <Input
                        id="signup-password"
                        name="signup-password"
                        type="password"
                        placeholder="••••••••"
                        required
                        className="h-12 rounded-xl bg-card/40 backdrop-blur-xl border-border/30 focus:border-primary/50"
                      />
                      <p className="text-xs text-muted-foreground mt-2 bg-muted/20 backdrop-blur-xl p-2 rounded-lg">
                        {t('auth.passwordHint')}
                      </p>
                    </div>
                    <Button type="submit" className="w-full h-12 rounded-xl shadow-glass-lg transition-all duration-300 hover:scale-[1.02]" disabled={isLoading || isOAuthLoading !== null}>
                      {t('auth.continue', 'Продолжить')}
                    </Button>
                  </form>
                ) : (
                  <div className="pt-4">
                    <TelegramVerification 
                      onVerified={handleTelegramVerified}
                      onBack={() => setSignupStep('credentials')}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Back to home */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Button variant="ghost" onClick={() => navigate('/')} className="rounded-xl hover:bg-card/40 backdrop-blur-xl">
            {t('auth.backToHome')}
          </Button>
        </div>
      </div>
    </div>
  );
}
