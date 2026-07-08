import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTelegram } from '../TelegramContext';
import { useZones } from '@/hooks/zones/useZones';

export function OnboardingScreen() {
    const { t } = useTranslation();
    const { haptic, setScreen } = useTelegram();
    const { createZone } = useZones();

    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = [
        { id: 'beauty', label: t('tma.cat_beauty'), icon: '💅' },
        { id: 'service', label: t('tma.cat_service'), icon: '🛠️' },
        { id: 'consult', label: t('tma.cat_consult'), icon: '🧠' },
        { id: 'edu', label: t('tma.cat_edu'), icon: '📚' },
        { id: 'other', label: t('tma.cat_other'), icon: '✨' },
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
                        {t('tma.onboarding_welcome')}
                    </h1>
                    <p className="tg-text-hint" style={{ fontSize: 16, marginBottom: 32, lineHeight: 1.5 }}>
                        {t('tma.onboarding_subtitle')}
                    </p>

                    <div className="tg-section">
                        <label className="tg-text-hint" style={{ fontSize: 13, marginBottom: 8, display: 'block' }}>
                            {t('tma.onboarding_brand_label')}
                        </label>
                        <input
                            type="text"
                            className="tg-input"
                            placeholder={t('tma.onboarding_brand_placeholder')}
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
                        {t('tma.btn_continue')}
                    </button>
                </div>
            ) : (
                <div className="tg-slide-up">
                    <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>
                        {t('tma.onboarding_category_title')}
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
                            {t('tma.btn_back')}
                        </button>
                        <button
                            className="tg-button"
                            style={{ flex: 2 }}
                            disabled={!category || isSubmitting}
                            onClick={handleCreate}
                        >
                            {isSubmitting ? t('tma.btn_submitting') : t('tma.btn_launch')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
