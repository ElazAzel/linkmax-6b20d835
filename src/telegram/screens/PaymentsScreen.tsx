import { useTranslation } from 'react-i18next';
import { useTelegram } from '../TelegramContext';
import { useTelegramZone } from '../hooks/useTelegramZone';
import { useZoneInvoices } from '@/hooks/zones/useZoneInvoices';

const statusColors: Record<string, string> = {
  paid: '#4caf50',
  created: '#ff9800',
  failed: '#f44336',
  expired: '#9e9e9e',
};

export function PaymentsScreen() {
  const { t } = useTranslation();
  const { goBack } = useTelegram();
  const { zoneId } = useTelegramZone();
  const { invoices, loading } = useZoneInvoices(zoneId);

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
        <h1 className="tg-screen-title">{t('tma.nav_payments')}</h1>
      </div>

      {invoices.length === 0 ? (
        <div style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💳</div>
          <p className="tg-text-hint">{t('tma.payments_empty')}</p>
          <button
            className="tg-button tg-button--secondary"
            style={{ maxWidth: 200, margin: '24px auto 0' }}
            onClick={goBack}
          >
            {t('tma.btn_back')}
          </button>
        </div>
      ) : (
        <div className="tg-section" style={{ marginTop: 8 }}>
          <div className="tg-list">
            {invoices.map((inv) => (
              <div key={inv.id} className="tg-list-item" style={{ cursor: 'default' }}>
                <div className="tg-list-item-content">
                  <div className="tg-list-item-row">
                    <span className="tg-list-item-title">
                      {inv.description || t('tma.invoice_no_desc')}
                    </span>
                    <span
                      className="tg-badge"
                      style={{
                        backgroundColor: statusColors[inv.status] || '#9e9e9e',
                        opacity: 0.9,
                      }}
                    >
                    {inv.status === 'paid' ? t('tma.status_paid') :
                     inv.status === 'created' ? t('tma.status_created') :
                     inv.status === 'failed' ? t('tma.status_failed') : inv.status}
                    </span>
                  </div>
                  <div className="tg-list-item-row">
                    <span className="tg-list-item-subtitle">
                      {Number(inv.amount || 0).toLocaleString()} {inv.currency || '₸'}
                    </span>
                    <span className="tg-list-item-time">
                      {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
