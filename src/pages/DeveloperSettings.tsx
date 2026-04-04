import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { 
    Code2, 
    Key, 
    Webhook, 
    Copy, 
    Check, 
    RefreshCw, 
    Plus, 
    Trash2, 
    ExternalLink,
    AlertCircle,
    Server,
    Activity,
    Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/ui/use-toast";
import { MagneticButton } from "@/components/landing/v2/MagneticButton";

export default function DeveloperSettings() {
    const { toast } = useToast();
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [mockApiKey, setMockApiKey] = useState("lk_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
    
    // UI mock state for webhooks
    const [webhooks, setWebhooks] = useState([
        { id: 1, url: "https://my-domain.com/webhook", events: ["lead.created", "payment.succeeded"], active: true }
    ]);

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(id);
        toast({
            title: "Скопировано",
            description: "Ключ скопирован в буфер обмена.",
            duration: 2000,
        });
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const regenerateKey = () => {
        if(confirm("Внимание! Старый ключ перестанет работать моментально. Продолжить?")) {
            setMockApiKey("lk_live_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
            toast({
                title: "Ключ обновлен",
                description: "Новый API ключ успешно сгенерирован."
            });
        }
    };

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
                    <h1 className="text-3xl font-bold tracking-tight">API & Интеграции</h1>
                </div>
                <p className="text-muted-foreground ml-13">Управляйте ключами доступа, вебхуками и изучайте документацию для автоматизации бизнес-процессов.</p>
            </div>

            <Tabs defaultValue="keys" className="space-y-6">
                <TabsList className="bg-muted/50 p-1 rounded-xl glass">
                    <TabsTrigger value="keys" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
                        <Key className="w-4 h-4" />
                        API Ключи
                    </TabsTrigger>
                    <TabsTrigger value="webhooks" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
                        <Webhook className="w-4 h-4" />
                        Webhooks
                    </TabsTrigger>
                    <TabsTrigger value="docs" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm gap-2">
                        <Server className="w-4 h-4" />
                        Документация
                    </TabsTrigger>
                </TabsList>

                {/* API KEYS TAB */}
                <TabsContent value="keys" className="space-y-6">
                    <Card className="border-border/50 shadow-sm glass overflow-hidden relative">
                        {/* Decorative background element */}
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <Shield className="w-64 h-64" />
                        </div>
                        
                        <CardHeader className="pl-6 pt-6 relative z-10">
                            <CardTitle className="text-xl flex items-center gap-2">
                                Секретные ключи (Secret Keys)
                            </CardTitle>
                            <CardDescription>
                                Используйте этот ключ для аутентификации ваших серверных запросов к API LinkMAX.
                                <strong className="text-foreground block mt-1">Никогда не публикуйте Secret Key на стороне клиента (браузера).</strong>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10">
                            <div className="flex flex-col sm:flex-row gap-3 items-end">
                                <div className="space-y-2 flex-1">
                                    <label className="text-sm font-medium text-muted-foreground">Прод-ключ (Live)</label>
                                    <div className="flex gap-2">
                                        <Input 
                                            readOnly 
                                            value={mockApiKey} 
                                            type="password"
                                            className="font-mono bg-background/50 border-input"
                                        />
                                        <Button 
                                            variant="secondary" 
                                            size="icon"
                                            onClick={() => copyToClipboard(mockApiKey, 'live')}
                                        >
                                            {copiedKey === 'live' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                </div>
                                <Button onClick={regenerateKey} variant="destructive" className="shrink-0 gap-2">
                                    <RefreshCw className="w-4 h-4" />
                                    Перевыпустить
                                </Button>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t border-border/50 p-4 text-sm text-muted-foreground relative z-10">
                            <AlertCircle className="w-4 h-4 mr-2 text-primary" />
                            Все ваши запросы к API должны содержать заголовок Authorization: Bearer ваш_токен.
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* WEBHOOKS TAB */}
                <TabsContent value="webhooks" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium">Ваши Webhook endpoints</h3>
                            <p className="text-sm text-muted-foreground">Получайте мгновенные HTTP-уведомления о событиях в вашем аккаунте.</p>
                        </div>
                        <MagneticButton>
                            <Button className="gap-2 rounded-xl">
                                <Plus className="w-4 h-4" />
                                Добавить Endpoint
                            </Button>
                        </MagneticButton>
                    </div>

                    <div className="grid gap-4">
                        {webhooks.map(wh => (
                            <Card key={wh.id} className="p-4 flex items-center justify-between border-border/50 glass hover:bg-muted/10 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <Activity className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="font-mono text-sm">{wh.url}</p>
                                        <div className="flex gap-2 mt-1">
                                            {wh.events.map(ev => (
                                                <Badge key={ev} variant="secondary" className="text-xs bg-secondary/50 font-normal">
                                                    {ev}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" className="hover:bg-destructive/10 hover:text-destructive">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" className="hidden sm:flex rounded-lg">
                                        Изменить
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* DOCS TAB */}
                <TabsContent value="docs" className="space-y-6">
                    <Card className="border-border/50 shadow-sm glass">
                        <CardHeader>
                            <CardTitle>Быстрый старт с API</CardTitle>
                            <CardDescription>
                                Наш REST API позволяет вам интегрировать LinkMAX с любым Node.js, Python или PHP бэкендом. 
                                Базовый URL: <code className="bg-muted px-1.5 py-0.5 rounded text-primary">https://api.lnkmx.my/v1</code>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <h4 className="font-medium flex items-center gap-2">
                                    Аутентификация
                                </h4>
                                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-mono text-sm overflow-x-auto">
                                    <span className="text-zinc-500"># Пример запроса</span><br/>
                                    curl -X GET https://api.lnkmx.my/v1/leads \<br/>
                                    &nbsp;&nbsp;-H <span className="text-blue-400">"Authorization: Bearer lk_live_вашкод123"</span><br/>
                                    &nbsp;&nbsp;-H <span className="text-green-400">"Content-Type: application/json"</span>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="font-medium flex items-center gap-2">
                                    Основные Endpoints
                                </h4>
                                <ul className="space-y-3">
                                    <li className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 w-12 justify-center">GET</Badge>
                                            <code className="text-sm font-mono">/v1/leads</code>
                                        </div>
                                        <span className="text-sm text-muted-foreground">Получить список лидов (CRM)</span>
                                    </li>
                                    <li className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 w-12 justify-center">POST</Badge>
                                            <code className="text-sm font-mono">/v1/leads</code>
                                        </div>
                                        <span className="text-sm text-muted-foreground">Создать нового лида (Внешняя страница)</span>
                                    </li>
                                    <li className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 w-12 justify-center">GET</Badge>
                                            <code className="text-sm font-mono">/v1/events</code>
                                        </div>
                                        <span className="text-sm text-muted-foreground">Список мероприятий для билетов</span>
                                    </li>
                                </ul>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t border-border/50 p-4">
                            <Button variant="link" className="px-0 gap-1 text-primary" asChild>
                                <a href="https://github.com/linkmax/api-docs" target="_blank" rel="noreferrer">
                                    Смотреть полную API документацию <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
