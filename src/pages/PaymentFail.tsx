'use client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { XCircle, ArrowLeft, MessageCircle } from 'lucide-react';

import { memo } from 'react';
import { useTranslation } from 'react-i18next';

export const PaymentFail = memo(function PaymentFail() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-2xl border-destructive/20 bg-card/50 backdrop-blur-xl">
                <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center animate-pulse">
                    <XCircle className="w-10 h-10 text-destructive" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-destructive">
                        {t('paymentFail.title', 'Ошибка оплаты')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('paymentFail.description', 'К сожалению, платеж не был завершен. Попробуйте еще раз или свяжитесь с поддержкой.')}
                    </p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                    <Button
                        variant="default"
                        className="w-full h-12"
                        onClick={() => navigate('/pricing')}
                    >
                        <ArrowLeft className="mr-2 w-4 h-4" />
                        {t('paymentFail.tryAgain', 'Попробовать снова')}
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open('https://t.me/LinkMAX_support', '_blank')}
                    >
                        <MessageCircle className="mr-2 w-4 h-4" />
                        {t('paymentFail.contactSupport', 'Написать в поддержку')}
                    </Button>
                </div>
            </Card>
        </div>
    );
});
