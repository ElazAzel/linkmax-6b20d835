import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { AiBuilder, BLOCK_TIMES, GENERATE_AT, PROMPT, TYPE_SPEED, TYPE_START } from './scenes/AiBuilder';
import { Analytics } from './scenes/Analytics';
import { BOOKED_AT, Booking, CONFIRM_TAP, DAY_TAP, SLOT_TAP } from './scenes/Booking';
import { Brand } from './scenes/Brand';
import { Crm, MOVE_AT, NOTIFY_TIMES } from './scenes/Crm';
import { Cta, URL_SLUG, URL_TYPE_START } from './scenes/Cta';
import { HOOK_BUBBLES, Hook } from './scenes/Hook';
import { NICHE_TIMES, Niches } from './scenes/Niches';
import { METHOD_TAP, PAID_AT, PAY_TAP, Payment } from './scenes/Payment';
import { C, loadFonts } from './theme';

loadFonts();

// Сетка сцен привязана к музыке: 120 BPM, такт = 60 кадров.
// Удары (impact) в music.wav стоят на 4 c (кадр 120), 30 c (900) и 34 c (1020).
export const SCENES = [
  { id: 'hook', from: 0, duration: 120, Comp: Hook },
  { id: 'brand', from: 120, duration: 90, Comp: Brand },
  { id: 'ai', from: 210, duration: 150, Comp: AiBuilder },
  { id: 'booking', from: 360, duration: 120, Comp: Booking },
  { id: 'payment', from: 480, duration: 120, Comp: Payment },
  { id: 'crm', from: 600, duration: 120, Comp: Crm },
  { id: 'analytics', from: 720, duration: 90, Comp: Analytics },
  { id: 'niches', from: 810, duration: 90, Comp: Niches },
  { id: 'cta', from: 900, duration: 180, Comp: Cta },
] as const;

export const TOTAL_FRAMES = 1080;

type Sfx = { at: number; file: string; volume: number };

const sceneStart = (id: (typeof SCENES)[number]['id']) => SCENES.find((s) => s.id === id)!.from;

function buildSfx(): Sfx[] {
  const list: Sfx[] = [];
  const push = (at: number, file: string, volume: number) => list.push({ at, file, volume });

  HOOK_BUBBLES.forEach((b, i) => push(b.at, 'pop', i === HOOK_BUBBLES.length - 1 ? 0.5 : 0.35));

  // Свуши на склейках без удара в музыке
  for (const id of ['ai', 'booking', 'payment', 'crm', 'analytics', 'niches'] as const) push(sceneStart(id) - 4, 'whoosh', 0.3);

  const ai = sceneStart('ai');
  for (let i = 0; i < PROMPT.length; i += 2) push(ai + TYPE_START + Math.round(i * TYPE_SPEED), 'click', 0.2);
  push(ai + GENERATE_AT, 'click', 0.45);
  BLOCK_TIMES.forEach((t) => push(ai + t, 'pop', 0.3));

  const booking = sceneStart('booking');
  [DAY_TAP, SLOT_TAP, CONFIRM_TAP].forEach((t) => push(booking + t, 'click', 0.45));
  push(booking + BOOKED_AT, 'success', 0.5);

  const pay = sceneStart('payment');
  [METHOD_TAP, PAY_TAP].forEach((t) => push(pay + t, 'click', 0.45));
  push(pay + PAID_AT, 'cash', 0.45);

  const crm = sceneStart('crm');
  NOTIFY_TIMES.forEach((t) => push(crm + t, 'ding', 0.35));
  push(crm + MOVE_AT, 'whoosh', 0.2);

  const analytics = sceneStart('analytics');
  push(analytics + 24, 'pop', 0.2);

  const niches = sceneStart('niches');
  NICHE_TIMES.forEach((t) => push(niches + t, 'pop', 0.22));

  const cta = sceneStart('cta');
  for (let i = 0; i < URL_SLUG.length; i++) push(cta + URL_TYPE_START + Math.round(i * 2.5), 'click', 0.18);

  return list;
}

const SFX = buildSfx();

export const Promo: React.FC = () => (
  <AbsoluteFill style={{ background: C.ink }}>
    {SCENES.map(({ id, from, duration, Comp }) => (
      <Sequence key={id} from={from} durationInFrames={duration} name={id}>
        <Comp duration={duration} />
      </Sequence>
    ))}

    <Audio src={staticFile('audio/music.wav')} volume={0.85} />
    {SFX.map((s, i) => (
      <Sequence key={i} from={s.at} durationInFrames={45} name={`sfx-${s.file}`} layout="none">
        <Audio src={staticFile(`audio/${s.file}.wav`)} volume={s.volume} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
