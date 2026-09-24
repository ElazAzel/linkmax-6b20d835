import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { Check, Glow, PopIn, SceneFrame, useSpring } from '../components/ui';
import { C, FONT } from '../theme';

export const URL_TYPE_START = 34;
export const URL_SLUG = 'ваше-имя';

export const Cta: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const logo = useSpring(0, { damping: 12, mass: 0.8 });
  const chars = Math.max(0, Math.min(URL_SLUG.length, Math.floor((frame - URL_TYPE_START) / 2.5)));
  const flash = interpolate(frame, [0, 6], [0.9, 0], { extrapolateRight: 'clamp' });
  // Пульс кнопки на каждую долю (15 кадров)
  const pulse = frame > 70 ? 1 + Math.max(0, 1 - ((frame - 70) % 15) / 6) * 0.05 : 1;

  return (
    <SceneFrame duration={duration} exit={false}>
      <AbsoluteFill style={{ background: C.paper, overflow: 'hidden' }}>
        <Glow y={520} size={1100} opacity={0.16} />
        <Glow x={200} y={1700} size={900} color={C.blue} opacity={0.1} />
      </AbsoluteFill>

      <AbsoluteFill style={{ alignItems: 'center', fontFamily: FONT, color: C.ink }}>
        <div style={{ marginTop: 360, transform: `scale(${logo})` }}>
          <Img src={staticFile('logo-full.png')} style={{ height: 380 }} />
        </div>

        <PopIn delay={10} style={{ marginTop: 70 }}>
          <div style={{ fontSize: 96, fontWeight: 800, letterSpacing: '-0.05em', lineHeight: 1.02, textAlign: 'center', padding: '0 70px' }}>
            Продавайте услуги <span style={{ color: C.orange }}>по одной ссылке</span>
          </div>
        </PopIn>

        <PopIn delay={24} style={{ marginTop: 70 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: 14,
              borderRadius: 36,
              background: C.white,
              boxShadow: '0 30px 80px -20px rgba(16,19,24,0.35), 0 0 0 2px rgba(16,19,24,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', height: 110, padding: '0 30px', borderRadius: 26, background: C.paper, fontSize: 44, fontWeight: 700, minWidth: 470 }}>
              <span style={{ color: C.sage }}>lnkmx.my/</span>
              <span>{URL_SLUG.slice(0, chars)}</span>
              {frame < 70 && Math.floor(frame / 8) % 2 === 0 && <span style={{ width: 4, height: 50, marginLeft: 4, background: C.orange }} />}
            </div>
            <div
              style={{
                height: 110,
                padding: '0 42px',
                borderRadius: 26,
                background: C.orange,
                color: C.white,
                display: 'flex',
                alignItems: 'center',
                fontSize: 42,
                fontWeight: 800,
                transform: `scale(${pulse})`,
                boxShadow: '0 16px 36px rgba(255,87,1,0.4)',
              }}
            >
              Начать
            </div>
          </div>
        </PopIn>

        <PopIn delay={44} style={{ marginTop: 50 }}>
          <div style={{ display: 'flex', gap: 36, fontSize: 34, fontWeight: 600, color: '#3b4048' }}>
            {['Бесплатный старт', 'Без кода', 'RU · KZ · EN'].map((t) => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
                <Check size={38} color={C.orange} />
                {t}
              </span>
            ))}
          </div>
        </PopIn>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: C.white, opacity: flash }} />
    </SceneFrame>
  );
};
