import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { Card, Check, CornerLogo, Cursor, DarkBg, Headline, Phone, PopIn, SceneFrame, Sub, useSpring } from '../components/ui';
import { C } from '../theme';

export const DAY_TAP = 34;
export const SLOT_TAP = 56;
export const CONFIRM_TAP = 80;
export const BOOKED_AT = 86;

const days = [
  ['Чт', '12'],
  ['Пт', '13'],
  ['Сб', '14'],
  ['Вс', '15'],
  ['Пн', '16'],
];
const slots = ['10:00', '11:30', '13:00', '14:30', '16:00', '17:30'];

export const Booking: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const daySel = frame >= DAY_TAP;
  const slotSel = frame >= SLOT_TAP;
  const booked = useSpring(BOOKED_AT, { damping: 12, mass: 0.7 });

  // Палец ведём по ключевым точкам: день → слот → кнопка
  const cx = interpolate(frame, [18, DAY_TAP, SLOT_TAP - 10, SLOT_TAP, CONFIRM_TAP - 10, CONFIRM_TAP], [700, 540, 540, 700, 700, 540], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const cy = interpolate(frame, [18, DAY_TAP, SLOT_TAP - 10, SLOT_TAP, CONFIRM_TAP - 10, CONFIRM_TAP], [1500, 1010, 1010, 1310, 1310, 1600], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const pressed = [DAY_TAP, SLOT_TAP, CONFIRM_TAP].some((t) => frame >= t && frame < t + 5);
  const cursorOpacity = interpolate(frame, [14, 20, BOOKED_AT - 2, BOOKED_AT + 4], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <SceneFrame duration={duration}>
      <DarkBg glowY={380} />
      <CornerLogo />
      <Headline text="Запись без переписки" accent="без переписки" top={230} size={96} />
      <Sub text="Клиент сам выбирает услугу, день и время — 24/7" top={450} />

      <Phone top={640}>
        <div style={{ fontSize: 30, color: C.sage, fontWeight: 600 }}>Маникюр + гель · 1,5 ч</div>
        <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-0.03em', marginTop: 6 }}>Выберите время</div>
        <div style={{ display: 'flex', gap: 14, marginTop: 30 }}>
          {days.map(([d, n], i) => {
            const active = daySel && i === 2;
            return (
              <div
                key={n}
                style={{
                  flex: 1,
                  padding: '20px 0',
                  borderRadius: 24,
                  textAlign: 'center',
                  background: active ? C.orange : C.white,
                  color: active ? C.white : C.ink,
                  boxShadow: '0 0 0 1.5px rgba(16,19,24,0.08)',
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 600, opacity: 0.7 }}>{d}</div>
                <div style={{ fontSize: 40, fontWeight: 800 }}>{n}</div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 28 }}>
          {slots.map((s, i) => {
            const taken = i === 0 || i === 2;
            const active = slotSel && i === 4;
            return (
              <PopIn key={s} delay={DAY_TAP + 2 + i * 2}>
                <div
                  style={{
                    padding: '24px 0',
                    borderRadius: 22,
                    textAlign: 'center',
                    fontSize: 34,
                    fontWeight: 700,
                    background: active ? C.ink : taken ? 'transparent' : C.white,
                    color: active ? C.white : taken ? '#b3b6ae' : C.ink,
                    textDecoration: taken ? 'line-through' : undefined,
                    boxShadow: taken ? 'inset 0 0 0 2px #e2e0d6' : '0 0 0 1.5px rgba(16,19,24,0.08)',
                  }}
                >
                  {s}
                </div>
              </PopIn>
            );
          })}
        </div>
        <Card style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 30, fontWeight: 600 }}>
          <span>{slotSel ? 'Сб, 14 · 16:00' : 'Время не выбрано'}</span>
          <span style={{ fontWeight: 800 }}>9 000 ₸</span>
        </Card>
        <div
          style={{
            marginTop: 26,
            padding: '32px 0',
            borderRadius: 28,
            textAlign: 'center',
            fontSize: 38,
            fontWeight: 800,
            background: slotSel ? C.orange : '#e2e0d6',
            color: C.white,
          }}
        >
          Подтвердить запись
        </div>

        {/* Экран успеха */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: C.paper,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: Math.min(1, booked * 3),
          }}
        >
          <div style={{ transform: `scale(${booked})` }}>
            <Check size={200} />
          </div>
          <div style={{ fontSize: 56, fontWeight: 800, marginTop: 40, letterSpacing: '-0.03em' }}>Вы записаны!</div>
          <div style={{ fontSize: 34, color: C.sage, marginTop: 12, fontWeight: 600 }}>Сб, 14 · 16:00</div>
          <div style={{ fontSize: 28, color: C.sage, marginTop: 36, fontWeight: 500 }}>Напоминание придёт заранее</div>
        </div>
      </Phone>
      <div style={{ opacity: cursorOpacity }}>
        <Cursor x={cx} y={cy} pressed={pressed} />
      </div>
    </SceneFrame>
  );
};
