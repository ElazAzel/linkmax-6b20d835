import React from 'react';
import { useCurrentFrame } from 'remotion';
import { DarkBg, Headline, SceneFrame, useSpring } from '../components/ui';
import { C, FONT } from '../theme';

export const NICHES = [
  'Бьюти-мастера',
  'Репетиторы',
  'Психологи',
  'Фитнес-тренеры',
  'Фотографы',
  'Консультанты',
  'Барберы',
  'Ивенты',
  'Онлайн-школы',
  'Локальный сервис',
];
// Чипы появляются всё чаще — в такт хлопкам брейкдауна
export const NICHE_TIMES = NICHES.map((_, i) => Math.round(18 + i * 6.5));

const Chip: React.FC<{ label: string; at: number; accent: boolean }> = ({ label, at, accent }) => {
  const p = useSpring(at, { damping: 11, mass: 0.6 });
  return (
    <div
      style={{
        padding: '26px 40px',
        borderRadius: 999,
        fontFamily: FONT,
        fontSize: 44,
        fontWeight: 700,
        color: accent ? C.white : C.ink,
        background: accent ? C.orange : C.paper,
        opacity: Math.min(1, p * 1.5),
        transform: `scale(${0.5 + p * 0.5}) rotate(${(1 - p) * (accent ? 8 : -8)}deg)`,
      }}
    >
      {label}
    </div>
  );
};

export const Niches: React.FC<{ duration: number }> = ({ duration }) => {
  const frame = useCurrentFrame();
  const zoom = 1 + Math.max(0, frame - 60) * 0.004;
  return (
    <SceneFrame duration={duration}>
      <DarkBg glowY={1100} />
      <Headline text="Для всех, кто продаёт услуги" accent="услуги" top={260} size={96} align="center" />
      <div
        style={{
          position: 'absolute',
          top: 700,
          left: 60,
          right: 60,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 24,
          transform: `scale(${zoom})`,
        }}
      >
        {NICHES.map((n, i) => (
          <Chip key={n} label={n} at={NICHE_TIMES[i]} accent={i % 3 === 0} />
        ))}
      </div>
    </SceneFrame>
  );
};
