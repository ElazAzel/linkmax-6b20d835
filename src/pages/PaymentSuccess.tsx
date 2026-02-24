import { useNavigate } from 'react-router-dom';
'use client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, ArrowRight } from 'lucide-react';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

export default function PaymentSuccess() {
    const navigate = useNavigate();

    useEffect(() => {
        // Launch confetti
        const duration = 3000;
        const end = Date.now() + duration;

        const frame = () => {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#8b5cf6', '#ec4899', '#10b981']
            });
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#8b5cf6', '#ec4899', '#10b981']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        };
        frame();
    }, []);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 text-center space-y-6 shadow-2xl border-primary/20 bg-card/50 backdrop-blur-xl">
                <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center animate-bounce">
                    <Check className="w-10 h-10 text-green-500" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-purple-600">
                        Оплата прошла успешно!
                    </h1>
                    <p className="text-muted-foreground">
                        Ваш PRO-аккаунт активирован. Спасибо за доверие!
                    </p>
                </div>

                <div className="pt-4">
                    <Button
                        className="w-full h-12 text-lg bg-gradient-to-r from-violet-500 to-purple-600 shadow-lg shadow-purple-500/20"
                        onClick={() => navigate('/dashboard')}
                    >
                        Перейти в кабинет
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </Card>
        </div>
    );
}
