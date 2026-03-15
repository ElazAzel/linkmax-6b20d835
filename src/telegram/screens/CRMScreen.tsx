import React from 'react';
import { useTranslation } from 'react-i18next';
import { useTelegram } from '../TelegramContext';
import { useTelegramZone } from '../hooks/useTelegramZone';
import { useZoneInbox, type ZoneConversation } from '@/hooks/zones/useZoneInbox';

export function CRMScreen() {
    const { t } = useTranslation();
    const { haptic, setScreen } = useTelegram();
    const { zoneId } = useTelegramZone();
    const { conversations, loading, refetch } = useZoneInbox(zoneId);

    if (loading) {
        return (
            <div className="tg-loading-centered">
                <div className="tg-spinner" />
            </div>
        );
    }

    return (
        <div className="tg-screen tg-fade-in">
            <div className="tg-screen-header">
                <h1 className="tg-screen-title">{t('tma.crm_title')}</h1>
                <button
                    className="tg-icon-button"
                    onClick={() => {
                        haptic('impact', 'light');
                        refetch();
                    }}
                >
                    🔄
                </button>
            </div>

            <div className="tg-section">
                {conversations.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📩</div>
                        <p className="tg-text-hint">{t('tma.crm_empty')}</p>
                    </div>
                ) : (
                    <div className="tg-list">
                        {conversations.map((conv) => (
                            <ConversationItem
                                key={conv.id}
                                conversation={conv}
                                onClick={() => {
                                    haptic('selection');
                                    // Screen lead_detail logic will be added here
                                    setScreen('lead_detail', conv.id);
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function ConversationItem({
    conversation,
    onClick
}: {
    conversation: ZoneConversation;
    onClick: () => void;
}) {
    const { t } = useTranslation();
    const lastMsgAt = conversation.last_message_at
        ? new Date(conversation.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

    return (
        <div className="tg-list-item" onClick={onClick}>
            <div className="tg-list-item-avatar">
                {conversation.contact?.name?.charAt(0) || 'U'}
            </div>
            <div className="tg-list-item-content">
                <div className="tg-list-item-row">
                    <span className="tg-list-item-title">
                        {conversation.contact?.name || conversation.title || t('tma.conv_no_name')}
                    </span>
                    <span className="tg-list-item-time">{lastMsgAt}</span>
                </div>
                <div className="tg-list-item-row">
                    <span className="tg-list-item-subtitle tg-ellipsis">
                        {conversation.last_message || t('tma.conv_no_msg')}
                    </span>
                    {conversation.unread_count && conversation.unread_count > 0 ? (
                        <span className="tg-badge">{conversation.unread_count}</span>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
