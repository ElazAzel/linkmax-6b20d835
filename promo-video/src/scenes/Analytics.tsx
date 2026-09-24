import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { CornerLogo, DarkBg, Headline, SceneFrame, Sub, useSpring } from '../components/ui';
import { C, FONT } from '../theme';

// Иллюстрация без конкретных цифр: показываем механику, а не выдуманные метрики.
const sources = [
  { name: 'Instagram', value: 0.92 },
  { name: 'TikTok', value: 0.64 },
  { name: 'WhatsApp', value: 0.48 },
  { name: '2GIS', value: 0.3 },
];

const Bar: React.FC<{ name: string; value: number; delay: number; top: number }> = ({ name, value, delay, top }) => {
  const p = useSpring(delay, { damping: 18, mass: 0.9 });
  return (
    <div style={{ position: 'absolute', left: 80, right: 80, top, fontFamily: FONT }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', color: C.white, fontSize: 34, fontWeight: 700, marginBottom: 14 }}>
        <span>{name}</span>
        <span style={{ opacity: 0.55, fontWeight: 600 }}>{p > 0.9 && value > 0.9 ? 'топ-источник' : ''}</span>
      </div>
      <div style={{ height: 40, borderRadius: 20, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div
          style={{
            width: `${value * p * 100}%`,
            height: '100%',
            borderRadius: 20,
            background: value > 0.9 ? C.orange : 'rgba(255,255,255,0.55)',
          }}
        />
      </div>
    </div>
  );
};

const valueAt = (pts: number[], p: number) => {
  const x = p * (pts.length - 1);
  const i = Math.min(pts.length - 2, Math.floor(x));
  return pts[i] + (pts[i + 1] - pts[i]) * (x - i);
};

export const Analytics: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const line = interpolate(frame, [10, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pts = [0.18, 0.26, 0.22, 0.38, 0.44, 0.41, 0.58, 0.66, 0.74, 0.9];
  const W = 920;
  const H = 300;
  const path = pts.map((v, i) => `${i ? 'L' : 'M'}${(i / (pts.length - 1)) * W},${H - v * H}`).join(' ');

  return (
    <SceneFrame duration={duration}>
      <DarkBg glowY={1200} />
      <CornerLogo />
      <Headline text="Видно, откуда приходят клиенты" accent="клиенты" top={230} size={88} />
      <Sub text="Просмотры, клики и заявки по каждому источнику" top={450} />

      <svg width={W} height={H + 40} style={{ position: 'absolute', left: 80, top: 600, overflow: 'visible' }}>
        <defs>
          <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={C.orange} stopOpacity={0.35} />
            <stop offset="100%" stopColor={C.orange} stopOpacity={0} />
          </linearGradient>
          <clipPath id="reveal">
            <rect x={0} y={-40} width={W * line} height={H + 80} />
          </clipPath>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={0} x2={W} y1={H * g} y2={H * g} stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
        ))}
        <g clipPath="url(#reveal)">
          <path d={`${path} L${W},${H} L0,${H} Z`} fill="url(#fill)" />
          <path d={path} fill="none" stroke={C.orange} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <circle cx={W * line} cy={H - valueAt(pts, line) * H} r={line > 0 ? 14 : 0} fill={C.white} />
      </svg>

      {sources.map((s, i) => (
        <Bar key={s.name} {...s} delay={24 + i * 6} top={1030 + i * 130} />
      ))}
    </SceneFrame>
  );
};
