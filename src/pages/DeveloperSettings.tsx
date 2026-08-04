import { useState, memo, useEffect, useCallback } from "react";
import { useTranslation } from 'react-i18next';
import { Helmet } from "react-helmet-async";
import { 
    Code2, 
    Key, 
    Webhook, 
    Copy, 
    Check, 
    Plus, 
    Trash2, 
    ExternalLink,
    AlertCircle,
    Server,
    Activity,
    Shield,
    Power,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/ui/use-toast";
import { cn } from "@/lib/utils/utils";
import { apiKeysService, type ApiKey } from "@/services/apiKeys";
import { validateWebhookTargetUrl, type WebhookEventType } from "@/services/webhooks";
import { supabase } from "@/platform/supabase/client";
import { format } from 'date-fns';

const WEBHOOK_EVENTS: readonly WebhookEventType[] = [
    'lead.created',
    'lead.updated',
    'booking.created',
    'booking.cancelled',
    'event.registration_created',
    'invoice.created',
    'invoice.paid',
    'page.published',
    'form.submitted',
];

interface WebhookEndpoint {
    id: string;
    name: string;
    target_url: string;
    event_types: string[];
    is_active: boolean;
    status: string;
    failure_count: number;
    last_success_at: string | null;
    created_at: string;
}

interface RevealedSecret {
    kind: 'key' | 'webhook';
    id: string;
    value: string;
}

export const DeveloperSettings = memo(function DeveloperSettings() {
    const { toast } = useToast();
    const { t } = useTranslation();
    const [copied, setCopied] = useState<string | null>(null);

    // API keys
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [keysLoading, setKeysLoading] = useState(true);
    const [keyName, setKeyName] = useState("");
    const [generating, setGenerating] = useState(false);

    // Webhooks
    const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
    const [webhooksLoading, setWebhooksLoading] = useState(true);
    const [creatingWebhook, setCreatingWebhook] = useState(false);
    const [formOpen, setFormOpen] = useState(false);
    const [formName, setFormName] = useState("");
    const [formUrl, setFormUrl] = useState("");
    const [formEvents, setFormEvents] = useState<string[]>(['lead.created']);
    const [formError, setFormError] = useState<string | null>(null);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<{ kind: 'key' | 'webhook'; id: string } | null>(null);
    const [deleting, setDeleting] = useState(false);

    // One-time revealed secret (key or webhook signing secret)
    const [revealed, setRevealed] = useState<RevealedSecret | null>(null);

    const rpc = useCallback(
        (fn: string, args: unknown) =>
            (supabase as unknown as { rpc: (fn: string, args: unknown) => Promise<{ data: unknown; error: { message: string } | null }> })
                .rpc(fn, args),
        []
    );

    const loadKeys = useCallback(async () => {
        try {
            const data = await apiKeysService.listKeys();
            setKeys(data);
        } catch {
            toast({
                title: t('developerSettings.loadError', 'Не удалось загрузить ключи'),
                variant: 'destructive',
            });
        } finally {
            setKeysLoading(false);
        }
    }, [toast, t]);

    const loadWebhooks = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('webhook_endpoints')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            setWebhooks((data || []) as WebhookEndpoint[]);
        } catch {
            toast({
                title: t('developerSettings.loadWebhooksError', 'Не удалось загрузить webhook endpoints'),
                variant: 'destructive',
            });
        } finally {
            setWebhooksLoading(false);
        }
    }, [toast, t]);

    useEffect(() => {
        void loadKeys();
        void loadWebhooks();
    }, [loadKeys, loadWebhooks]);

    const copyToClipboard = async (text: string, id: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(id);
            toast({
                title: t('developerSettings.copied', 'Скопировано'),
                duration: 2000,
            });
            setTimeout(() => setCopied(null), 2000);
        } catch {
            toast({
                title: t('developerSettings.copyFailed', 'Не удалось скопировать'),
                variant: 'destructive',
            });
        }
    };

    const handleGenerateKey = async () => {
        const name = keyName.trim();
        if (name.length < 2) {
            toast({
                title: t('developerSettings.keyNameRequired', 'Укажите имя ключа (минимум 2 символа)'),
                variant: 'destructive',
            });
            return;
        }
        setGenerating(true);
        try {
            const { key, details } = await apiKeysService.generateKey(name);
            setKeys((prev) => [details, ...prev]);
            setRevealed({ kind: 'key', id: details.id, value: key });
            setKeyName("");
            toast({
                title: t('developerSettings.keyCreated', 'Ключ создан'),
                description: t('developerSettings.keyCreatedDescription', 'Покажите ключ один раз — после закрытия он станет недоступен.'),
            });
        } catch (err) {
            toast({
                title: t('developerSettings.keyError', 'Не удалось создать ключ'),
                description: err instanceof Error ? err.message : undefined,
                variant: 'destructive',
            });
        } finally {
            setGenerating(false);
        }
    };

    const handleDeleteKey = async () => {
        if (!deleteTarget || deleteTarget.kind !== 'key') return;
        setDeleting(true);
        try {
            await apiKeysService.deleteKey(deleteTarget.id);
            setKeys((prev) => prev.filter((k) => k.id !== deleteTarget.id));
            toast({ title: t('developerSettings.keyDeleted', 'Ключ удалён') });
        } catch {
            toast({ title: t('developerSettings.deleteError', 'Не удалось удалить ключ'), variant: 'destructive' });
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    const toggleEvent = (event: string) => {
        setFormEvents((prev) =>
            prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
        );
    };

    const handleCreateWebhook = async () => {
        const name = formName.trim();
        const url = formUrl.trim();
        if (name.length < 2) {
            setFormError(t('developerSettings.webhookNameRequired', 'Укажите название endpoint (минимум 2 символа)'));
            return;
        }
        const validation = validateWebhookTargetUrl(url);
        if (!validation.valid) {
            setFormError(
                validation.reason === 'missing'
                    ? t('developerSettings.urlRequired', 'Укажите URL endpoint')
                    : validation.reason === 'https_required'
                        ? t('developerSettings.httpsRequired', 'URL должен начинаться с https://')
                        : validation.reason === 'private_network_blocked'
                            ? t('developerSettings.privateBlocked', 'Приватные адреса (localhost, 10.x, 192.168.x и т.д.) запрещены')
                            : t('developerSettings.urlInvalid', 'Некорректный URL')
            );
            return;
        }
        if (formEvents.length === 0) {
            setFormError(t('developerSettings.eventsRequired', 'Выберите хотя бы одно событие'));
            return;
        }
        setFormError(null);
        setCreatingWebhook(true);
        try {
            const { data, error } = await rpc('create_webhook_endpoint', {
                p_name: name,
                p_target_url: url,
                p_event_types: formEvents,
                p_zone_id: null,
            });
            if (error) throw new Error(error.message);
            const result = data as { endpoint: WebhookEndpoint; signing_secret: string };
            setWebhooks((prev) => [result.endpoint, ...prev]);
            setRevealed({ kind: 'webhook', id: result.endpoint.id, value: result.signing_secret });
            setFormOpen(false);
            setFormName("");
            setFormUrl("");
            setFormEvents(['lead.created']);
            toast({
                title: t('developerSettings.webhookCreated', 'Endpoint создан'),
                description: t('developerSettings.webhookCreatedDescription', 'Секрет подписи показан один раз.'),
            });
        } catch (err) {
            setFormError(err instanceof Error ? err.message : t('developerSettings.webhookError', 'Не удалось создать endpoint'));
        } finally {
            setCreatingWebhook(false);
        }
    };

    const toggleWebhookActive = async (endpoint: WebhookEndpoint) => {
        setTogglingId(endpoint.id);
        try {
            const nextActive = !endpoint.is_active;
            const { error } = await supabase
                .from('webhook_endpoints')
                .update({ is_active: nextActive })
                .eq('id', endpoint.id);
            if (error) throw error;
            setWebhooks((prev) =>
                prev.map((w) => (w.id === endpoint.id ? { ...w, is_active: nextActive } : w))
            );
        } catch {
            toast({ title: t('developerSettings.webhookToggleError', 'Не удалось изменить статус'), variant: 'destructive' });
        } finally {
            setTogglingId(null);
        }
    };

    const handleDeleteWebhook = async () => {
        if (!deleteTarget || deleteTarget.kind !== 'webhook') return;
        setDeleting(true);
        try {
            const { error } = await supabase
                .from('webhook_endpoints')
                .delete()
                .eq('id', deleteTarget.id);
            if (error) throw error;
            setWebhooks((prev) => prev.filter((w) => w.id !== deleteTarget.id));
            toast({ title: t('developerSettings.webhookDeleted', 'Endpoint удалён') });
        } catch {
            toast({ title: t('developerSettings.deleteError', 'Не удалось удалить endpoint'), variant: 'destructive' });
        } finally {
            setDeleting(false);
            setDeleteTarget(null);
        }
    };

    const dismissRevealed = () => setRevealed(null);

    return (
        <div className="container max-w-6xl py-8 space-y-8 animate-in fade-in duration-500">
            <Helmet>
                <title>Developer & API - LinkMAX</title>
            </Helmet>

            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Code2 className="w-5 h-5 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">{t('developerSettings.title', 'API & Интеграции')}</h1>
                </div>
                <p className="text-muted-foreground ml-13">{t('developerSettings.subtitle', 'Управляйте ключами доступа, вебхуками и изучайте документацию для автоматизации бизнес-процессов.')}</p>
            </div>

            <Tabs defaultValue="keys" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-xl glass">
                    <TabsTrigger value="keys" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
                        <Key className="w-4 h-4" />
                        {t('developerSettings.keysTab', 'API Ключи')}
                    </TabsTrigger>
                    <TabsTrigger value="webhooks" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
                        <Webhook className="w-4 h-4" />
                        {t('developerSettings.webhooksTab', 'Webhooks')}
                    </TabsTrigger>
                    <TabsTrigger value="docs" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
                        <Server className="w-4 h-4" />
                        {t('developerSettings.docsTab', 'Документация')}
                    </TabsTrigger>
                </TabsList>

                {/* API KEYS TAB */}
                <TabsContent value="keys" className="space-y-6">
                    <Card className="border-border/50 shadow-sm glass overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <Shield className="w-64 h-64" />
                        </div>

                        <CardHeader className="pl-6 pt-6 relative z-10">
                            <CardTitle className="text-xl flex items-center gap-2">
                                {t('developerSettings.secretKeysTitle', 'Секретные ключи (Secret Keys)')}
                            </CardTitle>
                            <CardDescription>
                                {t('developerSettings.secretKeysDescription', 'Используйте ключ для аутентификации ваших серверных запросов к API LinkMAX.')}
                                <strong className="text-foreground block mt-1">{t('developerSettings.secretKeysWarning', 'Никогда не публикуйте Secret Key на стороне клиента (браузера).')}</strong>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10">
                            {/* Create key */}
                            <div className="flex flex-col sm:flex-row gap-3 items-end">
                                <div className="space-y-2 flex-1">
                                    <Label className="text-sm font-medium text-muted-foreground">{t('developerSettings.keyNameLabel', 'Название ключа')}</Label>
                                    <Input
                                        value={keyName}
                                        onChange={(e) => setKeyName(e.target.value)}
                                        placeholder={t('developerSettings.keyNamePlaceholder', 'Например: production-server')}
                                        className="bg-background/50 border-input"
                                        onKeyDown={(e) => { if (e.key === 'Enter') void handleGenerateKey(); }}
                                    />
                                </div>
                                <Button onClick={() => void handleGenerateKey()} disabled={generating} className="shrink-0 gap-2">
                                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {t('developerSettings.createKeyButton', 'Создать ключ')}
                                </Button>
                            </div>

                            {/* One-time revealed key */}
                            {revealed?.kind === 'key' && (
                                <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                                    <p className="text-sm font-semibold flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-primary" />
                                        {t('developerSettings.keyRevealed', 'Новый ключ (показывается один раз)')}
                                    </p>
                                    <div className="flex gap-2">
                                        <Input readOnly value={revealed.value} type="password" className="font-mono bg-background/50 border-input" />
                                        <Button variant="secondary" size="icon" onClick={() => void copyToClipboard(revealed.value, 'revealed-key')}>
                                            {copied === 'revealed-key' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs text-muted-foreground">{t('developerSettings.keyRevealedHint', 'Сохраните ключ в безопасном месте — повторный показ невозможен.')}</p>
                                        <Button variant="ghost" size="sm" onClick={dismissRevealed} className="text-xs h-8">
                                            {t('common.close', 'Закрыть')}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Key list */}
                            {keysLoading ? (
                                <div className="space-y-2">
                                    {[...Array(2)].map((_, i) => (
                                        <div key={i} className="h-14 rounded-lg bg-muted/50 animate-pulse" />
                                    ))}
                                </div>
                            ) : keys.length === 0 ? (
                                <div className="p-4 rounded-xl border border-border/50 bg-muted/20 text-sm text-muted-foreground">
                                    {t('developerSettings.noKeys', 'Ключей пока нет — создайте первый ключ для серверных запросов.')}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {keys.map((key) => (
                                        <div key={key.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
                                            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                <Key className="w-4 h-4 text-primary" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium text-sm truncate">{key.name}</span>
                                                    <code className="text-xs font-mono text-muted-foreground bg-background/60 rounded px-1.5 py-0.5">{key.key_prefix}…</code>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {t('developerSettings.createdLabel', 'Создан')}: {format(new Date(key.created_at), 'dd MMM yyyy')}
                                                    {key.last_used_at && ` · ${t('developerSettings.lastUsedLabel', 'Использован')}: ${format(new Date(key.last_used_at), 'dd MMM yyyy')}`}
                                                </p>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="hover:bg-destructive/10 hover:text-destructive shrink-0"
                                                onClick={() => setDeleteTarget({ kind: 'key', id: key.id })}
                                                aria-label={t('common.delete', 'Удалить')}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t border-border/50 p-4 text-sm text-muted-foreground relative z-10">
                            <AlertCircle className="w-4 h-4 mr-2 text-primary" />
                            {t('developerSettings.authFooter', 'Все ваши запросы к API должны содержать заголовок Authorization: Bearer ваш_токен.')}
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* WEBHOOKS TAB */}
                <TabsContent value="webhooks" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">{t('developerSettings.webhooksTitle', 'Ваши Webhook endpoints')}</h3>
                            <p className="text-sm text-muted-foreground">{t('developerSettings.webhooksSubtitle', 'Получайте мгновенные HTTP-уведомления о событиях в вашем аккаунте.')}</p>
                        </div>
                        <Button className="gap-2 rounded-xl" onClick={() => { setFormError(null); setFormOpen((v) => !v); }}>
                            <Plus className="w-4 h-4" />
                            {t('developerSettings.addEndpoint', 'Добавить Endpoint')}
                        </Button>
                    </div>

                    {/* Create endpoint form */}
                    {formOpen && (
                        <Card className="border-border/50 glass p-5 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">{t('developerSettings.endpointNameLabel', 'Название')}</Label>
                                    <Input
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                        placeholder={t('developerSettings.endpointNamePlaceholder', 'Например: CRM sync')}
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">{t('developerSettings.endpointUrlLabel', 'URL (https)')}</Label>
                                    <Input
                                        value={formUrl}
                                        onChange={(e) => setFormUrl(e.target.value)}
                                        placeholder="https://my-domain.com/webhook"
                                        className="bg-background/50 font-mono"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-muted-foreground">{t('developerSettings.eventsLabel', 'События')}</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {WEBHOOK_EVENTS.map((event) => (
                                        <label
                                            key={event}
                                            className={cn(
                                                "flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors",
                                                formEvents.includes(event)
                                                    ? "border-primary/40 bg-primary/5 text-foreground"
                                                    : "border-border/50 bg-muted/20 text-muted-foreground hover:border-border"
                                            )}
                                        >
                                            <Checkbox
                                                checked={formEvents.includes(event)}
                                                onCheckedChange={() => toggleEvent(event)}
                                                aria-label={event}
                                            />
                                            <span className="font-mono truncate">{event}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                            {formError && (
                                <p className="text-xs text-destructive flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" />
                                    {formError}
                                </p>
                            )}
                            <div className="flex gap-2 justify-end">
                                <Button variant="ghost" onClick={() => setFormOpen(false)}>
                                    {t('common.cancel', 'Отмена')}
                                </Button>
                                <Button onClick={() => void handleCreateWebhook()} disabled={creatingWebhook} className="gap-2">
                                    {creatingWebhook ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    {t('developerSettings.createEndpointButton', 'Создать endpoint')}
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* One-time revealed webhook secret */}
                    {revealed?.kind === 'webhook' && (
                        <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-2">
                            <p className="text-sm font-semibold flex items-center gap-2">
                                <Webhook className="w-4 h-4 text-primary" />
                                {t('developerSettings.webhookSecretRevealed', 'Секрет подписи (показывается один раз)')}
                            </p>
                            <div className="flex gap-2">
                                <Input readOnly value={revealed.value} type="password" className="font-mono bg-background/50 border-input" />
                                <Button variant="secondary" size="icon" onClick={() => void copyToClipboard(revealed.value, 'revealed-secret')}>
                                    {copied === 'revealed-secret' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs text-muted-foreground">{t('developerSettings.webhookSecretHint', 'Используйте секрет для проверки подписи X-LinkMAX-Signature.')}</p>
                                <Button variant="ghost" size="sm" onClick={dismissRevealed} className="text-xs h-8">
                                    {t('common.close', 'Закрыть')}
                                </Button>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4">
                        {webhooksLoading ? (
                            [...Array(2)].map((_, i) => (
                                <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />
                            ))
                        ) : webhooks.length === 0 ? (
                            <div className="p-6 rounded-xl border border-dashed border-border/60 text-center text-sm text-muted-foreground">
                                {t('developerSettings.noWebhooks', 'Webhook endpoints не настроены. Добавьте первый, чтобы получать события.')}
                            </div>
                        ) : (
                            webhooks.map(wh => (
                                <Card key={wh.id} className={cn("p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-border/50 glass transition-colors", !wh.is_active && "opacity-60")}>
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", wh.is_active ? "bg-green-500/10" : "bg-muted")}>
                                            <Activity className={cn("w-5 h-5", wh.is_active ? "text-green-500" : "text-muted-foreground")} />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-medium text-sm truncate">{wh.name}</p>
                                                <Badge variant="secondary" className={cn("text-[10px] h-5", wh.is_active ? "bg-green-500/15 text-green-700 dark:text-green-400" : "bg-muted text-muted-foreground")}>
                                                    {wh.is_active ? t('developerSettings.active', 'Активен') : t('developerSettings.disabled', 'Отключён')}
                                                </Badge>
                                                {wh.failure_count > 0 && (
                                                    <Badge variant="outline" className="text-[10px] h-5 border-red-500/30 text-red-700 dark:text-red-400">
                                                        {t('developerSettings.failures', '{{count}} ошибок', { count: wh.failure_count })}
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="font-mono text-xs text-muted-foreground truncate mt-0.5">{wh.target_url}</p>
                                            <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                                {wh.event_types.map(ev => (
                                                    <Badge key={ev} variant="secondary" className="text-[10px] bg-secondary/50 font-normal">
                                                        {ev}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="rounded-lg gap-1.5"
                                            onClick={() => void toggleWebhookActive(wh)}
                                            disabled={togglingId === wh.id}
                                        >
                                            {togglingId === wh.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                                            {wh.is_active ? t('developerSettings.pauseButton', 'Пауза') : t('developerSettings.activateButton', 'Включить')}
                                        </Button>
                                        <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteTarget({ kind: 'webhook', id: wh.id })} aria-label={t('common.delete', 'Удалить')}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* DOCS TAB */}
                <TabsContent value="docs" className="space-y-6">
                    <Card className="border-border/50 shadow-sm glass">
                        <CardHeader>
                            <CardTitle>{t('developerSettings.quickStartTitle', 'Быстрый старт с API')}</CardTitle>
                            <CardDescription>
                                {t('developerSettings.quickStartDescription', 'Наш REST API позволяет вам интегрировать LinkMAX с любым Node.js, Python или PHP бэкендом. Базовый URL:')} <code className="bg-muted px-1.5 py-0.5 rounded text-primary">https://api.lnkmx.my/v1</code>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <h4 className="font-medium flex items-center gap-2">
                                    {t('developerSettings.authSection', 'Аутентификация')}
                                </h4>
                                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-sm overflow-x-auto">
                                    <span className="text-zinc-500">{t('developerSettings.exampleRequest', '# Пример запроса')}</span><br/>
                                    curl -X GET https://api.lnkmx.my/v1/leads \<br/>
                                    &nbsp;&nbsp;-H <span className="text-blue-400">"Authorization: Bearer lk_live_вашкод123"</span><br/>
                                    &nbsp;&nbsp;-H <span className="text-green-400">"Content-Type: application/json"</span>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="font-medium flex items-center gap-2">
                                    {t('developerSettings.endpointsTitle', 'Основные Endpoints')}
                                </h4>
                                <ul className="space-y-3">
                                    <li className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 w-12 justify-center">GET</Badge>
                                            <code className="text-sm font-mono">/v1/leads</code>
                                        </div>
                                        <span className="text-sm text-muted-foreground">{t('developerSettings.getLeadsDesc', 'Получить список лидов (CRM)')}</span>
                                    </li>
                                    <li className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 w-12 justify-center">POST</Badge>
                                            <code className="text-sm font-mono">/v1/leads</code>
                                        </div>
                                        <span className="text-sm text-muted-foreground">{t('developerSettings.createLeadDesc', 'Создать нового лида (Внешняя страница)')}</span>
                                    </li>
                                    <li className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 w-12 justify-center">GET</Badge>
                                            <code className="text-sm font-mono">/v1/events</code>
                                        </div>
                                        <span className="text-sm text-muted-foreground">{t('developerSettings.listEventsDesc', 'Список мероприятий для билетов')}</span>
                                    </li>
                                </ul>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t border-border/50 p-4">
                            <Button variant="link" className="px-0 gap-1 text-primary" asChild>
                                <a href="https://github.com/linkmax/api-docs" target="_blank" rel="noreferrer">
                                    {t('developerSettings.fullDocsLink', 'Смотреть полную API документацию')} <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>

            <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {deleteTarget?.kind === 'webhook'
                                ? t('developerSettings.deleteWebhookTitle', 'Удалить webhook endpoint?')
                                : t('developerSettings.deleteKeyTitle', 'Удалить API ключ?')}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteTarget?.kind === 'webhook'
                                ? t('developerSettings.deleteWebhookDescription', 'Endpoint и его секрет будут удалены безвозвратно. Доставка событий прекратится.')
                                : t('developerSettings.deleteKeyDescription', 'Запросы с этим ключом перестанут работать сразу после удаления.')}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t('developerSettings.cancelButton', 'Отмена')}</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => void (deleteTarget?.kind === 'webhook' ? handleDeleteWebhook() : handleDeleteKey())}
                            disabled={deleting}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : t('developerSettings.confirmButton', 'Удалить')}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
});

export default DeveloperSettings;
