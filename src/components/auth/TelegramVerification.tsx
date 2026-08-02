import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Loader2, MessageCircle, ArrowLeft, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';

interface TelegramVerificationProps {
  onVerified: (chatId: string) => void;
  onBack: () => void;
}

// Bot username - lnkmx.my official bot
const LINKMAX_BOT_USERNAME = 'linkmaxmy_bot';

/**
 * Secure Telegram linking: the server issues a one-time code, the user sends it
 * to the bot from their own chat, and only then is the chat linked. The client
 * never supplies a chat id, so nobody can make the bot message a stranger.
 */
export function TelegramVerification({ onVerified, onBack }: TelegramVerificationProps) {
  const { t } = useTranslation();
  const [code, setCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const requestCode = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('validate-telegram', {
        body: { action: 'start' },
      });
      if (invokeError) throw invokeError;

      if (data?.linked && data?.chatId) {
        setIsVerified(true);
        onVerified(String(data.chatId));
        return;
      }
      if (data?.code) {
        setCode(String(data.code));
      } else {
        setError(t('telegram.codeError', 'Не удалось получить код. Попробуйте снова'));
      }
    } catch (err) {
      console.error('Telegram link code error:', err);
      setError(t('telegram.codeError', 'Не удалось получить код. Попробуйте снова'));
    } finally {
      setIsLoading(false);
    }
  }, [onVerified, t]);

  useEffect(() => {
    void requestCode();
  }, [requestCode]);

  // Poll link status while waiting for the user to send the code to the bot
  useEffect(() => {
    if (!code || isVerified) return;

    pollRef.current = setInterval(async () => {
      const { data } = await supabase.functions.invoke('validate-telegram', {
        body: { action: 'status' },
      });
      if (data?.linked && data?.chatId) {
        setIsVerified(true);
        toast.success(t('telegram.verified', 'Telegram подтвержден! ✓'));
        onVerified(String(data.chatId));
      }
    }, 4000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [code, isVerified, onVerified, t]);

  const openBot = () => {
    window.open(`https://t.me/${LINKMAX_BOT_USERNAME}`, '_blank', 'noopener,noreferrer');
  };

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success(t('common.copied', 'Скопировано'));
    } catch {
      toast.error(t('common.copyFailed', 'Не удалось скопировать'));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-8 w-8 rounded-xl"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h3 className="font-semibold text-lg">{t('telegram.connectTitle', 'Подключите Telegram')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('telegram.connectSubtitle', 'Для уведомлений о заявках')}
          </p>
        </div>
      </div>

      {/* Step 1 - Your code */}
      <Card className="p-4 bg-muted/30 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold shrink-0">
            1
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{t('telegram.stepCodeTitle', 'Ваш код подтверждения')}</p>
            <p className="text-xs text-muted-foreground">
              {t('telegram.stepCodeDesc', 'Код действует 15 минут')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-12 rounded-xl border border-border/40 bg-card/60 flex items-center justify-center font-mono text-2xl tracking-[0.3em]">
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (code ?? '——————')}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={copyCode}
            disabled={!code}
            className="h-12 w-12 rounded-xl shrink-0"
            aria-label={t('common.copy', 'Копировать')}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Step 2 - Send it to the bot */}
      <Card className="p-4 bg-primary/5 border-primary/20 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
            2
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">
              {t('telegram.stepSendTitle', 'Отправьте код боту @linkmaxmy_bot')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('telegram.stepSendDesc', 'Нажмите START и отправьте код сообщением')}
            </p>
          </div>
        </div>

        <Button className="w-full h-12 rounded-xl gap-2" onClick={openBot}>
          <MessageCircle className="h-5 w-5" />
          {t('telegram.openBot', 'Открыть @linkmaxmy_bot')}
          <ExternalLink className="h-4 w-4 ml-auto" />
        </Button>
      </Card>

      {/* Error display */}
      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-xl">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success display */}
      {isVerified && (
        <div className="flex items-center gap-2 text-sm text-green-500 bg-green-500/10 p-3 rounded-xl">
          <Check className="h-4 w-4" />
          {t('telegram.connected', 'Telegram успешно подключен!')}
        </div>
      )}

      {/* Waiting indicator */}
      {!isVerified && code && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('telegram.waitingCode', 'Ожидаем код в боте...')}
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center px-4">
        {t('telegram.infoHint', 'Telegram нужен для мгновенных уведомлений о новых заявках с вашей страницы')}
      </p>
    </div>
  );
}
