import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { Card, CornerLogo, DarkBg, Headline, Phone, PopIn, SceneFrame } from '../components/ui';
import { C, FONT } from '../theme';

export const PROMPT = 'Мастер маникюра, Алматы';
export const TYPE_START = 14;
export const TYPE_SPEED = 1.6; // кадров на символ
export const GENERATE_AT = 58;
export const BLOCK_TIMES = [72, 84, 96, 108, 120];

const Sparkle: React.FC<{ size?: number; color?: string }> = ({ size = 36, color = C.orange }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M12 2l2.2 6.3L20.5 10.5 14.2 12.7 12 19l-2.2-6.3L3.5 10.5l6.3-2.2z" fill={color} />
  </svg>
);

export const AiBuilder: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const chars = Math.max(0, Math.min(PROMPT.length, Math.floor((frame - TYPE_START) / TYPE_SPEED)));
  const typed = PROMPT.slice(0, chars);
  const pressed = frame >= GENERATE_AT && frame < GENERATE_AT + 5;
  const loading = interpolate(frame, [GENERATE_AT, BLOCK_TIMES[0]], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const caret = Math.floor(frame / 8) % 2 === 0 && frame < GENERATE_AT;

  return (
    <SceneFrame duration={duration}>
      <DarkBg glowY={500} />
      <CornerLogo />
      <Headline text="Страница за пару минут с AI" accent="AI" top={230} size={88} />

      {/* Поле промпта */}
      <div style={{ position: 'absolute', top: 470, left: 80, right: 80, fontFamily: FONT }}>
        <PopIn delay={4}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: 14,
              borderRadius: 32,
              background: C.white,
              boxShadow: '0 24px 70px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16, padding: '0 18px', height: 96, borderRadius: 22, background: C.paper, fontSize: 38, fontWeight: 600, color: C.ink }}>
              <Sparkle />
              <span>{typed}</span>
              {caret && <span style={{ width: 4, height: 44, background: C.orange }} />}
            </div>
            <div
              style={{
                height: 96,
                padding: '0 34px',
                borderRadius: 22,
                background: C.orange,
                color: C.white,
                display: 'flex',
                alignItems: 'center',
                fontSize: 34,
                fontWeight: 700,
                transform: `scale(${pressed ? 0.92 : 1})`,
                boxShadow: '0 10px 24px rgba(255,87,1,0.35)',
              }}
            >
              Создать
            </div>
          </div>
        </PopIn>
        <div style={{ marginTop: 18, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', opacity: loading > 0 && loading < 1 ? 1 : 0 }}>
          <div style={{ width: `${loading * 100}%`, height: '100%', background: C.orange }} />
        </div>
      </div>

      <Phone top={660} delay={GENERATE_AT - 6}>
        <PopIn delay={BLOCK_TIMES[0]}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'linear-gradient(135deg,#ffb38a,#ff5701)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.white, fontSize: 48, fontWeight: 800 }}>
              A
            </div>
            <div>
              <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em' }}>Айгерим · nails</div>
              <div style={{ fontSize: 28, color: C.sage, fontWeight: 600 }}>lnkmx.my/aigerim.nails</div>
            </div>
          </div>
        </PopIn>
        <PopIn delay={BLOCK_TIMES[1]} style={{ marginTop: 28 }}>
          <div style={{ fontSize: 32, lineHeight: 1.35, color: '#3b4048', fontWeight: 500 }}>
            Маникюр и покрытие в центре Алматы. Стерильные инструменты, запись онлайн.
          </div>
        </PopIn>
        <PopIn delay={BLOCK_TIMES[2]} style={{ marginTop: 28 }}>
          <Card style={{ padding: 0 }}>
            {[
              ['Маникюр', '6 000 ₸'],
              ['Маникюр + гель', '9 000 ₸'],
              ['Наращивание', '14 000 ₸'],
            ].map(([name, price], i) => (
              <div key={name} style={{ display: 'flex', justifyContent: 'space-between', padding: '26px 28px', borderTop: i ? `2px solid ${C.paper}` : undefined, fontSize: 32, fontWeight: 600 }}>
                <span>{name}</span>
                <span style={{ fontWeight: 800 }}>{price}</span>
              </div>
            ))}
          </Card>
        </PopIn>
        <PopIn delay={BLOCK_TIMES[3]} style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Instagram', 'WhatsApp', 'Telegram'].map((s) => (
              <div key={s} style={{ flex: 1, textAlign: 'center', padding: '20px 0', borderRadius: 22, background: C.white, fontSize: 26, fontWeight: 700, boxShadow: '0 0 0 1.5px rgba(16,19,24,0.08)' }}>
                {s}
              </div>
            ))}
          </div>
        </PopIn>
        <PopIn delay={BLOCK_TIMES[4]} style={{ marginTop: 24 }}>
          <div style={{ padding: '30px 0', borderRadius: 26, background: C.ink, color: C.white, textAlign: 'center', fontSize: 36, fontWeight: 800 }}>
            Записаться онлайн
          </div>
        </PopIn>
      </Phone>
    </SceneFrame>
  );
};
