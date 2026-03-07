import React from 'react';
import { useTelegram } from '../TelegramContext';
import { useTelegramZone } from '../hooks/useTelegramZone';
import { useZoneBookings, type ZoneBooking } from '@/hooks/zones/useZoneBookings';

export function BookingsScreen() {
    const { haptic } = useTelegram();
    const { zoneId } = useTelegramZone();
    const { bookings, loading, refetch } = useZoneBookings(zoneId);

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
                <h1 className="tg-screen-title">Записи</h1>
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
                {bookings.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
                        <p className="tg-text-hint">Записей пока нет</p>
                    </div>
                ) : (
                    <div className="tg-list">
                        {bookings.map((booking) => (
                            <BookingItem
                                key={booking.id}
                                booking={booking}
                                onClick={() => {
                                    haptic('selection');
                                    // Detail view could be added here
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function BookingItem({
    booking,
    onClick
}: {
    booking: ZoneBooking;
    onClick: () => void;
}) {
    const date = new Date(booking.slot_date).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short'
    });

    return (
        <div className="tg-list-item" onClick={onClick}>
            <div className="tg-list-item-avatar" style={{ borderRadius: '10px', fontSize: '14px' }}>
                {date}
            </div>
            <div className="tg-list-item-content">
                <div className="tg-list-item-row">
                    <span className="tg-list-item-title">
                        {booking.client_name || 'Клиент'}
                    </span>
                    <span className="tg-list-item-time">{booking.slot_time}</span>
                </div>
                <div className="tg-list-item-row">
                    <span className="tg-list-item-subtitle tg-ellipsis">
                        {booking.page_title || 'Источник'}
                    </span>
                    <span
                        className="tg-badge"
                        style={{
                            backgroundColor: booking.status === 'confirmed' ? '#4caf50' : 'var(--tg-theme-button-color)',
                            opacity: booking.status === 'confirmed' ? 1 : 0.8
                        }}
                    >
                        {booking.status === 'confirmed' ? 'Ок' : 'Новый'}
                    </span>
                </div>
            </div>
        </div>
    );
}
