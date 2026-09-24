import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { C, FONT } from '../theme';

export function useSpring(delay = 0, config: Parameters<typeof spring>[0]['config'] = { damping: 14, mass: 0.7 }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
}

/** Плавный вход/выход сцены: общая обёртка, чтобы склейки выглядели одинаково. */
export const SceneFrame: React.FC<{ duration: number; children: React.ReactNode; exit?: boolean }> = ({
  duration,
  children,
  exit = true,
}) => {
  const frame = useCurrentFrame();
  const inP = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const outP = exit
    ? interpolate(frame, [duration - 8, duration], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) })
    : 0;
  return (
    <AbsoluteFill
      style={{
        opacity: inP * (1 - outP),
        transform: `translateY(${(1 - inP) * 60 - outP * 80}px) scale(${1 - outP * 0.04})`,
        filter: outP > 0 ? `blur(${outP * 12}px)` : undefined,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

export const Glow: React.FC<{ x?: number; y?: number; size?: number; color?: string; opacity?: number }> = ({
  x = 540,
  y = 500,
  size = 900,
  color = C.orange,
  opacity = 0.22,
}) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 40) * 40;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - size / 2 + drift,
        top: y - size / 2 - drift * 0.6,
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
        opacity,
      }}
    />
  );
};

export const DarkBg: React.FC<{ glowY?: number }> = ({ glowY = 420 }) => (
  <AbsoluteFill style={{ background: C.ink, overflow: 'hidden' }}>
    <Glow y={glowY} />
    <Glow x={900} y={1500} size={800} color={C.blue} opacity={0.18} />
    <AbsoluteFill
      style={{
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1.5px, transparent 1.5px)',
        backgroundSize: '36px 36px',
        maskImage: 'linear-gradient(to bottom, black 0%, transparent 70%)',
      }}
    />
  </AbsoluteFill>
);

/** Заголовок, слова которого вылетают по очереди. */
export const Headline: React.FC<{
  text: string;
  accent?: string;
  delay?: number;
  size?: number;
  color?: string;
  top?: number;
  align?: 'left' | 'center';
}> = ({ text, accent, delay = 0, size = 92, color = C.white, top = 230, align = 'left' }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(' ');
  const accentWords = new Set((accent ?? '').split(' ').filter(Boolean));
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 80,
        right: 80,
        fontFamily: FONT,
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1.02,
        letterSpacing: '-0.045em',
        color,
        textAlign: align,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        columnGap: size * 0.26,
      }}
    >
      {words.map((w, i) => {
        const p = spring({ frame: frame - delay - i * 3, fps, config: { damping: 16, mass: 0.6 } });
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: p,
              transform: `translateY(${(1 - p) * 50}px)`,
              color: accentWords.has(w) ? C.orange : undefined,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const Sub: React.FC<{ text: string; delay?: number; top: number; color?: string; align?: 'left' | 'center'; size?: number }> = ({
  text,
  delay = 8,
  top,
  color = 'rgba(255,255,255,0.72)',
  align = 'left',
  size = 40,
}) => {
  const p = useSpring(delay);
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 80,
        right: 80,
        fontFamily: FONT,
        fontWeight: 500,
        fontSize: size,
        lineHeight: 1.3,
        color,
        textAlign: align,
        opacity: p,
        transform: `translateY(${(1 - p) * 24}px)`,
      }}
    >
      {text}
    </div>
  );
};

export const PopIn: React.FC<{ delay: number; children: React.ReactNode; style?: React.CSSProperties; from?: 'up' | 'down' | 'scale' }> = ({
  delay,
  children,
  style,
  from = 'up',
}) => {
  const p = useSpring(delay, { damping: 13, mass: 0.6 });
  const t = from === 'scale' ? `scale(${0.6 + p * 0.4})` : `translateY(${(1 - p) * (from === 'up' ? 40 : -40)}px) scale(${0.94 + p * 0.06})`;
  return <div style={{ opacity: Math.min(1, p * 1.4), transform: t, ...style }}>{children}</div>;
};

/** Мокап телефона со «страницей LinkMAX» внутри. */
export const Phone: React.FC<{ top?: number; scale?: number; children: React.ReactNode; delay?: number }> = ({
  top = 700,
  scale = 1,
  children,
  delay = 0,
}) => {
  const p = useSpring(delay, { damping: 18, mass: 0.9 });
  const W = 660;
  const H = 1180;
  return (
    <div
      style={{
        position: 'absolute',
        left: 540 - W / 2,
        top,
        width: W,
        height: H,
        transform: `translateY(${(1 - p) * 400}px) scale(${scale})`,
        transformOrigin: 'top center',
        opacity: p,
        borderRadius: 78,
        background: '#05070a',
        padding: 16,
        boxShadow: '0 40px 120px rgba(0,0,0,0.55), 0 0 0 2px rgba(255,255,255,0.12)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: 64,
          background: C.paper,
          overflow: 'hidden',
          fontFamily: FONT,
          color: C.ink,
        }}
      >
        <div style={{ position: 'absolute', top: 18, left: '50%', width: 150, height: 40, marginLeft: -75, borderRadius: 20, background: '#05070a', zIndex: 5 }} />
        <div style={{ padding: '84px 36px 36px' }}>{children}</div>
      </div>
    </div>
  );
};

export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; dark?: boolean }> = ({ children, style, dark }) => (
  <div
    style={{
      background: dark ? C.ink : C.white,
      color: dark ? C.white : C.ink,
      borderRadius: 30,
      padding: 28,
      fontFamily: FONT,
      boxShadow: '0 10px 30px -14px rgba(16,19,24,0.25), 0 0 0 1.5px rgba(16,19,24,0.06)',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Pill: React.FC<{ children: React.ReactNode; bg?: string; color?: string; style?: React.CSSProperties }> = ({
  children,
  bg = C.orange,
  color = C.white,
  style,
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      borderRadius: 999,
      padding: '18px 34px',
      background: bg,
      color,
      fontFamily: FONT,
      fontWeight: 700,
      fontSize: 34,
      ...style,
    }}
  >
    {children}
  </div>
);

/** Иконка-галочка без эмодзи, чтобы не зависеть от шрифтов системы. */
export const Check: React.FC<{ size?: number; color?: string; stroke?: string }> = ({ size = 44, color = C.green, stroke = C.white }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="12" fill={color} />
    <path d="M6.5 12.5l3.5 3.5 7.5-8" fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Cursor: React.FC<{ x: number; y: number; pressed?: boolean }> = ({ x, y, pressed }) => (
  <div
    style={{
      position: 'absolute',
      left: x - 36,
      top: y - 36,
      width: 72,
      height: 72,
      borderRadius: '50%',
      background: 'rgba(16,19,24,0.18)',
      border: '4px solid rgba(255,255,255,0.9)',
      boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
      transform: `scale(${pressed ? 0.78 : 1})`,
      zIndex: 20,
    }}
  />
);

/** Маленький логотип в углу на продуктовых сценах. */
export const CornerLogo: React.FC = () => (
  <div style={{ position: 'absolute', top: 110, left: 80, display: 'flex', alignItems: 'center', gap: 16, fontFamily: FONT }}>
    <div style={{ width: 56, height: 56, borderRadius: 16, background: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Img src={staticFile('logo-icon.png')} style={{ height: 40 }} />
    </div>
    <div style={{ color: C.white, fontWeight: 700, fontSize: 32, letterSpacing: '-0.02em' }}>LinkMAX</div>
  </div>
);
