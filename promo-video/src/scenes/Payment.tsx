import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { Card, Check, CornerLogo, Cursor, DarkBg, Headline, Phone, PopIn, SceneFrame, Sub, useSpring } from '../components/ui';
import { C } from '../theme';

export const METHOD_TAP = 36;
export const PAY_TAP = 60;
export const PAID_AT = 68;

export const Payment: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const paid = useSpring(PAID_AT, { damping: 12, mass: 0.7 });
  const methodSel = frame >= METHOD_TAP;
  const cx = interpolate(frame, [16, METHOD_TAP, PAY_TAP - 10, PAY_TAP], [760, 380, 380, 540], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const cy = interpolate(frame, [16, METHOD_TAP, PAY_TAP - 10, PAY_TAP], [1650, 1330, 1330, 1640], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pressed = [METHOD_TAP, PAY_TAP].some((t) => frame >= t && frame < t + 5);
  const cursorOpacity = interpolate(frame, [12, 18, PAID_AT - 2, PAID_AT + 4], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  // Сумма на «кассе» бежит вверх после оплаты
  const amount = Math.round(interpolate(frame, [PAID_AT, PAID_AT + 24], [21000, 24000], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));

  return (
    <SceneFrame duration={duration}>
      <DarkBg glowY={380} />
      <CornerLogo />
      <Headline text="Предоплата прямо на странице" accent="Предоплата" top={230} size={92} />
      <Sub text="Меньше неявок — деньги приходят сразу" top={450} />

      <Phone top={640}>
        <div style={{ fontSize: 30, color: C.sage, fontWeight: 600 }}>Оплата записи</div>
        <div style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-0.03em', marginTop: 6 }}>Маникюр + гель</div>
        <Card style={{ marginTop: 28 }}>
          {[
            ['Дата', 'Сб, 14 · 16:00'],
            ['Мастер', 'Айгерим'],
            ['Предоплата', '3 000 ₸'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 30, fontWeight: 600, padding: '10px 0' }}>
              <span style={{ color: C.sage }}>{k}</span>
              <span style={{ fontWeight: 800 }}>{v}</span>
            </div>
          ))}
        </Card>
        <div style={{ fontSize: 30, fontWeight: 700, marginTop: 34 }}>Способ оплаты</div>
        <div style={{ display: 'flex', gap: 16, marginTop: 18 }}>
          {['Kaspi', 'Карта'].map((m, i) => {
            const active = methodSel && i === 0;
            return (
              <PopIn key={m} delay={10 + i * 4} style={{ flex: 1 }}>
                <div
                  style={{
                    padding: '30px 0',
                    borderRadius: 24,
                    textAlign: 'center',
                    fontSize: 34,
                    fontWeight: 800,
                    background: active ? C.orangeSoft : C.white,
                    boxShadow: active ? `inset 0 0 0 4px ${C.orange}` : '0 0 0 1.5px rgba(16,19,24,0.08)',
                  }}
                >
                  {m}
                </div>
              </PopIn>
            );
          })}
        </div>
        <div
          style={{
            marginTop: 34,
            padding: '32px 0',
            borderRadius: 28,
            textAlign: 'center',
            fontSize: 38,
            fontWeight: 800,
            background: methodSel ? C.orange : '#e2e0d6',
            color: C.white,
            transform: `scale(${frame >= PAY_TAP && frame < PAY_TAP + 5 ? 0.96 : 1})`,
          }}
        >
          Оплатить 3 000 ₸
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: C.paper,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: Math.min(1, paid * 3),
          }}
        >
          <div style={{ transform: `scale(${paid})` }}>
            <Check size={200} />
          </div>
          <div style={{ fontSize: 56, fontWeight: 800, marginTop: 40, letterSpacing: '-0.03em' }}>Оплачено</div>
          <div style={{ fontSize: 34, color: C.sage, marginTop: 12, fontWeight: 600 }}>Запись подтверждена</div>
        </div>
      </Phone>

      {/* Плашка «доход за день» у мастера */}
      <div style={{ position: 'absolute', left: 120, right: 120, top: 1540, opacity: paid, transform: `translateY(${(1 - paid) * 80}px)` }}>
        <Card dark style={{ display: 'flex', alignItems: 'center', gap: 24, padding: '30px 36px', boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.12)' }}>
          <div style={{ width: 76, height: 76, borderRadius: 22, background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, fontWeight: 800 }}>₸</div>
          <div>
            <div style={{ fontSize: 26, opacity: 0.6, fontWeight: 600 }}>Выручка за сегодня</div>
            <div style={{ fontSize: 50, fontWeight: 800, letterSpacing: '-0.03em' }}>{String(amount).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₸</div>
          </div>
        </Card>
      </div>

      <div style={{ opacity: cursorOpacity }}>
        <Cursor x={cx} y={cy} pressed={pressed} />
      </div>
    </SceneFrame>
  );
};
