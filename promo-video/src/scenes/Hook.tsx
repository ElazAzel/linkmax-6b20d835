import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { DarkBg, Headline, PopIn, SceneFrame } from '../components/ui';
import { C, FONT } from '../theme';

export const HOOK_BUBBLES = [
  { at: 12, text: 'Здравствуйте! Сколько стоит?', time: '10:42' },
  { at: 30, text: 'А на субботу есть время?', time: '10:58' },
  { at: 48, text: 'Куда можно оплатить?', time: '11:31' },
  { at: 64, text: 'Вы тут?', time: '13:05' },
  { at: 78, text: 'Ладно, найду другого мастера', time: '15:20' },
];

export const Hook: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const unread = HOOK_BUBBLES.filter((b) => frame >= b.at).length;
  const shake = frame > 78 && frame < 92 ? Math.sin(frame * 2.2) * 6 : 0;
  // К концу сцены переписка «рассыпается»
  const fall = interpolate(frame, [96, 118], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <SceneFrame duration={duration}>
      <DarkBg glowY={1300} />
      <Headline text="Клиенты пишут в директ…" top={210} size={96} />
      <Headline text="и уходят без ответа" accent="уходят" top={420} size={96} delay={56} />

      <AbsoluteFill style={{ top: 640, left: 80, right: 80, fontFamily: FONT }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            marginBottom: 36,
            color: 'rgba(255,255,255,0.8)',
            fontSize: 34,
            fontWeight: 600,
          }}
        >
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#ff8a3d,#c2185b)' }} />
          <div>Direct · 5 чатов</div>
          <div
            style={{
              marginLeft: 'auto',
              minWidth: 64,
              height: 64,
              borderRadius: 32,
              background: C.orange,
              color: C.white,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: 34,
              padding: '0 18px',
              transform: `scale(${1 + (frame % 18 < 4 && unread ? 0.12 : 0)})`,
            }}
          >
            {unread}
          </div>
        </div>
        {HOOK_BUBBLES.map((b, i) => (
          <div
            key={b.at}
            style={{
              transform: `translate(${shake}px, ${fall * (300 + i * 140)}px) rotate(${fall * (i % 2 ? 8 : -6)}deg)`,
              opacity: 1 - fall,
            }}
          >
            <PopIn delay={b.at} style={{ marginBottom: 22 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'flex-end',
                  gap: 18,
                  maxWidth: 800,
                  padding: '26px 32px',
                  borderRadius: '36px 36px 36px 10px',
                  background: i === HOOK_BUBBLES.length - 1 ? 'rgba(255,87,1,0.18)' : 'rgba(255,255,255,0.1)',
                  border: `2px solid ${i === HOOK_BUBBLES.length - 1 ? 'rgba(255,87,1,0.6)' : 'rgba(255,255,255,0.1)'}`,
                  color: C.white,
                  fontSize: 42,
                  fontWeight: 500,
                  lineHeight: 1.25,
                }}
              >
                <span>{b.text}</span>
                <span style={{ fontSize: 26, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>{b.time}</span>
              </div>
            </PopIn>
          </div>
        ))}
      </AbsoluteFill>
    </SceneFrame>
  );
};
