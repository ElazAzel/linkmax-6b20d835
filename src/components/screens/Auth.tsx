'use client';

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/user/useAuth';
import { useAppError } from '@/hooks/useAppError';
import { useSoundEffects } from '@/hooks/ui/useSoundEffects';
import Gift from 'lucide-react/dist/esm/icons/gift';
import Mail from 'lucide-react/dist/esm/icons/mail';
import Check from 'lucide-react/dist/esm/icons/check';
import { z } from 'zod';
import { LanguageSwitcher } from '@/components/translation/LanguageSwitcher';
import { applyReferralCode } from '@/services/referral';
import { supabase } from '@/platform/supabase/client';
import { logger } from '@/lib/utils/logger';
import { TermsLink } from '@/components/legal/TermsOfServiceModal';
import { PrivacyLink } from '@/components/legal/PrivacyPolicyModal';
import { Checkbox } from '@/components/ui/checkbox';
import { StaticSEOHead } from '@/components/seo/StaticSEOHead';
import { getAppDomain } from '@/lib/utils/url-helpers';
import { TelegramLoginButton } from '@/components/auth/TelegramLoginButton';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import { trackAuthEvent } from '@/services/authFunnel';
import { session } from '@/lib/storage';
import { NEW_USER_BUILDER_ROUTE, NEW_USER_BUILDER_SESSION_KEY } from '@/lib/onboarding/routes';
import type { TelegramAuthPayload } from '@/types/telegram-auth';

// Zod schema is created inside the component to access t()
// We define a factory function here
const createAuthSchema = (t: (key: string, fallback: string) => string) =>
  z.object({
    email: z
      .string()
      .trim()
      .email(t('auth.validation.email', 'Please enter a valid email address'))
      .max(255, t('auth.validation.emailMax', 'Email must be less than 255 characters')),
    password: z
      .string()
      .min(8, t('auth.validation.passwordMin', 'Password must be at least 8 characters'))
      .regex(/[A-Z]/, t('auth.validation.passwordUppercase', 'Password must contain at least one uppercase letter'))
      .regex(/[a-z]/, t('auth.validation.passwordLowercase', 'Password must contain at least one lowercase letter'))
      .regex(/[0-9]/, t('auth.validation.passwordNumber', 'Password must contain at least one number')),
  });

type AuthMode = 'signin' | 'signup' | 'reset' | 'reset-telegram' | 'update-password';
type TelegramResetStep = 'request' | 'verify';

export default function Auth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation();
  const authSchema = createAuthSchema(t);
  const canonical = `${getAppDomain()}/auth`;
  const seoTitle = t('auth.seo.title', 'Sign in to LinkMAX');
  const seoDescription = t(
    'auth.seo.description',
    'Access your LinkMAX dashboard to build and publish your link in bio page.'
  );
  const { user, signUp, signIn, signInWithGoogle, signInWithApple, signInWithTelegram } = useAuth();
  const { handleError } = useAppError();
  const { playSuccess, playError } = useSoundEffects();
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<'google' | 'apple' | 'telegram' | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('signin');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [signupEmailSent, setSignupEmailSent] = useState(false);
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signup');

  // Telegram password reset state
  const [telegramResetStep, setTelegramResetStep] = useState<TelegramResetStep>('request');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [resetToken, setResetToken] = useState('');

  // Track form view once on mount
  useEffect(() => {
    trackAuthEvent('auth_form_view', { mode: 'initial' });
  }, []);

  // Get referral code, mode, and growth source from URL
  const refCode = searchParams.get('ref');
  const urlMode = searchParams.get('mode');
  const fromSource = searchParams.get('from');
  const nicheParam = searchParams.get('niche');
  const refSlug = searchParams.get('ref_slug');

  // Store growth source params in window.sessionStorage for post-auth use
  useEffect(() => {
    if (fromSource) window.sessionStorage.setItem('lnkmx_signup_from', fromSource);
    if (nicheParam) window.sessionStorage.setItem('lnkmx_signup_niche', nicheParam);
    if (refSlug) window.sessionStorage.setItem('lnkmx_signup_ref_slug', refSlug);
  }, [fromSource, nicheParam, refSlug]);

  // Persistence for deep-linking
  const hashParams = new URL(window.location.href).hash.substring(1);
  const hashSearchParams = new URLSearchParams(hashParams);
  const returnTo = searchParams.get('returnTo') || hashSearchParams.get('returnTo');
  const safeReturnTo = returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : undefined;

  // Check for auth errors returned from OAuth redirect
  const authError = searchParams.get('auth_error');
  const authErrorDescription = searchParams.get('auth_error_description');

  useEffect(() => {
    if (authError) {
      toast.error(t('auth.oauthError', 'Authentication Error: {{error}}', { error: authErrorDescription || authError }));
      // Clean up URL without triggering re-renders
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('auth_error');
      newUrl.searchParams.delete('auth_error_description');
      window.history.replaceState(null, '', newUrl.toString());
    }
  }, [authError, authErrorDescription, t]);

  // Check for password update mode from URL or hash params (from email link)
  useEffect(() => {
    if (urlMode === 'update-password') {
      setAuthMode('update-password');
      return;
    }

    // Check hash params for recovery token (from Supabase email link)
    const hashParams = new URL(window.location.href).hash.substring(1);
    const searchParams = new URLSearchParams(hashParams);
    const accessToken = searchParams.get('access_token');
    const type = searchParams.get('type');

    if (accessToken && type === 'recovery') {
      logger.debug('Recovery token detected, setting up password update mode');
      // Supabase will automatically set the session from hash params
      // We just need to set the mode
      setAuthMode('update-password');

      // Clean up the URL hash for better UX
      window.history.replaceState(null, '', `${window.location.pathname}?mode=update-password`);
    }
  }, [urlMode]);

  // Redirect if already logged in (but not during password update)
  useEffect(() => {
    if (user && authMode !== 'update-password') {
      // Apply referral code if present
      if (refCode) {
        applyReferralCode(refCode, user.id).then((result) => {
          if (result.success) {
            toast.success(t('auth.referral.success', '🎉 +{{days}} days Premium for referral code!', { days: result.bonusDays }));
          }
        });
      }
      const shouldOpenBuilder = session.get<boolean>(NEW_USER_BUILDER_SESSION_KEY);
      if (shouldOpenBuilder) {
        session.remove(NEW_USER_BUILDER_SESSION_KEY);
      }
      navigate(safeReturnTo || (shouldOpenBuilder ? NEW_USER_BUILDER_ROUTE : '/dashboard'));
    }
  }, [user, navigate, refCode, authMode, safeReturnTo]);

  // Simplified signup - no Telegram required for free users
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    trackAuthEvent('auth_submit_attempt', { method: 'email_signup' });

    const formData = new FormData(e.currentTarget);
    const email = formData.get('signup-email') as string;
    const password = formData.get('signup-password') as string;

    // Validate with zod schema
    const validation = authSchema.safeParse({ email, password });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast.error(firstError.message);
      playError();
      setIsLoading(false);
      trackAuthEvent('auth_error', { method: 'email_signup', stage: 'validation', error: firstError.message });
      return;
    }

    session.set(NEW_USER_BUILDER_SESSION_KEY, true);
    const { data, error } = await signUp(validation.data.email, validation.data.password);

    if (error) {
      session.remove(NEW_USER_BUILDER_SESSION_KEY);
      logger.error('Signup error:', error, { context: 'Auth' });
      handleError(error, t('messages.failedToSignUp'));
      playError();
      setIsLoading(false);
      trackAuthEvent('auth_error', { method: 'email_signup', stage: 'submit', error: error.message });
      return;
    }

    if (data?.user && !data.session) {
      setSignupEmailSent(true);
      playSuccess();
      setIsLoading(false);
      trackAuthEvent('auth_success', { method: 'email_signup', requires_email_confirm: true });
      return;
    }

    playSuccess();
    toast.success(t('messages.accountCreated'));
    trackAuthEvent('auth_success', { method: 'email_signup', requires_email_confirm: false });
    // Auth state change will trigger redirect
    setIsLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    trackAuthEvent('auth_submit_attempt', { method: 'email_signin' });

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
      trackAuthEvent('auth_error', { method: 'email_signin', stage: 'validation', error: firstError.message });
      return;
    }

    const { error } = await signIn(validation.data.email, validation.data.password);

    if (error) {
      logger.error('Signin error:', error, { context: 'Auth' });
      handleError(error, t('messages.failedToSignIn'));
      playError();
      setIsLoading(false);
      trackAuthEvent('auth_error', { method: 'email_signin', stage: 'submit', error: error.message });
      return;
    }

    playSuccess();
    toast.success(t('auth.welcomeBack', 'Welcome back!'));
    trackAuthEvent('auth_success', { method: 'email_signin' });
    // Auth state change will trigger redirect
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('reset-email') as string;

    const emailValidation = z.string().trim().email().safeParse(email);
    if (!emailValidation.success) {
      toast.error(t('common.errors.invalidEmail', 'Please enter a valid email address'));
      playError();
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(emailValidation.data, {
      redirectTo: `${window.location.origin}/auth?mode=update-password`,
    });

    if (error) {
      logger.error('Password reset error:', error, { context: 'Auth' });
      handleError(error, t('common.errors.resetFailed', 'Failed to send reset email'));
      playError();
      setIsLoading(false);
      return;
    }

    playSuccess();
    setResetEmailSent(true);
    setIsLoading(false);
  };

  const handleTelegramResetRequest = async () => {
    if (!telegramChatId || !/^\d+$/.test(telegramChatId)) {
      toast.error(t('auth.telegram.invalidChatId', 'Enter a valid Telegram Chat ID'));
      playError();
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-password-reset', {
        body: { telegram_chat_id: telegramChatId, action: 'request' }
      });

      if (error || !data?.success) {
        const errorMessages: Record<string, string> = {
          telegram_not_found: t('auth.telegram.notFound', 'Account with this Telegram not found'),
          telegram_send_failed: t('auth.telegram.sendFailed', 'Failed to send message')
        };
        toast.error(errorMessages[data?.error] || t('auth.telegram.codeSendError', 'Error sending code'));
        playError();
      } else {
        playSuccess();
        setTelegramResetStep('verify');
        toast.success(t('auth.telegram.codeSent', 'Code sent to Telegram!'));
      }
    } catch (e) {
      toast.error(t('auth.telegram.connectionError', 'Connection error'));
      playError();
    }
    setIsLoading(false);
  };

  const handleTelegramResetVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get('new-password') as string;

    const passwordValidation = authSchema.shape.password.safeParse(newPassword);
    if (!passwordValidation.success) {
      toast.error(passwordValidation.error.errors[0].message);
      playError();
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-password-reset', {
        body: { telegram_chat_id: telegramChatId, action: 'verify', token: resetToken, new_password: newPassword }
      });

      if (error || !data?.success) {
        toast.error(data?.error === 'invalid_token' ? t('auth.telegram.invalidToken', 'Invalid or expired code') : t('auth.telegram.resetError', 'Password reset error'));
        playError();
      } else {
        playSuccess();
        toast.success(t('auth.telegram.passwordChanged', 'Password successfully changed!'));
        setAuthMode('signin');
        setTelegramResetStep('request');
        setTelegramChatId('');
        setResetToken('');
      }
    } catch (e) {
      toast.error(t('auth.telegram.connectionError', 'Connection error'));
      playError();
    }
    setIsLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get('new-password') as string;
    const confirmPassword = formData.get('confirm-password') as string;

    if (newPassword !== confirmPassword) {
      toast.error(t('common.errors.passwordMismatch', 'Passwords do not match'));
      playError();
      setIsLoading(false);
      return;
    }

    const passwordValidation = authSchema.shape.password.safeParse(newPassword);
    if (!passwordValidation.success) {
      toast.error(passwordValidation.error.errors[0].message);
      playError();
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      logger.error('Password update error:', error, { context: 'Auth' });
      handleError(error, t('common.errors.updateFailed', 'Failed to update data'));
      playError();
      setIsLoading(false);
      return;
    }

    playSuccess();
    setPasswordUpdated(true);
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    trackAuthEvent('auth_oauth_click', { provider: 'google' });
    setIsOAuthLoading('google');
    const { error } = await signInWithGoogle(safeReturnTo);
    if (error) {
      trackAuthEvent('auth_error', { method: 'google', error: error.message });
      handleError(error, t('messages.failedToSignIn'));
      playError();
    }
    setIsOAuthLoading(null);
  };

  const handleAppleSignIn = async () => {
    trackAuthEvent('auth_oauth_click', { provider: 'apple' });
    setIsOAuthLoading('apple');
    const { error } = await signInWithApple(safeReturnTo);
    if (error) {
      trackAuthEvent('auth_error', { method: 'apple', error: error.message });
      handleError(error, t('messages.failedToSignIn'));
      playError();
    }
    setIsOAuthLoading(null);
  };

  const handleTelegramAuth = async (telegramData: TelegramAuthPayload) => {
    trackAuthEvent('auth_oauth_click', { provider: 'telegram' });
    setIsOAuthLoading('telegram');
    const { error } = await signInWithTelegram(telegramData);
    if (error) {
      handleError(error, t('messages.failedToSignIn'));
      playError();
    } else {
      playSuccess();
      toast.success(t('auth.welcomeBack', 'Welcome back!'));
    }
    setIsOAuthLoading(null);
  };

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
      <div className="min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center p-4 relative overflow-x-hidden pb-safe">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-gradient-to-bl from-primary/20 via-violet-500/10 to-transparent rounded-full blur-[150px] animate-morph will-change-transform" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-500/15 via-cyan-500/10 to-transparent rounded-full blur-[120px] animate-morph will-change-transform" style={{ animationDelay: '-7s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-r from-purple-500/10 via-pink-500/5 to-transparent rounded-full blur-[100px] animate-float-slow will-change-transform" />
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
                  <p className="font-medium text-sm">{t('auth.referral.invited', 'You have been invited!')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('auth.referral.bonus', 'Sign up and get +3 days Premium')}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Logo */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3 animate-fade-in">
              <div className="h-16 w-16 rounded-2xl bg-card/60 backdrop-blur-2xl border border-border/30 shadow-glass-lg flex items-center justify-center animate-scale-in">
                <img src="/favicon.png" alt="LinkMAX" className="h-10 w-10 object-contain" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary via-primary to-violet-500 bg-clip-text text-transparent animate-fade-in break-words text-wrap max-w-[20rem] sm:max-w-none mx-auto" style={{ animationDelay: '0.1s' }}>
              {t('auth.title', 'Добро пожаловать в LinkMAX')}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-2 animate-fade-in break-words text-wrap max-w-[22rem] sm:max-w-none mx-auto" style={{ animationDelay: '0.2s' }}>
              {t('auth.subtitle', 'AI-страница для бизнеса за 2 минуты')}
            </p>
            <div className="mt-4 flex justify-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <LanguageSwitcher />
            </div>
          </div>

          {/* Password Update Card */}
          {authMode === 'update-password' ? (
            <Card className="bg-card/60 backdrop-blur-2xl border border-border/30 rounded-3xl shadow-glass-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{t('auth.newPassword', 'New Password')}</CardTitle>
                <CardDescription>
                  {t('auth.enterNewPassword', 'Enter your new password')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {passwordUpdated ? (
                  <div className="space-y-4 text-center">
                    <div className="h-16 w-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                      <Check className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold">{t('auth.passwordUpdated', 'Password Updated')}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t('auth.passwordUpdatedDesc', 'Your password has been successfully updated')}
                    </p>
                    <Button
                      className="w-full h-12 rounded-xl"
                      onClick={() => navigate('/dashboard')}
                    >
                      {t('auth.goToDashboard', 'Go to Dashboard')}
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-sm text-muted-foreground">
                        {t('auth.newPassword', 'New Password')}
                      </Label>
                      <Input
                        id="new-password"
                        name="new-password"
                        type="password"
                        placeholder="••••••••"
                        required
                        className="h-12 rounded-xl bg-card/40 backdrop-blur-xl border-border/30 focus:border-primary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-sm text-muted-foreground">
                        {t('auth.confirmPassword', 'Confirm Password')}
                      </Label>
                      <Input
                        id="confirm-password"
                        name="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        required
                        className="h-12 rounded-xl bg-card/40 backdrop-blur-xl border-border/30 focus:border-primary/50"
                      />
                      <p className="text-xs text-muted-foreground mt-2 bg-muted/20 backdrop-blur-xl p-2 rounded-lg">
                        {t('auth.passwordHint')}
                      </p>
                    </div>
                    <Button type="submit" className="w-full h-12 rounded-xl shadow-glass-lg transition-all duration-300 hover:scale-[1.02]" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('common.loading', 'Loading...')}
                        </>
                      ) : t('auth.updatePassword', 'Update Password')}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Auth Card - Liquid Glass — Optimized for conversion */
            <Card className="bg-card/60 backdrop-blur-2xl border border-border/30 rounded-3xl shadow-glass-xl animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-xl">
                    {t('auth.heroTitle', 'Создайте свою lnkmx.my страницу')}
                  </CardTitle>
                </div>
                <CardDescription className="text-sm">
                  {t('auth.heroSubtitle', 'AI соберёт сайт за 2 минуты. Бесплатно навсегда.')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* PRIMARY: Google OAuth — biggest, fastest path */}
                <Button
                  type="button"
                  className="w-full gap-3 h-14 rounded-2xl bg-white text-gray-900 hover:bg-white/90 border border-border/30 shadow-glass-lg font-semibold text-base transition-all duration-300 hover:scale-[1.01]"
                  onClick={handleGoogleSignIn}
                  disabled={isOAuthLoading !== null || isLoading}
                  data-testid="google-signin-primary"
                >
                  {isOAuthLoading === 'google' ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  {t('auth.continueWithGoogle', 'Продолжить с Google')}
                </Button>

                {/* SECONDARY: Email expand toggle */}
                {!showEmailForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailForm(true);
                      trackAuthEvent('auth_expand_email');
                    }}
                    className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2 flex items-center justify-center gap-1.5"
                    data-testid="expand-email-form"
                  >
                    {t('auth.continueWithEmail', 'или продолжить с email')}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                )}

                {showEmailForm && (
                  <>
                    <div className="relative py-1">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/30" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card/60 backdrop-blur-xl px-3 text-muted-foreground">{t('common.or', 'или')}</span>
                      </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'signin' | 'signup'); trackAuthEvent('auth_tab_switch', { tab: v }); }} className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-11 bg-muted/30 backdrop-blur-xl rounded-2xl p-1">
                        <TabsTrigger value="signup" data-testid="signup-tab" className="rounded-xl data-[state=active]:bg-card/80 data-[state=active]:backdrop-blur-xl data-[state=active]:shadow-glass text-xs sm:text-sm">{t('auth.signUp')}</TabsTrigger>
                        <TabsTrigger value="signin" data-testid="signin-tab" className="rounded-xl data-[state=active]:bg-card/80 data-[state=active]:backdrop-blur-xl data-[state=active]:shadow-glass text-xs sm:text-sm">{t('auth.signIn')}</TabsTrigger>
                      </TabsList>

                  <TabsContent value="signin">
                    {authMode === 'reset' ? (
                      resetEmailSent ? (
                        <div className="space-y-4 pt-4 text-center">
                          <div className="h-16 w-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                            <Mail className="h-8 w-8 text-green-500" />
                          </div>
                          <h3 className="text-lg font-semibold">{t('auth.checkEmail', 'Check your email')}</h3>
                          <p className="text-sm text-muted-foreground">
                            {t('auth.resetEmailSent', 'We sent a password reset link to your email')}
                          </p>
                          <Button
                            variant="outline"
                            className="w-full h-12 rounded-xl"
                            onClick={() => { setAuthMode('signin'); setResetEmailSent(false); }}
                          >
                            {t('auth.backToSignIn', 'Back to Sign In')}
                          </Button>
                        </div>
                      ) : (
                        <form onSubmit={handlePasswordReset} className="space-y-4 pt-4">
                          <div className="text-center mb-4">
                            <h3 className="text-lg font-semibold">{t('auth.resetPassword', 'Reset Password')}</h3>
                            <p className="text-sm text-muted-foreground">
                              {t('auth.resetDescription', 'Enter your email to receive a reset link')}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="reset-email" className="text-sm text-muted-foreground">{t('auth.email')}</Label>
                            <Input
                              id="reset-email"
                              name="reset-email"
                              type="email"
                              placeholder="your@email.com"
                              required
                              className="h-12 rounded-xl bg-card/40 backdrop-blur-xl border-border/30 focus:border-primary/50"
                            />
                          </div>
                          <Button type="submit" className="w-full h-12 rounded-xl shadow-glass-lg transition-all duration-300 hover:scale-[1.02]" disabled={isLoading}>
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t('common.loading', 'Loading...')}
                              </>
                            ) : t('auth.sendResetLink', 'Send Reset Link')}
                          </Button>
                          <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                              <span className="w-full border-t border-border/30" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                              <span className="bg-card px-2 text-muted-foreground">{t('common.or', 'or')}</span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full h-12 rounded-xl"
                            onClick={() => setAuthMode('reset-telegram')}
                          >
                            {t('auth.telegram.recoverViaTelegram', 'Recover via Telegram')}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            className="w-full rounded-xl"
                            onClick={() => setAuthMode('signin')}
                          >
                            {t('auth.backToSignIn', 'Back to Sign In')}
                          </Button>
                        </form>
                      )
                    ) : authMode === 'reset-telegram' ? (
                      <div className="space-y-4 pt-4">
                        <div className="text-center mb-4">
                          <h3 className="text-lg font-semibold">{t('auth.telegram.recoveryTitle', 'Recovery via Telegram')}</h3>
                          <p className="text-sm text-muted-foreground">
                            {telegramResetStep === 'request' ? t('auth.telegram.enterChatId', 'Enter your Telegram Chat ID') : t('auth.telegram.enterCode', 'Enter code from Telegram')}
                          </p>
                        </div>
                        {telegramResetStep === 'request' ? (
                          <div className="space-y-4">
                            <Input
                              value={telegramChatId}
                              onChange={(e) => setTelegramChatId(e.target.value.replace(/\D/g, ''))}
                              placeholder="123456789"
                              className="h-12 rounded-xl bg-card/40 backdrop-blur-xl border-border/30"
                            />
                            <Button onClick={handleTelegramResetRequest} className="w-full h-12 rounded-xl" disabled={isLoading}>
                              {isLoading ? t('auth.telegram.sending', 'Sending...') : t('auth.telegram.getCode', 'Get code')}
                            </Button>
                          </div>
                        ) : (
                          <form onSubmit={handleTelegramResetVerify} className="space-y-4">
                            <Input
                              value={resetToken}
                              onChange={(e) => setResetToken(e.target.value.toUpperCase())}
                              placeholder="XXXXXX"
                              maxLength={6}
                              className="h-12 rounded-xl bg-card/40 text-center text-xl tracking-widest font-mono"
                            />
                            <Input
                              name="new-password"
                              type="password"
                              placeholder={t('auth.telegram.newPassword', 'New password')}
                              required
                              className="h-12 rounded-xl bg-card/40"
                            />
                            <Button type="submit" className="w-full h-12 rounded-xl" disabled={isLoading}>
                              {isLoading ? t('auth.telegram.saving', 'Saving...') : t('auth.telegram.savePassword', 'Save password')}
                            </Button>
                          </form>
                        )}
                        <Button
                          variant="ghost"
                          className="w-full rounded-xl"
                          onClick={() => { setAuthMode('signin'); setTelegramResetStep('request'); }}
                        >
                          {t('auth.telegram.back', 'Back')}
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleSignIn} className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="signin-email" className="text-sm text-muted-foreground">{t('auth.email')}</Label>
                          <Input
                            id="signin-email"
                            name="signin-email"
                            type="email"
                            data-testid="signin-email-input"
                            placeholder="your@email.com"
                            required
                            className="h-12 rounded-xl bg-card/40 backdrop-blur-xl border-border/30 focus:border-primary/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="signin-password" className="text-sm text-muted-foreground">{t('auth.password')}</Label>
                            <button
                              type="button"
                              onClick={() => setAuthMode('reset')}
                              className="text-xs text-primary hover:underline"
                            >
                              {t('auth.forgotPassword', 'Forgot password?')}
                            </button>
                          </div>
                          <Input
                            id="signin-password"
                            name="signin-password"
                            type="password"
                            data-testid="signin-password-input"
                            placeholder="••••••••"
                            required
                            className="h-12 rounded-xl bg-card/40 backdrop-blur-xl border-border/30 focus:border-primary/50"
                          />
                        </div>
                        <Button type="submit" className="w-full h-12 rounded-xl shadow-glass-lg transition-all duration-300 hover:scale-[1.02]" disabled={isLoading || isOAuthLoading !== null}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t('auth.signingIn')}
                            </>
                          ) : t('auth.signIn')}
                        </Button>
                      </form>
                    )}
                  </TabsContent>

                  <TabsContent value="signup">
                    {signupEmailSent ? (
                      <div className="space-y-4 pt-4 text-center">
                        <div className="h-16 w-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                          <Mail className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="text-lg font-semibold">{t('auth.checkEmail', 'Check your email')}</h3>
                        <p className="text-sm text-muted-foreground">
                          {t('auth.signupEmailSent', 'We sent a confirmation link to your email')}
                        </p>
                        <Button
                          variant="outline"
                          className="w-full h-12 rounded-xl"
                          onClick={() => { setAuthMode('signin'); setSignupEmailSent(false); }}
                        >
                          {t('auth.backToSignIn', 'Back to Sign In')}
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleSignUp} className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className="text-sm text-muted-foreground">{t('auth.email')}</Label>
                          <Input
                            id="signup-email"
                            name="signup-email"
                            type="email"
                            data-testid="signup-email-input"
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
                            data-testid="signup-password-input"
                            placeholder="••••••••"
                            required
                            className="h-12 rounded-xl bg-card/40 backdrop-blur-xl border-border/30 focus:border-primary/50"
                          />
                          <p className="text-xs text-muted-foreground mt-2 bg-muted/20 backdrop-blur-xl p-2 rounded-lg">
                            {t('auth.passwordHint')}
                          </p>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Checkbox id="terms" data-testid="terms-checkbox" required className="mt-0.5" />
                          <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                            {t('legal.agreeToTerms')}{' '}
                            <TermsLink className="text-primary hover:underline">
                              {t('legal.termsLink')}
                            </TermsLink>
                            {' '}{t('legal.andThe')}{' '}
                            <PrivacyLink className="text-primary hover:underline">
                              {t('legal.privacyLink')}
                            </PrivacyLink>
                          </label>
                        </div>
                        <Button type="submit" data-testid="signup-button" className="w-full h-12 rounded-xl shadow-glass-lg transition-all duration-300 hover:scale-[1.02]" disabled={isLoading || isOAuthLoading !== null}>
                          {isLoading ? t('common.loading', 'Loading...') : t('auth.signUp')}
                        </Button>
                      </form>
                    )}
                  </TabsContent>
                </Tabs>
                  </>
                )}

                {/* Tertiary: alternative providers, collapsed */}
                {!showMoreOptions ? (
                  <button
                    type="button"
                    onClick={() => setShowMoreOptions(true)}
                    className="w-full text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors py-1"
                    data-testid="show-more-providers"
                  >
                    {t('auth.moreOptions', 'Другие способы входа')}
                  </button>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-border/20">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full gap-2 h-11 rounded-xl bg-card/40 backdrop-blur-xl border-border/30 hover:bg-card/60 text-sm"
                      onClick={handleAppleSignIn}
                      disabled={isOAuthLoading !== null || isLoading}
                    >
                      {isOAuthLoading === 'apple' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                        </svg>
                      )}
                      {t('auth.continueWithApple')}
                    </Button>
                    <div className={`transition-opacity duration-300 ${isOAuthLoading === 'telegram' ? 'opacity-50 pointer-events-none' : ''}`}>
                      <TelegramLoginButton
                        botName={import.meta.env.VITE_TELEGRAM_BOT_NAME || 'linkmaxmy_bot'}
                        onAuth={handleTelegramAuth}
                        buttonSize="medium"
                        cornerRadius={12}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Back to home */}
          <div className="text-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <Button variant="ghost" onClick={() => navigate('/')} className="rounded-xl hover:bg-card/40 backdrop-blur-xl">
              {t('auth.backToHome', 'На главную')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
