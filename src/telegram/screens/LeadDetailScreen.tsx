import { useTranslation } from 'react-i18next';
import { useTelegram } from '../TelegramContext';
import { useTelegramZone } from '../hooks/useTelegramZone';
import { useZoneInbox } from '@/hooks/zones/useZoneInbox';

interface Props {
  conversationId?: string;
}

export function LeadDetailScreen({ conversationId }: Props) {
  const { t } = useTranslation();
  const { goBack } = useTelegram();
  const { zoneId } = useTelegramZone();
  const { conversations } = useZoneInbox(zoneId);

  const conversation = conversations.find((c) => c.id === conversationId);

  if (!conversation) {
    return (
      <div className="tg-screen tg-fade-in" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          {t('tma.lead_not_found')}
        </h2>
        <button
          className="tg-button tg-button--secondary"
          style={{ maxWidth: 200, margin: '24px auto 0' }}
          onClick={goBack}
        >
          {t('tma.btn_back')}
        </button>
      </div>
    );
  }

  return (
    <div className="tg-screen tg-fade-in">
      <div className="tg-screen-header">
        <button className="tg-icon-button" onClick={goBack}>←</button>
        <h1 className="tg-screen-title">
          {conversation.contact?.name || conversation.title || t('tma.conv_no_name')}
        </h1>
      </div>

      <div className="tg-section" style={{ marginTop: 8 }}>
        <div className="tg-list">
          {conversation.contact?.phone && (
            <div className="tg-list-item" style={{ cursor: 'default' }}>
              <div className="tg-list-item-content">
                <span className="tg-list-item-subtitle">{t('tma.lead_phone')}</span>
                <span className="tg-list-item-title">{conversation.contact.phone}</span>
              </div>
            </div>
          )}
          {conversation.contact?.telegram_username && (
            <div className="tg-list-item" style={{ cursor: 'default' }}>
              <div className="tg-list-item-content">
                <span className="tg-list-item-subtitle">{t('tma.lead_telegram')}</span>
                <span className="tg-list-item-title">@{conversation.contact.telegram_username}</span>
              </div>
            </div>
          )}
          {conversation.last_message && (
            <div className="tg-list-item" style={{ cursor: 'default' }}>
              <div className="tg-list-item-content">
                <span className="tg-list-item-subtitle">{t('tma.lead_last_msg')}</span>
                <span className="tg-list-item-title">{conversation.last_message}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="tg-section" style={{ marginTop: 16 }}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p className="tg-text-hint">{t('tma.lead_detail_hint')}</p>
          <button
            className="tg-button tg-button--secondary"
            style={{ maxWidth: 200, margin: '12px auto 0' }}
            onClick={goBack}
          >
            {t('tma.btn_back')}
          </button>
        </div>
      </div>
    </div>
  );
}
