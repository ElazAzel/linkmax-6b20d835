import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CornerLogo, DarkBg, Headline, SceneFrame, useSpring } from '../components/ui';
import { C, FONT } from '../theme';

export const NOTIFY_TIMES = [14, 30, 46];
export const MOVE_AT = 70;

const notifications = [
  { title: 'Новая запись', body: 'Динара · Маникюр + гель · Сб 16:00' },
  { title: 'Заявка с формы', body: 'Алия: «Хочу на наращивание»' },
  { title: 'Оплата получена', body: 'Предоплата 3 000 ₸ · Kaspi' },
];

const TgIcon: React.FC = () => (
  <svg width={64} height={64} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="12" fill="#2aabee" />
    <path d="M5.5 11.8l11-4.3c.5-.2 1 .1.8.9l-1.9 8.8c-.1.6-.5.8-1 .5l-2.8-2.1-1.4 1.3c-.2.2-.3.3-.6.3l.2-2.9 5.3-4.8c.2-.2 0-.3-.3-.1l-6.6 4.1-2.8-.9c-.6-.2-.6-.6.1-.8z" fill="#fff" />
  </svg>
);

const Notification: React.FC<{ at: number; title: string; body: string; index: number }> = ({ at, title, body, index }) => {
  const p = useSpring(at, { damping: 14, mass: 0.7 });
  return (
    <div
      style={{
        position: 'absolute',
        left: 80,
        right: 80,
        top: 480 + index * 170,
        opacity: p,
        transform: `translateY(${(1 - p) * -120}px) scale(${0.9 + p * 0.1})`,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        padding: '26px 30px',
        borderRadius: 34,
        background: 'rgba(255,255,255,0.1)',
        border: '2px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(20px)',
        color: C.white,
        fontFamily: FONT,
      }}
    >
      <TgIcon />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, fontWeight: 600, opacity: 0.6 }}>
          <span>LinkMAX Bot</span>
          <span>сейчас</span>
        </div>
        <div style={{ fontSize: 36, fontWeight: 800, marginTop: 4 }}>{title}</div>
        <div style={{ fontSize: 30, fontWeight: 500, opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{body}</div>
      </div>
    </div>
  );
};

const Lead: React.FC<{ name: string; tag: string; hot?: boolean }> = ({ name, tag, hot }) => (
  <div style={{ background: C.white, borderRadius: 20, padding: '18px 18px', marginTop: 14, boxShadow: '0 0 0 1.5px rgba(16,19,24,0.06)' }}>
    <div style={{ fontSize: 27, fontWeight: 800, color: C.ink }}>{name}</div>
    <div style={{ fontSize: 22, fontWeight: 600, color: hot ? C.orange : C.sage, marginTop: 4 }}>{tag}</div>
  </div>
);

export const Crm: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const board = useSpring(52, { damping: 16 });
  const move = interpolate(frame, [MOVE_AT, MOVE_AT + 16], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ease = move * move * (3 - 2 * move);
  const colW = 296;

  return (
    <SceneFrame duration={duration}>
      <DarkBg glowY={380} />
      <CornerLogo />
      <Headline text="Все заявки — в CRM и Telegram" accent="CRM Telegram" top={230} size={86} />

      {notifications.map((n, i) => (
        <Notification key={n.title} at={NOTIFY_TIMES[i]} index={i} {...n} />
      ))}

      <div
        style={{
          position: 'absolute',
          left: 60,
          right: 60,
          top: 1030,
          padding: 30,
          borderRadius: 44,
          background: C.paper,
          fontFamily: FONT,
          opacity: board,
          transform: `translateY(${(1 - board) * 200}px)`,
          boxShadow: '0 40px 120px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ fontSize: 34, fontWeight: 800, color: C.ink, marginBottom: 18 }}>Воронка клиентов</div>
        <div style={{ position: 'relative', display: 'flex', gap: 18 }}>
          {[
            ['Новые', 2],
            ['В работе', 1],
            ['Клиенты', 3],
          ].map(([title, count], i) => (
            <div key={title} style={{ width: colW, minHeight: 420, background: '#ecebe4', borderRadius: 26, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26, fontWeight: 700, color: C.sage, padding: '4px 6px' }}>
                <span>{title}</span>
                <span>{Number(count) + (i === 1 ? (move > 0.5 ? 1 : 0) : i === 0 ? (move > 0.5 ? -1 : 0) : 0)}</span>
              </div>
              {i === 0 && (
                <>
                  <div style={{ height: 108 }} />
                  <Lead name="Алия" tag="Наращивание" />
                </>
              )}
              {i === 1 && <Lead name="Жанна" tag="Консультация" />}
              {i === 2 && (
                <>
                  <Lead name="Мадина" tag="Постоянный клиент" />
                  <Lead name="Сауле" tag="Повторная запись" />
                  <Lead name="Ирина" tag="Отзыв оставлен" />
                </>
              )}
            </div>
          ))}
          {/* Карточка, которая переезжает из «Новые» в «В работе» */}
          <div
            style={{
              position: 'absolute',
              left: 16 + ease * (colW + 18),
              top: 58 + ease * 122,
              width: colW - 32,
              transform: `rotate(${Math.sin(move * Math.PI) * 4}deg) scale(${1 + Math.sin(move * Math.PI) * 0.06})`,
              zIndex: 3,
            }}
          >
            <Lead name="Динара" tag="Оплачено · Сб 16:00" hot />
          </div>
        </div>
      </div>
    </SceneFrame>
  );
};
