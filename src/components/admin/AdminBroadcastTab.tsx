import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/platform/supabase/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Megaphone from 'lucide-react/dist/esm/icons/megaphone';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Settings2 from 'lucide-react/dist/esm/icons/settings-2';
import { Input } from '@/components/ui/input';

export function AdminBroadcastTab() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<{ total: number; success: number; failed: number } | null>(null);
  const [botToken, setBotToken] = useState('');
  const [savingToken, setSavingToken] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data } = await supabase
          .from('app_settings')
          .select('value')
          .eq('key', 'TELEGRAM_BOT_TOKEN')
          .single();
        if (data) setBotToken((data as any).value);
      } catch (err) {
        // config might not exist yet
      }
    };
    loadConfig();
  }, []);

  const handleSaveToken = async () => {
    if (!botToken.trim()) {
      toast.error(t('adminBroadcast.botSettings.errEmptyToken', 'Пожалуйста, введите токен!'));
      return;
    }
    setSavingToken(true);
    try {
      const { error } = await (supabase.from('bot_config' as any) as any).upsert({
        key: 'TELEGRAM_BOT_TOKEN',
        value: botToken.trim()
      });
      if (error) throw error;
      toast.success(t('adminBroadcast.botSettings.successSave', 'Токен успешно сохранен!'));
    } catch (err: any) {
      toast.error(t('adminBroadcast.botSettings.errSave', { error: err.message }));
    } finally {
      setSavingToken(false);
    }
  };

  const handleRunBroadcast = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.rpc('send_telegram_broadcast', {
        p_custom_text: message.trim() || null
      });

      if (error) throw error;

      const res = data as any;
      setResult({ total: res.total_count, success: res.queued_count, failed: res.total_count - res.queued_count });
      toast.success(t('adminBroadcast.massBroadcast.successRun'));
    } catch (err: any) {
      console.error('Broadcast error:', err);
      toast.error(t('adminBroadcast.massBroadcast.errRun', { error: err.message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bot Settings Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <CardTitle>{t('adminBroadcast.botSettings.title', 'Настройки бота')}</CardTitle>
          </div>
          <CardDescription>
            {t('adminBroadcast.botSettings.description', 'Введите токен Telegram бота для рассылок (избегает CORS и деплоев)')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Input 
            value={botToken}
            onChange={(e) => setBotToken(e.target.value)}
            placeholder={t('adminBroadcast.botSettings.tokenPlaceholder', '1234567890:ABCDEFG...')}
            type="password"
            className="font-mono bg-white/5 border-white/10"
          />
          <Button 
            onClick={handleSaveToken} 
            disabled={savingToken || !botToken.trim()}
            className="w-32 shrink-0"
          >
            {savingToken ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t('adminBroadcast.botSettings.saveBtn', 'Сохранить')
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <CardTitle>{t('adminBroadcast.massBroadcast.title')}</CardTitle>
          </div>
          <CardDescription>
            {t('adminBroadcast.massBroadcast.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('adminBroadcast.massBroadcast.msgLabel')}</label>
            <Textarea
              className="min-h-[120px]"
              placeholder={t('adminBroadcast.massBroadcast.msgPlaceholder')}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
            />
            <p className="text-[10px] text-muted-foreground italic">
              {t('adminBroadcast.massBroadcast.htmlHint')}
            </p>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex gap-3 text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">{t('adminBroadcast.massBroadcast.warningTitle')}</p>
              <p>{t('adminBroadcast.massBroadcast.warningBody')}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={loading}
                  className="w-full sm:w-auto self-start"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('adminBroadcast.massBroadcast.runningBtn')}
                    </>
                  ) : (
                    t('adminBroadcast.massBroadcast.runBtn')
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('adminBroadcast.massBroadcast.warningTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {message.trim()
                      ? t('adminBroadcast.massBroadcast.confirmCustom', { text: message.slice(0, 50) })
                      : t('adminBroadcast.massBroadcast.confirmDefault')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel', 'Отмена')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRunBroadcast}>
                    {t('adminBroadcast.massBroadcast.runBtn')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {result && (
              <div className="mt-4 p-4 bg-muted border rounded-lg space-y-2">
                <p className="font-semibold text-sm">{t('adminBroadcast.massBroadcast.statusTitle')}</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-blue-600 font-medium">{t('adminBroadcast.massBroadcast.totalUsers')} {result.total}</div>
                  <div className="text-green-600 font-medium">✅ {result.success}</div>
                  <div className="text-red-600 font-medium">❌ {result.failed}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('adminBroadcast.preview.title')}</CardTitle>
          <CardDescription>{t('adminBroadcast.preview.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 border border-border/50 rounded-lg bg-muted text-sm font-mono whitespace-pre-wrap leading-relaxed">
            {t('adminBroadcast.preview.sampleText')}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
