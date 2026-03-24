import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/platform/supabase/client';
import Megaphone from 'lucide-react/dist/esm/icons/megaphone';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import AlertTriangle from 'lucide-react/dist/esm/icons/alert-triangle';
import Key from 'lucide-react/dist/esm/icons/key';
import Save from 'lucide-react/dist/esm/icons/save';

export function AdminBroadcastTab() {
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
      toast.error('Введите токен!');
      return;
    }
    setSavingToken(true);
    try {
      const { error } = await (supabase as any)
        .from('bot_config')
        .upsert({ key: 'TELEGRAM_BOT_TOKEN', value: botToken.trim() });
      
      if (error) throw error;
      toast.success('Токен сохранен!');
    } catch (err: any) {
      toast.error('Ошибка сохранения: ' + err.message);
    } finally {
      setSavingToken(false);
    }
  };

  const handleRunBroadcast = async () => {
    const isCustom = message.trim().length > 0;
    const confirmMsg = isCustom 
      ? `Вы уверены, что хотите отправить КАСТОМНОЕ сообщение всем пользователям?\n\nТекст: "${message.slice(0, 50)}..."`
      : 'Вы уверены, что хотите запустить СТАНДАРТНУЮ рассылку (обновление Mini CRM)?';

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
      toast.success('Рассылка поставлена в очередь!');
    } catch (err: any) {
      console.error('Broadcast error:', err);
      toast.error('Ошибка при запуске рассылки: ' + err.message);
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
            <CardTitle>Настройка бота</CardTitle>
          </div>
          <CardDescription>
            Введите ваш Telegram Bot Token для работы рассылки через базу данных.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <input
              type="password"
              className="flex-1 h-10 px-3 py-2 rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="1234567890:ABCDEFG..."
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
            />
            <Button onClick={handleSaveToken} disabled={savingToken} variant="secondary">
              {savingToken ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Сохранить
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <CardTitle>Массовая рассылка</CardTitle>
          </div>
          <CardDescription>
            Отправка уведомлений всем пользователям LinkMAX через SQL (pg_net).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Текст сообщения (необязательно)</label>
            <textarea
              className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Введите текст для рассылки. Если оставить пустым, будет отправлено стандартное сообщение об обновлении CRM."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
            />
            <p className="text-[10px] text-muted-foreground italic">
              * Поддерживается HTML разметка Telegram (b, i, code, a).
            </p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-amber-800">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">Внимание!</p>
              <p>Это действие поставит в очередь сообщения для всех активных пользователей в БД.</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Button 
              onClick={handleRunBroadcast} 
              disabled={loading || !botToken} 
              className="w-full md:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Запуск...
                </>
              ) : (
                '🚀 Запустить рассылку (через SQL)'
              )}
            </Button>

            {result && (
              <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                <p className="font-semibold text-sm">Статус очереди:</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-blue-600">Всего пользователей: {result.total_count}</div>
                  <div className="text-green-600">В очереди: {result.queued_count}</div>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  * Сообщения отправляются асинхронно через pg_net.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Предпросмотр сообщения</CardTitle>
          <CardDescription>Текст, который увидят пользователи (на их языке):</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border rounded-lg bg-card text-sm font-mono whitespace-pre-wrap">
            🚀 <b>Обновление LinkMAX: Это больше не просто конструктор!</b>{"\n\n"}
            Мы превратили ваш сайт в полноценную <b>Мини-CRM</b>. Теперь прямо в Telegram вы можете:{"\n\n"}
            ✅ Управлять лидами и бронированиями{"\n"}
            ✅ Быстро редактировать ссылки и БИО{"\n"}
            ✅ Видеть детальную аналитику по каждому проекту{"\n\n"}
            Попробуйте новые команды в меню! 👇
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
