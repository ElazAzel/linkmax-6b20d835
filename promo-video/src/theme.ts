import { continueRender, delayRender, staticFile } from 'remotion';

// Цвета из дизайн-системы lnkmx.my (src/index.css, HeroBentoOS)
export const C = {
  ink: '#101318',
  ink2: '#1a1e25',
  paper: '#f6f6f1',
  line: '#d9d7cc',
  sage: '#6f746d',
  orange: '#ff5701',
  orangeSoft: '#ffe3d3',
  blue: '#253e8f',
  green: '#1f9d55',
  white: '#ffffff',
};

export const FONT = 'Inter, system-ui, sans-serif';

export const FPS = 30;
// 120 BPM → доля = 15 кадров, такт = 60 кадров
export const BEAT = 15;

const weights = [500, 600, 700, 800] as const;
const subsets = ['latin', 'cyrillic'] as const;

let fontsRequested = false;
export function loadFonts() {
  if (fontsRequested || typeof document === 'undefined') return;
  fontsRequested = true;
  const handle = delayRender('Loading Inter');
  const faces = weights.flatMap((w) =>
    subsets.map((s) => {
      const face = new FontFace('Inter', `url(${staticFile(`fonts/inter-${s}-${w}-normal.woff2`)}) format('woff2')`, {
        weight: String(w),
        unicodeRange:
          s === 'cyrillic'
            ? 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116'
            : 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+20AC, U+20B8, U+2122, U+2191-2193, U+2212, U+2215, U+FEFF, U+FFFD',
      });
      document.fonts.add(face);
      return face.load();
    }),
  );
  Promise.all(faces)
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
}
