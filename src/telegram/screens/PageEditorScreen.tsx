import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTelegram } from '../TelegramContext';
import { useCloudPageState } from '@/hooks/page/useCloudPageState';
import type { ProfileBlock, LinkBlock } from '@/types/blocks/content';
import { QRCodeSVG } from 'qrcode.react';

export function PageEditorScreen() {
    const { t } = useTranslation();
    const { haptic, setBottomButton } = useTelegram();
    const { pageData, loading, updateBlock, addBlock, deleteBlock, saving, publish } = useCloudPageState();

    const [activeTab, setActiveTab] = useState<'profile' | 'links' | 'qr'>('profile');

    // Find blocks
    const profileBlock = pageData?.blocks.find(b => b.type === 'profile') as ProfileBlock | undefined;
    const linkBlocks = pageData?.blocks.filter(b => b.type === 'link') as LinkBlock[];

    // Update MainButton for publishing
    useEffect(() => {
        if (pageData) {
            setBottomButton({
                text: saving ? t('tma.btn_publishing') : t('tma.btn_publish_full'),
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
    }, [pageData, saving, publish, haptic, setBottomButton, t]);

    if (loading && !pageData) {
        return (
            <div className="tg-loading-centered">
                <div className="tg-spinner" />
            </div>
        );
    }

    if (!pageData) {
        return (
            <div className="tg-screen tg-fade-in" style={{ padding: 20, textAlign: 'center' }}>
                <p className="tg-text-hint">{t('tma.page_not_found')}</p>
            </div>
        );
    }

    return (
        <div className="tg-screen tg-fade-in">
            <div className="tg-screen-header">
                <h1 className="tg-screen-title">{t('tma.editor_title')}</h1>
            </div>

            {/* Tabs */}
            <div className="tg-tabs">
                <div
                    className={`tg-tab ${activeTab === 'profile' ? 'tg-tab--active' : ''}`}
                    onClick={() => { haptic('selection'); setActiveTab('profile'); }}
                >
                    {t('tma.tab_profile')}
                </div>
                <div
                    className={`tg-tab ${activeTab === 'links' ? 'tg-tab--active' : ''}`}
                    onClick={() => { haptic('selection'); setActiveTab('links'); }}
                >
                    {t('tma.tab_links')}
                </div>
                <div
                    className={`tg-tab ${activeTab === 'qr' ? 'tg-tab--active' : ''}`}
                    onClick={() => { haptic('selection'); setActiveTab('qr'); }}
                >
                    {t('tma.tab_qr')}
                </div>
            </div>

            <div className="tg-tab-content" style={{ marginTop: 16 }}>
                {activeTab === 'profile' && profileBlock && (
                    <div className="tg-section tg-slide-up">
                        <div className="tg-form-item">
                            <label className="tg-label">{t('tma.label_name_title')}</label>
                            <input
                                type="text"
                                className="tg-input"
                                value={typeof profileBlock.name === 'string' ? profileBlock.name : (profileBlock.name as any)?.ru || ''}
                                onChange={(e) => updateBlock(profileBlock.id, { name: e.target.value })}
                                placeholder={t('tma.placeholder_name')}
                            />
                        </div>
                        <div className="tg-form-item">
                            <label className="tg-label">{t('tma.label_bio')}</label>
                            <textarea
                                className="tg-input"
                                style={{ minHeight: 100, paddingTop: 12 }}
                                value={typeof profileBlock.bio === 'string' ? profileBlock.bio : (profileBlock.bio as any)?.ru || ''}
                                onChange={(e) => updateBlock(profileBlock.id, { bio: e.target.value })}
                                placeholder={t('tma.placeholder_bio')}
                            />
                        </div>
                        <div className="tg-form-item">
                            <label className="tg-label">{t('tma.label_avatar_url')}</label>
                            <input
                                type="text"
                                className="tg-input"
                                value={profileBlock.avatar || ''}
                                onChange={(e) => updateBlock(profileBlock.id, { avatar: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'links' && (
                    <div className="tg-section tg-slide-up">
                        <div className="tg-list" style={{ marginBottom: 16 }}>
                            {linkBlocks.map((link) => (
                                <div key={link.id} className="tg-list-item" style={{ flexDirection: 'column', alignItems: 'stretch', padding: '12px 16px' }}>
                                    <div className="tg-list-item-row" style={{ marginBottom: 8 }}>
                                        <input
                                            type="text"
                                            className="tg-input"
                                            style={{ fontWeight: 600, border: 'none', padding: 0, height: 'auto', background: 'transparent' }}
                                            value={typeof link.title === 'string' ? link.title : (link.title as any)?.ru || ''}
                                            onChange={(e) => updateBlock(link.id, { title: e.target.value })}
                                            placeholder={t('tma.link_title_placeholder')}
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
                                    title: t('tma.link_new_title'),
                                    url: 'https://',
                                } as any);
                            }}
                        >
                            + {t('tma.btn_add_link')}
                        </button>
                    </div>
                )}

                {activeTab === 'qr' && (
                    <div className="tg-section tg-slide-up" style={{ textAlign: 'center' }}>
                        <div style={{
                            background: '#fff',
                            padding: 20,
                            borderRadius: 16,
                            display: 'inline-block',
                            marginBottom: 20,
                            marginTop: 10
                        }}>
                            <QRCodeSVG
                                value={`https://lnkmx.my/${pageData.slug}`}
                                size={180}
                                level="M"
                                includeMargin={false}
                            />
                        </div>
                        <p className="tg-text-hint" style={{ fontSize: 14, marginBottom: 20 }}>
                            {t('tma.qr_instruction')}
                        </p>
                        <div className="tg-form-item" style={{ textAlign: 'left' }}>
                            <label className="tg-label">{t('tma.label_page_url')}</label>
                            <div className="tg-input" style={{ display: 'flex', alignItems: 'center', opacity: 0.7 }}>
                                lnkmx.my/{pageData.slug}
                            </div>
                        </div>
                        <button
                            className="tg-button tg-button--secondary"
                            onClick={() => {
                                haptic('selection');
                                // Copy logic...
                            }}
                        >
                            {t('tma.btn_copy_link')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
