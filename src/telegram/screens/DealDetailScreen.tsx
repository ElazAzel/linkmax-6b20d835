import { useTranslation } from 'react-i18next';
import { useTelegram } from '../TelegramContext';
import { useTelegramZone } from '../hooks/useTelegramZone';
import { useZoneDeals } from '@/hooks/zones/useZoneDeals';

interface Props {
  dealId?: string;
}

export function DealDetailScreen({ dealId }: Props) {
  const { t } = useTranslation();
  const { goBack } = useTelegram();
  const { zoneId } = useTelegramZone();
  const { deals, loading } = useZoneDeals(zoneId);

  const deal = deals.find((d) => d.id === dealId);

  if (loading) {
    return (
      <div className="tg-loading-centered">
        <div className="tg-spinner" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="tg-screen tg-fade-in" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          {t('tma.deal_not_found')}
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
        <h1 className="tg-screen-title">{deal.title}</h1>
      </div>

      <div className="tg-section" style={{ marginTop: 8 }}>
        <div className="tg-list">
          <div className="tg-list-item" style={{ cursor: 'default' }}>
            <div className="tg-list-item-content">
              <span className="tg-list-item-subtitle">{t('tma.deal_value')}</span>
              <span className="tg-list-item-title">
                {Number(deal.value_amount || 0).toLocaleString()} {deal.currency || '₸'}
              </span>
            </div>
          </div>
          <div className="tg-list-item" style={{ cursor: 'default' }}>
            <div className="tg-list-item-content">
              <span className="tg-list-item-subtitle">{t('tma.deal_status')}</span>
              <span className="tg-list-item-title">{deal.stage?.name || deal.status}</span>
            </div>
          </div>
          {deal.contact?.name && (
            <div className="tg-list-item" style={{ cursor: 'default' }}>
              <div className="tg-list-item-content">
                <span className="tg-list-item-subtitle">{t('tma.deal_contact')}</span>
                <span className="tg-list-item-title">{deal.contact.name}</span>
              </div>
            </div>
          )}
          {deal.next_step && (
            <div className="tg-list-item" style={{ cursor: 'default' }}>
              <div className="tg-list-item-content">
                <span className="tg-list-item-subtitle">{t('tma.deal_next_step')}</span>
                <span className="tg-list-item-title">{deal.next_step}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="tg-section" style={{ marginTop: 16 }}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p className="tg-text-hint">{t('tma.deal_detail_hint')}</p>
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
