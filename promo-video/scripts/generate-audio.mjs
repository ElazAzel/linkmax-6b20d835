// Генерирует саундтрек и SFX для промо-ролика без сторонних сэмплов:
// всё синтезируется кодом, поэтому с лицензиями проблем нет.
// Запуск: npm run audio  → public/audio/*.wav
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 44100;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'audio');
mkdirSync(OUT, { recursive: true });

// Детерминированный шум, чтобы трек не менялся от запуска к запуску.
let seed = 1337;
const rand = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const noise = () => rand() * 2 - 1;
const midiHz = (m) => 440 * 2 ** ((m - 69) / 12);

class Biquad {
  constructor(type, freq, q = 0.707) {
    this.type = type;
    this.q = q;
    this.x1 = this.x2 = this.y1 = this.y2 = 0;
    this.set(freq);
  }
  set(freq) {
    const w = (2 * Math.PI * Math.min(freq, SR * 0.45)) / SR;
    const cos = Math.cos(w);
    const alpha = Math.sin(w) / (2 * this.q);
    let b0, b1, b2;
    if (this.type === 'lp') {
      b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = (1 - cos) / 2;
    } else if (this.type === 'hp') {
      b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = (1 + cos) / 2;
    } else {
      b0 = alpha; b1 = 0; b2 = -alpha;
    }
    const a0 = 1 + alpha;
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0;
    this.a1 = (-2 * cos) / a0; this.a2 = (1 - alpha) / a0;
  }
  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}

const saw = (phase) => 2 * (phase - Math.floor(phase + 0.5));

function writeWav(name, left, right = left) {
  const n = left.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, left[i])) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, right[i])) * 32767), 46 + i * 4);
  }
  writeFileSync(join(OUT, name), buf);
  console.log(`✓ ${name} (${(n / SR).toFixed(2)}s)`);
}

function normalize(l, r, peakDb = -1) {
  let peak = 0;
  for (let i = 0; i < l.length; i++) peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]));
  const g = 10 ** (peakDb / 20) / (peak || 1);
  for (let i = 0; i < l.length; i++) { l[i] *= g; r[i] *= g; }
}

// ───────────────────────────── Музыка ─────────────────────────────
// 120 BPM: доля = 0.5 c = 15 кадров при 30 fps, такт = 2 c = 60 кадров.
// Сцены ролика нарезаны по этой сетке, поэтому склейки попадают в бит.
const DURATION = 36;
const N = DURATION * SR;
const L = new Float32Array(N);
const R = new Float32Array(N);
const BEAT = 0.5;

const add = (buf, t, i, v) => { const k = Math.floor(t * SR) + i; if (k >= 0 && k < N) buf[k] += v; };
const addStereo = (t, i, v, pan = 0) => { add(L, t, i, v * (1 - pan) ); add(R, t, i, v * (1 + pan)); };

const CHORDS = {
  C: { bass: 36, pad: [60, 64, 67, 72] },
  G: { bass: 43, pad: [59, 62, 67, 71] },
  Am: { bass: 45, pad: [57, 60, 64, 69] },
  F: { bass: 41, pad: [57, 60, 65, 69] },
};

// [начало, длительность, аккорд]
const progression = [
  [0, 2, 'Am'], [2, 2, 'G'],
  ...Array.from({ length: 12 }, (_, i) => [4 + i * 2, 2, ['C', 'G', 'Am', 'F'][i % 4]]),
  [28, 2, 'G'],
  [30, 2, 'C'], [32, 1, 'F'], [33, 1, 'G'], [34, 2, 'C'],
];

// Где играет грув (кик/бас/хэты)
const grooveOn = (t) => (t >= 4 && t < 28) || (t >= 30 && t < 34);
const kickTimes = [];
for (let t = 0; t < DURATION; t += BEAT) {
  if (grooveOn(t)) kickTimes.push(t);
  else if (t >= 1 && t < 4) kickTimes.push(t); // «сердцебиение» в хуке
}
kickTimes.push(34);

function sidechain(t) {
  let g = 1;
  for (const k of kickTimes) {
    if (k <= t && t - k < 0.3) g = Math.min(g, 1 - 0.65 * Math.exp(-(t - k) / 0.09));
  }
  return g;
}

function kick(t0, amp) {
  const len = 0.45 * SR;
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const f = 45 + 110 * Math.exp(-t / 0.035);
    phase += f / SR;
    const env = Math.exp(-t / 0.16);
    const click = i < 90 ? noise() * 0.25 * (1 - i / 90) : 0;
    addStereo(t0, i, amp * (Math.sin(2 * Math.PI * phase) * env + click));
  }
}

function clap(t0, amp) {
  const bp = new Biquad('bp', 1400, 1.2);
  const len = 0.25 * SR;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const burst = [0, 0.011, 0.022].reduce((s, o) => s + (t >= o ? Math.exp(-(t - o) / 0.006) : 0), 0);
    const env = burst * 0.5 + Math.exp(-t / 0.11) * 0.7;
    addStereo(t0, i, amp * bp.run(noise()) * env * 2.2);
  }
}

function hat(t0, amp, decay, pan) {
  const hp = new Biquad('hp', 8000, 0.9);
  const len = decay * 6 * SR;
  for (let i = 0; i < len; i++) addStereo(t0, i, amp * hp.run(noise()) * Math.exp(-i / SR / decay), pan);
}

function tick(t0, amp) {
  const len = 0.03 * SR;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    addStereo(t0, i, amp * Math.sin(2 * Math.PI * 2600 * t) * Math.exp(-t / 0.006));
  }
}

function pad(t0, dur, notes, amp, cutoff) {
  const detune = [-0.12, 0, 0.12];
  for (const [vi, m] of notes.entries()) {
    for (const [di, d] of detune.entries()) {
      const f = midiHz(m + d);
      const lp = new Biquad('lp', cutoff, 0.8);
      const pan = (di - 1) * 0.6;
      const len = (dur + 0.4) * SR;
      const ph = rand();
      for (let i = 0; i < len; i++) {
        const t = i / SR;
        const env = Math.min(1, t / 0.25) * (t > dur ? Math.exp(-(t - dur) / 0.12) : 1);
        const v = lp.run(saw(f * t + ph)) * env * amp * sidechain(t0 + t) / (notes.length * 1.6);
        addStereo(t0, i, v, pan * (vi % 2 ? 1 : -1));
      }
    }
  }
}

function pluck(t0, midi, amp, pan) {
  const lp = new Biquad('lp', 3200, 1.4);
  const len = 0.35 * SR;
  const f = midiHz(midi);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    lp.set(600 + 3600 * Math.exp(-t / 0.05));
    const sq = Math.sin(2 * Math.PI * f * t) > 0 ? 1 : -1;
    addStereo(t0, i, amp * lp.run(sq * 0.6 + saw(f * 1.003 * t) * 0.4) * Math.exp(-t / 0.11), pan);
  }
}

function riser(t0, dur, amp) {
  const bp = new Biquad('bp', 300, 2.5);
  const len = dur * SR;
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const p = i / len;
    bp.set(300 + 7000 * p * p);
    phase += (200 + 900 * p * p) / SR;
    const v = bp.run(noise()) * 1.4 + Math.sin(2 * Math.PI * phase) * 0.12;
    addStereo(t0, i, amp * v * p * p);
  }
}

function impact(t0, amp) {
  const lp = new Biquad('lp', 5000, 0.7);
  const len = 2.2 * SR;
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    phase += (38 + 60 * Math.exp(-t / 0.08)) / SR;
    const boom = Math.sin(2 * Math.PI * phase) * Math.exp(-t / 0.7);
    const crash = lp.run(noise()) * Math.exp(-t / 0.55) * 0.35;
    addStereo(t0, i, amp * (boom + crash));
  }
}

// Бас пишем в отдельный буфер и копируем в оба канала
const bassBuf = new Float32Array(N);
function bassLine(t0, dur, midi, amp) {
  const lp = new Biquad('lp', 420, 1.1);
  const len = Math.floor(dur * SR);
  const f = midiHz(midi);
  const start = Math.floor(t0 * SR);
  for (let i = 0; i < len && start + i < N; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.005) * Math.exp(-t / 0.3) * Math.min(1, (len - i) / 300);
    const v = saw(f * t) * 0.7 + Math.sin(2 * Math.PI * f * t) * 0.6;
    bassBuf[start + i] += amp * lp.run(v) * env * sidechain(t0 + t);
  }
}

// ── Аранжировка ──
for (const [start, dur, name] of progression) {
  const c = CHORDS[name];
  const isHook = start < 4;
  const isBreak = start >= 28 && start < 30;
  const isFinal = start >= 34;
  pad(start, isFinal ? 1.6 : dur, c.pad, isHook ? 0.55 : 0.42, isHook ? 700 : isBreak ? 1400 : 2600);

  if (grooveOn(start) || isFinal) {
    for (let t = start; t < start + (isFinal ? 0.5 : dur) - 1e-6; t += BEAT / 2) {
      const offbeat = Math.round((t - start) / (BEAT / 2)) % 2 === 1;
      bassLine(t, BEAT / 2 - 0.01, c.bass + (offbeat ? 12 : 0), 0.34);
    }
  }
  // Арпеджио с 8-й секунды
  if ((start >= 8 && start < 28) || (start >= 30 && start < 34)) {
    const tones = [...c.pad, c.pad[1] + 12, c.pad[2] + 12];
    const pattern = [0, 2, 4, 5, 3, 1, 4, 2];
    for (let s = 0; s < dur / (BEAT / 2); s++) {
      pluck(start + s * (BEAT / 2), tones[pattern[s % pattern.length]], 0.11, s % 2 ? 0.35 : -0.35);
    }
  }
}

for (const k of kickTimes) kick(k, k < 4 ? 0.32 : 0.8);

for (let t = 4; t < DURATION; t += BEAT) {
  if (!grooveOn(t)) continue;
  const beatIdx = Math.round(t / BEAT);
  if (beatIdx % 2 === 1) clap(t, 0.32);
  hat(t + BEAT / 2, 0.16, 0.05, 0.25);
  hat(t + BEAT / 4, 0.06, 0.02, -0.3);
  hat(t + (3 * BEAT) / 4, 0.06, 0.02, -0.3);
}

// Хук: «тиканье часов» — клиент ждёт ответа
for (let t = 0; t < 4; t += BEAT / 2) tick(t, 0.12);
// В брейкдауне — вместо кика нарастающие хлопки
for (let i = 0; i < 8; i++) clap(28 + i * 0.25, 0.1 + i * 0.03);

riser(2, 2, 0.35);
riser(28, 2, 0.4);
impact(4, 0.7);
impact(30, 0.7);
impact(34, 0.55);

for (let i = 0; i < N; i++) { L[i] += bassBuf[i]; R[i] += bassBuf[i]; }

// Мастер: мягкий клиппер, фейды
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const fade = Math.min(1, t / 0.02) * (t > DURATION - 1.2 ? Math.max(0, (DURATION - t) / 1.2) : 1);
  L[i] = Math.tanh(L[i] * 1.2) * fade;
  R[i] = Math.tanh(R[i] * 1.2) * fade;
}
normalize(L, R, -1.5);
writeWav('music.wav', L, R);

// ───────────────────────────── SFX ─────────────────────────────
function render(dur, fn) {
  const n = Math.floor(dur * SR);
  const l = new Float32Array(n);
  const r = new Float32Array(n);
  fn(n, l, r);
  normalize(l, r, -3);
  return [l, r];
}

writeWav('whoosh.wav', ...render(0.6, (n, l, r) => {
  const bp = new Biquad('bp', 400, 1.5);
  for (let i = 0; i < n; i++) {
    const p = i / n;
    bp.set(400 + 5000 * Math.sin(Math.PI * p));
    const env = Math.sin(Math.PI * p) ** 2;
    const v = bp.run(noise()) * env;
    l[i] = v * (1 - p); r[i] = v * p + v * 0.3;
  }
}));

writeWav('pop.wav', ...render(0.18, (n, l, r) => {
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    phase += (320 + 900 * Math.exp(-t / 0.02)) / SR;
    l[i] = r[i] = Math.sin(2 * Math.PI * phase) * Math.exp(-t / 0.045);
  }
}));

writeWav('click.wav', ...render(0.05, (n, l, r) => {
  const hp = new Biquad('hp', 2500, 0.7);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    l[i] = r[i] = (hp.run(noise()) * 0.6 + Math.sin(2 * Math.PI * 1800 * t) * 0.5) * Math.exp(-t / 0.008);
  }
}));

writeWav('ding.wav', ...render(1.2, (n, l, r) => {
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const v = [[1568, 1, 0.5], [2349, 0.5, 0.35], [3136, 0.25, 0.2]]
      .reduce((s, [f, a, d]) => s + Math.sin(2 * Math.PI * f * t) * a * Math.exp(-t / d), 0);
    l[i] = r[i] = v * Math.min(1, t / 0.002);
  }
}));

writeWav('success.wav', ...render(1.0, (n, l, r) => {
  const notes = [[0, 76], [0.09, 81], [0.18, 88]];
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let v = 0;
    for (const [o, m] of notes) {
      if (t < o) continue;
      const tt = t - o;
      const f = midiHz(m);
      v += (Math.sin(2 * Math.PI * f * tt) + Math.sin(4 * Math.PI * f * tt) * 0.2) * Math.exp(-tt / 0.3) * Math.min(1, tt / 0.003);
    }
    l[i] = r[i] = v;
  }
}));

writeWav('cash.wav', ...render(0.9, (n, l, r) => {
  const hp = new Biquad('hp', 5000, 0.8);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const bell = [2637, 3951, 5274].reduce((s, f, k) => s + Math.sin(2 * Math.PI * f * t) * Math.exp(-t / (0.35 - k * 0.08)), 0);
    const rattle = t < 0.12 ? hp.run(noise()) * (1 - t / 0.12) * 0.6 : 0;
    l[i] = r[i] = bell * 0.5 + rattle;
  }
}));
