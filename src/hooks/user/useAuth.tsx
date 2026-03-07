import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/platform/supabase/client';
import { storage } from '@/lib/storage';
import { logger } from '@/lib/utils/logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ data: { user: User | null; session: Session | null } | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ data: { user: User | null; session: Session | null } | null; error: AuthError | null }>;
  signInWithGoogle: (returnTo?: string) => Promise<{ error: Error | null }>;
  signInWithApple: (returnTo?: string) => Promise<{ error: Error | null }>;
  signInWithTelegram: (telegramData: any) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Only log critical auth state changes in debug
        logger.debug('Auth state change', { context: 'useAuth', data: { event: _event, userId: session?.user?.id } });

        // Handle token refresh errors
        if (_event === 'TOKEN_REFRESHED' && !session) {
          // Token refresh failed, clear session
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        if (_event === 'SIGNED_OUT') {
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }

        // Check for password recovery
        if (_event === 'PASSWORD_RECOVERY') {
          logger.debug('Password recovery event detected', { context: 'useAuth' });
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Check for pending Telegram chat ID after signup
        if (_event === 'SIGNED_IN' && session?.user) {
          const pendingChatId = storage.get<string>('pending_telegram_chat_id');
          if (pendingChatId) {
            storage.remove('pending_telegram_chat_id');
            // Use setTimeout to avoid deadlock with Supabase auth
            setTimeout(async () => {
              const { error: err } = await supabase
                .from('user_profiles')
                .update({
                  telegram_chat_id: pendingChatId,
                  telegram_notifications_enabled: true
                })
                .eq('id', session.user.id);

              if (err) {
                logger.error('Failed to save telegram chat id:', err, { context: 'useAuth' });
              }
            }, 0);
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Clear invalid session
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { data, error };
  };

  const signInWithGoogle = async (_returnTo?: string) => {
    const redirectUrl = _returnTo
      ? `${window.location.origin}/auth?returnTo=${encodeURIComponent(_returnTo)}`
      : window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      }
    });
    return { error: error || null };
  };

  const signInWithApple = async (_returnTo?: string) => {
    const redirectUrl = _returnTo
      ? `${window.location.origin}/auth?returnTo=${encodeURIComponent(_returnTo)}`
      : window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUrl,
      }
    });
    return { error: error || null };
  };

  const signInWithTelegram = async (telegramData: any) => {
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('auth-telegram-web', {
        body: { telegramData }
      });

      if (invokeError) throw new Error(invokeError.message || 'Telegram auth failed');
      if (!data?.valid) throw new Error(data?.error || 'Invalid Telegram data');

      if (data.session) {
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (setSessionError) throw setSessionError;
      }

      return { error: null };
    } catch (err: any) {
      logger.error('Telegram sign-in error:', err, { context: 'Auth' });
      return { error: err };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signInWithApple, signInWithTelegram, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
