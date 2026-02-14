import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Check, Loader2, MessageCircle, ExternalLink, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TelegramVerificationProps {
  onVerified: (chatId: string) => void;
  onBack: () => void;
}

export function TelegramVerification({ onVerified, onBack }: TelegramVerificationProps) {
  const { t } = useTranslation();
  const [chatId, setChatId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleVerify = async () => {
    const cleanChatId = chatId.trim().replace(/[^0-9-]/g, '');
    
    if (!cleanChatId) {
      toast.error(t('telegram.enterChatId', 'Введите ваш Chat ID'));
      return;
    }

    setIsVerifying(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('validate-telegram', {
        body: { chatId: cleanChatId },
      });

      if (error) throw error;

      if (data?.valid) {
        setIsVerified(true);
        toast.success(t('telegram.verified', 'Telegram подтвержден!'));
        setTimeout(() => {
          onVerified(cleanChatId);
        }, 500);
      } else {
        toast.error(data?.error || t('telegram.invalidChatId', 'Неверный Chat ID'));
      }
    } catch (error: any) {
      console.error('Telegram verification error:', error);
      toast.error(t('telegram.verificationError', 'Ошибка проверки. Попробуйте снова.'));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
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
            {t('telegram.connectDescription', 'Для уведомлений о новых лидах')}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <Card className="p-4 bg-muted/30 space-y-3">
        <div className="flex items-start gap-3">
          <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium shrink-0">
            1
          </div>
          <div>
            <p className="text-sm">
              {t('telegram.step1', 'Откройте бота')} <span className="font-mono text-primary">@userinfobot</span> {t('telegram.inTelegram', 'в Telegram')}
            </p>
            <a 
              href="https://t.me/userinfobot" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
            >
              <ExternalLink className="h-3 w-3" />
              t.me/userinfobot
            </a>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium shrink-0">
            2
          </div>
          <p className="text-sm">
            {t('telegram.step2', 'Отправьте боту команду /start')}
          </p>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="h-6 w-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-medium shrink-0">
            3
          </div>
          <p className="text-sm">
            {t('telegram.step3', 'Скопируйте ваш ID (числовое значение) и вставьте ниже')}
          </p>
        </div>
      </Card>

      {/* Chat ID Input */}
      <div className="space-y-2">
        <Label htmlFor="telegram-chat-id" className="text-sm text-muted-foreground">
          {t('telegram.yourChatId', 'Ваш Telegram Chat ID')}
        </Label>
        <div className="flex gap-2">
          <Input
            id="telegram-chat-id"
            value={chatId}
            onChange={(e) => setChatId(e.target.value.replace(/[^0-9-]/g, ''))}
            placeholder="123456789"
            className="h-12 rounded-xl bg-card/40 backdrop-blur-xl border-border/30 focus:border-primary/50 font-mono"
            disabled={isVerifying || isVerified}
          />
          <Button
            onClick={handleVerify}
            disabled={!chatId.trim() || isVerifying || isVerified}
            className="h-12 px-6 rounded-xl"
          >
            {isVerifying ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isVerified ? (
              <Check className="h-4 w-4" />
            ) : (
              t('telegram.verify', 'Проверить')
            )}
          </Button>
        </div>
      </div>

      {isVerified && (
        <div className="flex items-center gap-2 text-sm text-green-500 bg-green-500/10 p-3 rounded-xl">
          <Check className="h-4 w-4" />
          {t('telegram.verifiedSuccess', 'Telegram успешно подключен!')}
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-muted-foreground text-center">
        <MessageCircle className="h-3 w-3 inline mr-1" />
        {t('telegram.whyRequired', 'Telegram нужен для получения уведомлений о новых заявках с вашей страницы')}
      </p>
    </div>
  );
}
