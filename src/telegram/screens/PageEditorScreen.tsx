import React, { useState, useEffect } from 'react';
import { useTelegram } from '../TelegramContext';
import { useCloudPageState } from '@/hooks/page/useCloudPageState';
import type { ProfileBlock, LinkBlock } from '@/types/blocks/content';
import type { Block } from '@/types/page';

export function PageEditorScreen() {
    const { haptic, setBottomButton } = useTelegram();
    const { pageData, loading, updateBlock, addBlock, deleteBlock, saving, publish } = useCloudPageState();

    const [activeTab, setActiveTab] = useState<'profile' | 'links'>('profile');

    // Find blocks
    const profileBlock = pageData?.blocks.find(b => b.type === 'profile') as ProfileBlock | undefined;
    const linkBlocks = pageData?.blocks.filter(b => b.type === 'link') as LinkBlock[];

    // Update MainButton for publishing
    useEffect(() => {
        if (pageData) {
            setBottomButton({
                text: saving ? 'Сохранение...' : 'Опубликовать страницу',
                onClick: async () => {
                    haptic('impact', 'medium');
                    await publish();
                    haptic('notification', 'success');
                },
                isActive: !saving,
                showProgress: saving
            });
        }
        return () => setBottomButton(null);
    }, [pageData, saving, publish, haptic, setBottomButton]);

    if (loading) {
        return (
            <div className="tg-loading-centered">
                <div className="tg-spinner" />
            </div>
        );
    }

    if (!pageData) {
        return (
            <div className="tg-screen tg-fade-in" style={{ padding: 20, textAlign: 'center' }}>
                <p className="tg-text-hint">Страница не найдена</p>
            </div>
        );
    }

    return (
        <div className="tg-screen tg-fade-in">
            <div className="tg-screen-header">
                <h1 className="tg-screen-title">Редактор</h1>
                <div className="tg-tabs">
                    <button
                        className={`tg-tab ${activeTab === 'profile' ? 'tg-tab--active' : ''}`}
                        onClick={() => { haptic('selection'); setActiveTab('profile'); }}
                    >
                        Профиль
                    </button>
                    <button
                        className={`tg-tab ${activeTab === 'links' ? 'tg-tab--active' : ''}`}
                        onClick={() => { haptic('selection'); setActiveTab('links'); }}
                    >
                        Ссылки
                    </button>
                </div>
            </div>

            <div className="tg-section">
                {activeTab === 'profile' && profileBlock && (
                    <div className="tg-form tg-slide-up">
                        <div className="tg-form-group">
                            <label className="tg-label">Имя / Заголовок</label>
                            <input
                                type="text"
                                className="tg-input"
                                value={typeof profileBlock.name === 'string' ? profileBlock.name : (profileBlock.name as any)?.ru || ''}
                                onChange={(e) => updateBlock(profileBlock.id, { name: e.target.value })}
                            />
                        </div>
                        <div className="tg-form-group">
                            <label className="tg-label">О себе (Bio)</label>
                            <textarea
                                className="tg-input"
                                rows={3}
                                value={typeof profileBlock.bio === 'string' ? profileBlock.bio : (profileBlock.bio as any)?.ru || ''}
                                onChange={(e) => updateBlock(profileBlock.id, { bio: e.target.value })}
                            />
                        </div>
                        <div className="tg-form-group">
                            <label className="tg-label">Ссылка на фото (Avatar URL)</label>
                            <input
                                type="text"
                                className="tg-input"
                                value={profileBlock.avatar || ''}
                                onChange={(e) => updateBlock(profileBlock.id, { avatar: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'links' && (
                    <div className="tg-slide-up">
                        <div className="tg-list" style={{ marginBottom: 16 }}>
                            {linkBlocks.map((link) => (
                                <div key={link.id} className="tg-list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                    <div className="tg-list-item-row" style={{ marginBottom: 8 }}>
                                        <input
                                            type="text"
                                            className="tg-input tg-input--small"
                                            style={{ fontWeight: 600 }}
                                            value={typeof link.title === 'string' ? link.title : (link.title as any)?.ru || ''}
                                            onChange={(e) => updateBlock(link.id, { title: e.target.value })}
                                        />
                                        <button
                                            className="tg-icon-button"
                                            style={{ color: 'var(--tg-theme-destructive-text-color)', fontSize: 16 }}
                                            onClick={() => { haptic('impact', 'light'); deleteBlock(link.id); }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        className="tg-input tg-input--small"
                                        placeholder="https://..."
                                        value={link.url}
                                        onChange={(e) => updateBlock(link.id, { url: e.target.value })}
                                    />
                                </div>
                            ))}
                        </div>

                        <button
                            className="tg-button tg-button--secondary"
                            onClick={() => {
                                haptic('impact', 'light');
                                addBlock({
                                    id: crypto.randomUUID(),
                                    type: 'link',
                                    title: 'Новая ссылка',
                                    url: 'https://',
                                } as any);
                            }}
                        >
                            + Добавить ссылку
                        </button>
                    </div>
                )}
            </div>

            <div className="tg-section" style={{ marginTop: 20 }}>
                <div className="tg-card">
                    <div className="tg-text-hint" style={{ fontSize: 12, marginBottom: 4 }}>Адрес вашей страницы:</div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--tg-theme-link-color)' }}>
                        lnkmx.my/{pageData.slug}
                    </div>
                </div>
            </div>
        </div>
    );
}
