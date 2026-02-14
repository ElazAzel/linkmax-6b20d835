import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Loader2, MessageCircle, ArrowLeft, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import { supabase } from '@/platform/supabase/client';
import { toast } from 'sonner';

interface TelegramVerificationProps {
  onVerified: (chatId: string) => void;
  onBack: () => void;
}

// Bot username - LinkMAX official bot
const LINKMAX_BOT_USERNAME = 'linkmaxmy_bot';

export function TelegramVerification({ onVerified, onBack }: TelegramVerificationProps) {
  const { t } = useTranslation();
  const [chatId, setChatId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const verifyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastVerifiedRef = useRef<string>('');

  // Auto-verify when chatId changes (with debounce)
  useEffect(() => {
    // Clear previous timeout
    if (verifyTimeoutRef.current) {
      clearTimeout(verifyTimeoutRef.current);
    }

    const cleanChatId = chatId.trim().replace(/[^0-9-]/g, '');
    
    // Only auto-verify if:
    // - chatId is at least 5 digits (valid Telegram IDs are usually 6+ digits)
    // - not already verifying
    // - not already verified with this ID
    // - different from last verified
    if (cleanChatId.length >= 5 && !isVerifying && !isVerified && cleanChatId !== lastVerifiedRef.current) {
      verifyTimeoutRef.current = setTimeout(() => {
        handleVerify(cleanChatId);
      }, 800); // 800ms debounce
    }

    return () => {
      if (verifyTimeoutRef.current) {
        clearTimeout(verifyTimeoutRef.current);
      }
    };
  }, [chatId]);

  const handleVerify = async (idToVerify?: string) => {
    const cleanChatId = (idToVerify || chatId).trim().replace(/[^0-9-]/g, '');
    
    if (!cleanChatId || cleanChatId.length < 5) {
      return;
    }

    setIsVerifying(true);
    setError(null);
    lastVerifiedRef.current = cleanChatId;
    
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('validate-telegram', {
        body: { chatId: cleanChatId },
      });

      if (invokeError) throw invokeError;

      if (data?.valid) {
        setIsVerified(true);
        toast.success(t('telegram.verified', 'Telegram подтвержден! ✓'));
        setTimeout(() => {
          onVerified(cleanChatId);
        }, 500);
      } else {
        if (data?.error === 'invalid_chat_id' || data?.description?.includes('chat not found')) {
          setError(t('telegram.clickStartFirst', 'Сначала нажмите START в боте @linkmaxmy_bot'));
        } else if (data?.error === 'cannot_send_message') {
          setError(t('telegram.clickStart', 'Нажмите START в боте @linkmaxmy_bot'));
        } else {
          setError(t('telegram.invalidChatId', 'Неверный Chat ID'));
        }
      }
    } catch (err: any) {
      console.error('Telegram verification error:', err);
      setError(t('telegram.verificationError', 'Ошибка проверки. Попробуйте снова'));
    } finally {
      setIsVerifying(false);
    }
  };

  const openBot = () => {
    window.open(`https://t.me/${LINKMAX_BOT_USERNAME}`, '_blank');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const numbersOnly = text.replace(/[^0-9-]/g, '');
      if (numbersOnly) {
        setChatId(numbersOnly);
        setError(null);
        // Auto-verify will trigger via useEffect
      }
    } catch {
      toast.error(t('common.pasteFailed', 'Не удалось вставить'));
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

      {/* Step 1 - Open Bot */}
      <Card className="p-4 bg-primary/5 border-primary/20 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
            1
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{t('telegram.step1Title', 'Откройте бота и нажмите START')}</p>
            <p className="text-xs text-muted-foreground">{t('telegram.step1Desc', 'Бот покажет ваш Chat ID')}</p>
          </div>
        </div>
        
        <Button
          className="w-full h-12 rounded-xl gap-2"
          onClick={openBot}
        >
          <MessageCircle className="h-5 w-5" />
          {t('telegram.openBot', 'Открыть @linkmaxmy_bot')}
          <ExternalLink className="h-4 w-4 ml-auto" />
        </Button>
      </Card>

      {/* Step 2 - Enter Chat ID */}
      <Card className="p-4 bg-muted/30 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold shrink-0">
            2
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{t('telegram.step2Title', 'Скопируйте Chat ID и вставьте сюда')}</p>
            <p className="text-xs text-muted-foreground">{t('telegram.step2Desc', 'Нажмите на номер в боте для копирования')}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Input
            value={chatId}
            onChange={(e) => {
              setChatId(e.target.value.replace(/[^0-9-]/g, ''));
              setError(null);
            }}
            placeholder="123456789"
            className="h-12 rounded-xl bg-card/60 backdrop-blur-xl border-border/30 focus:border-primary/50 font-mono text-lg"
            disabled={isVerifying || isVerified}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handlePaste}
            className="h-12 w-12 rounded-xl shrink-0"
            disabled={isVerifying || isVerified}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
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

      {/* Status indicator */}
      {isVerifying && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('telegram.verifying', 'Проверяем Chat ID...')}
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center px-4">
        {t('telegram.infoHint', 'Telegram нужен для мгновенных уведомлений о новых заявках с вашей страницы')}
      </p>
    </div>
  );
}
