import React from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { DarkBg, SceneFrame, Sub, useSpring } from '../components/ui';
import { C, FONT } from '../theme';

export const Brand: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const badge = useSpring(0, { damping: 11, mass: 0.8 });
  const word = useSpring(8, { damping: 15 });
  const flash = interpolate(frame, [0, 6], [0.9, 0], { extrapolateRight: 'clamp' });
  const ring = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <SceneFrame duration={duration}>
      <DarkBg glowY={760} />
      <AbsoluteFill style={{ alignItems: 'center', fontFamily: FONT }}>
        <div
          style={{
            position: 'absolute',
            top: 760 - 300 * ring,
            width: 600 * ring,
            height: 600 * ring,
            borderRadius: '50%',
            border: `4px solid ${C.orange}`,
            opacity: 1 - ring,
          }}
        />
        <div
          style={{
            marginTop: 520,
            width: 260,
            height: 260,
            borderRadius: 72,
            background: C.paper,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transform: `scale(${badge}) rotate(${(1 - badge) * -20}deg)`,
            boxShadow: '0 30px 90px rgba(255,87,1,0.35)',
          }}
        >
          <Img src={staticFile('logo-icon.png')} style={{ height: 190 }} />
        </div>
        <div
          style={{
            marginTop: 56,
            fontSize: 150,
            fontWeight: 800,
            letterSpacing: '-0.06em',
            color: C.white,
            opacity: word,
            transform: `translateY(${(1 - word) * 40}px)`,
          }}
        >
          Link<span style={{ color: C.orange }}>MAX</span>
        </div>
      </AbsoluteFill>
      <Sub
        text="Одна ссылка, по которой клиент сам выбирает услугу, записывается и платит"
        top={1180}
        delay={18}
        align="center"
        size={46}
        color="rgba(255,255,255,0.82)"
      />
      <AbsoluteFill style={{ background: C.white, opacity: flash }} />
    </SceneFrame>
  );
};
