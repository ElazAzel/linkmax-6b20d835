import React, { useState } from 'react';
import { useTelegram } from '../TelegramContext';
import { useZones } from '@/hooks/zones/useZones';

export function OnboardingScreen() {
    const { haptic, setScreen } = useTelegram();
    const { createZone, loading: zonesLoading } = useZones();

    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = [
        { id: 'beauty', label: 'Красота и уход', icon: '💅' },
        { id: 'service', label: 'Услуги и сервис', icon: '🛠️' },
        { id: 'consult', label: 'Консультации', icon: '🧠' },
        { id: 'edu', label: 'Обучение', icon: '📚' },
        { id: 'other', label: 'Другое', icon: '✨' },
    ];

    const handleCreate = async () => {
        if (!name || !category) return;

        setIsSubmitting(true);
        haptic('impact', 'medium');

        try {
            // Create zone with default plan
            await createZone(name, name.toLowerCase().replace(/[^a-z0-9]/g, '-'));
            haptic('notification', 'success');
            setScreen('home');
        } catch (err) {
            console.error('Failed to create zone:', err);
            haptic('notification', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="tg-screen tg-fade-in" style={{ padding: '32px 24px' }}>
            {step === 1 ? (
                <div className="tg-slide-up">
                    <div style={{ fontSize: 48, marginBottom: 24 }}>🚀</div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
                        Добро пожаловать в LinkMAX!
                    </h1>
                    <p className="tg-text-hint" style={{ fontSize: 16, marginBottom: 32, lineHeight: 1.5 }}>
                        Давайте создадим ваше бизнес-пространство за пару секунд.
                    </p>

                    <div className="tg-section">
                        <label className="tg-text-hint" style={{ fontSize: 13, marginBottom: 8, display: 'block' }}>
                            Как называется ваш бренд?
                        </label>
                        <input
                            type="text"
                            className="tg-input"
                            placeholder="Напр: Studio 123"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <button
                        className="tg-button"
                        disabled={!name}
                        style={{ marginTop: 24 }}
                        onClick={() => {
                            haptic('selection');
                            setStep(2);
                        }}
                    >
                        Продолжить
                    </button>
                </div>
            ) : (
                <div className="tg-slide-up">
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
                        Выберите направление
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                className={`tg-quick-action ${category === cat.id ? 'tg-quick-action--selected' : ''}`}
                                onClick={() => {
                                    haptic('selection');
                                    setCategory(cat.id);
                                }}
                                style={{
                                    border: category === cat.id ? '2px solid var(--tg-theme-button-color)' : 'none',
                                    padding: category === cat.id ? '12px 14px' : '14px 16px'
                                }}
                            >
                                <span style={{ fontSize: 24 }}>{cat.icon}</span>
                                <span style={{ fontWeight: 600, fontSize: 16 }}>{cat.label}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <button
                            className="tg-button tg-button--secondary"
                            style={{ flex: 1 }}
                            onClick={() => setStep(1)}
                        >
                            Назад
                        </button>
                        <button
                            className="tg-button"
                            style={{ flex: 2 }}
                            disabled={!category || isSubmitting}
                            onClick={handleCreate}
                        >
                            {isSubmitting ? 'Создаем...' : 'Запустить бизнес'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
