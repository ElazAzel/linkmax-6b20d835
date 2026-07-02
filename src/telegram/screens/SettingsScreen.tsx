import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTelegram } from '../TelegramContext';

const LANGUAGES = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
  { code: 'kk', label: 'Қазақша' },
];

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { goBack } = useTelegram();
  const [notifications, setNotifications] = useState(true);

  const currentLang = i18n.language?.split('-')[0] || 'ru';

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
  };

  return (
    <div className="tg-screen tg-fade-in">
      <div className="tg-screen-header">
        <button className="tg-icon-button" onClick={goBack}>←</button>
        <h1 className="tg-screen-title">{t('tma.nav_more')}</h1>
      </div>

      <div className="tg-section" style={{ marginTop: 8 }}>
        <div className="tg-section-header">{t('tma.settings_language')}</div>
        <div className="tg-list">
          {LANGUAGES.map((lang) => (
            <div
              key={lang.code}
              className="tg-list-item"
              onClick={() => handleLanguageChange(lang.code)}
            >
              <div className="tg-list-item-content">
                <span className="tg-list-item-title">{lang.label}</span>
              </div>
              {currentLang === lang.code && <span style={{ color: 'var(--tg-theme-button-color)' }}>✓</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="tg-section" style={{ marginTop: 16 }}>
        <div className="tg-section-header">{t('tma.settings_notifications')}</div>
        <div className="tg-list">
          <div
            className="tg-list-item"
            onClick={() => setNotifications(!notifications)}
          >
            <div className="tg-list-item-content">
              <span className="tg-list-item-title">{t('tma.settings_notif_toggle')}</span>
            </div>
            <div
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                backgroundColor: notifications ? 'var(--tg-theme-button-color)' : 'var(--tg-theme-hint-color)',
                position: 'relative',
                transition: 'background-color 0.2s',
                opacity: 0.6,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#fff',
                  position: 'absolute',
                  top: 2,
                  left: notifications ? 22 : 2,
                  transition: 'left 0.2s',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="tg-section" style={{ marginTop: 16 }}>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p className="tg-text-hint" style={{ fontSize: 13 }}>
            LinkMax · @linkmaxmy_bot
          </p>
        </div>
      </div>
    </div>
  );
}
