import { memo } from "react";
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Code2 from "lucide-react/dist/esm/icons/code-2";
import Webhook from "lucide-react/dist/esm/icons/webhook";
import Clock from "lucide-react/dist/esm/icons/clock";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Developers & API.
 *
 * This screen used to show a random "lk_live_…" key generated in the browser,
 * a hard-coded webhook and docs for an API host that does not exist. Users
 * could copy that key and wire it into their systems. Until public API keys
 * are backed by the database, the screen says so and points to what works
 * today: the per-page lead webhook.
 */
export const DeveloperSettings = memo(function DeveloperSettings() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            <Helmet>
                <title>{t('developerSettings.title', 'API и интеграции')} — LinkMAX</title>
            </Helmet>

            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Code2 className="w-5 h-5 text-primary" aria-hidden />
                </div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                    {t('developerSettings.title', 'API и интеграции')}
                </h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" aria-hidden />
                        {t('developerSettings.comingSoonTitle', 'Публичный API скоро')}
                    </CardTitle>
                    <CardDescription>
                        {t('developerSettings.comingSoonDescription', 'Мы готовим API-ключи и REST API для лидов, сделок и событий. Когда они заработают, ключи появятся здесь.')}
                    </CardDescription>
                </CardHeader>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Webhook className="w-4 h-4 text-primary" aria-hidden />
                        {t('developerSettings.webhookNowTitle', 'Уже работает: вебхук страницы')}
                    </CardTitle>
                    <CardDescription>
                        {t('developerSettings.webhookNowDescription', 'LinkMAX отправляет POST-запрос на ваш URL при каждой новой заявке со страницы. Подключите Make, Zapier, n8n или свой сервер.')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => navigate('/dashboard/settings')} className="rounded-xl">
                        {t('developerSettings.openWebhookSettings', 'Настроить вебхук')}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
});

export default DeveloperSettings;
