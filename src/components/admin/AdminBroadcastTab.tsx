import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '@/platform/supabase/client';
import Megaphone from 'lucide-react/dist/esm/icons/megaphone';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Key from 'lucide-react/dist/esm/icons/key';
import Save from 'lucide-react/dist/esm/icons/save';

export function AdminBroadcastTab() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [savingToken, setSavingToken] = useState(false);
  const [message, setMessage] = useState('');
  const [botToken, setBotToken] = useState('');
  const [result, setResult] = useState<{ total_count: number; queued_count: number } | null>(null);

  // Load existing token on mount
  useEffect(() => {
    async function loadToken() {
      const { data } = await (supabase as any)
        .from('bot_config')
        .select('value')
        .eq('key', 'TELEGRAM_BOT_TOKEN')
        .maybeSingle();
      
      if (data && 'value' in data) {
        setBotToken(data.value);
      }
    }
    loadToken();
  }, []);

  const handleSaveToken = async () => {
    if (!botToken.trim()) {
      toast.error(t('adminBroadcast.botSettings.errEmptyToken'));
      return;
    }
    setSavingToken(true);
    try {
      const { error } = await (supabase as any)
        .from('bot_config')
        .upsert({ key: 'TELEGRAM_BOT_TOKEN', value: botToken.trim() });
      
      if (error) throw error;
      toast.success(t('adminBroadcast.botSettings.successSave'));
    } catch (err: any) {
      toast.error(t('adminBroadcast.botSettings.errSave', { error: err.message }));
    } finally {
      setSavingToken(false);
    }
  };

  const handleRunBroadcast = async () => {
    const isCustom = message.trim().length > 0;
    const confirmMsg = isCustom 
      ? t('adminBroadcast.massBroadcast.confirmCustom', { text: message.slice(0, 50) })
      : t('adminBroadcast.massBroadcast.confirmDefault');

    if (!confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Direct SQL call via RPC (No Edge Function deploy needed!)
      const { data, error } = await (supabase as any).rpc('send_telegram_broadcast', {
        p_custom_text: message.trim() || null
      });

      if (error) throw error;

      setResult(data as any);
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
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <CardTitle>{t('adminBroadcast.botSettings.title')}</CardTitle>
          </div>
          <CardDescription>
            {t('adminBroadcast.botSettings.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="password"
              className="flex-1"
              placeholder={t('adminBroadcast.botSettings.tokenPlaceholder')}
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
            />
            <Button onClick={handleSaveToken} disabled={savingToken} variant="secondary">
              {savingToken ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {savingToken ? t('adminBroadcast.botSettings.savingBtn') : t('adminBroadcast.botSettings.saveBtn')}
            </Button>
          </div>
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

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">{t('adminBroadcast.massBroadcast.warningTitle')}</p>
              <p>{t('adminBroadcast.massBroadcast.warningBody')}</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Button 
              onClick={handleRunBroadcast} 
              disabled={loading || !botToken} 
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

            {result && (
              <div className="mt-4 p-4 bg-muted border rounded-lg space-y-2">
                <p className="font-semibold text-sm">{t('adminBroadcast.massBroadcast.statusTitle')}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-blue-600 font-medium">{t('adminBroadcast.massBroadcast.totalUsers')} {result.total_count}</div>
                  <div className="text-green-600 font-medium">{t('adminBroadcast.massBroadcast.queuedMsgs')} {result.queued_count}</div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {t('adminBroadcast.massBroadcast.asyncHint')}
                </p>
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
