import type { ProfileFrameStyle } from '@/types/page';

// ============= Frame Categories & Tiers =============

export type NameAnimationType =
  | 'none'
  | 'typing'
  | 'wave'
  | 'bounce'
  | 'glow'
  | 'gradient'
  | 'shake'
  | 'pulse'
  | 'rainbow'
  | 'neon'
  | 'shine'
  | 'ticker'
  | 'underline-draw'
  | 'glitch'
  | 'rainbow-slow';

export interface FrameOption {
  value: ProfileFrameStyle;
  label: string;
  labelKey: string;
  emoji?: string;
  isPro: boolean;
  isAnimated: boolean;
  category: 'basic' | 'gradient' | 'neon' | 'animated' | 'special';
}

export interface NameAnimationOption {
  value: NameAnimationType;
  label: string;
  labelKey: string;
  isPro: boolean;
}

// 5 FREE frames (no animation)
export const FREE_FRAMES: ProfileFrameStyle[] = [
  'none',
  'default', 
  'solid',
  'double',
  'dashed',
];

// All PRO frames (including animated ones)
export const PRO_FRAMES: ProfileFrameStyle[] = [
  'dotted',
  'gradient',
  'gradient-sunset',
  'gradient-ocean',
  'gradient-purple',
  'neon-blue',
  'neon-pink',
  'neon-green',
  'rainbow',
  'rainbow-spin',
  'glow-pulse',
  'fire',
  'electric',
  'wave',
  'heartbeat',
  'sparkle',
  'glitch',
];

// Complete frame options list with metadata
export const FRAME_OPTIONS: FrameOption[] = [
  // Basic frames (FREE)
  { value: 'none', label: 'Без рамки', labelKey: 'frames.none', isPro: false, isAnimated: false, category: 'basic' },
  { value: 'default', label: 'По умолчанию', labelKey: 'frames.default', isPro: false, isAnimated: false, category: 'basic' },
  { value: 'solid', label: 'Сплошная', labelKey: 'frames.solid', isPro: false, isAnimated: false, category: 'basic' },
  { value: 'double', label: 'Двойная', labelKey: 'frames.double', isPro: false, isAnimated: false, category: 'basic' },
  { value: 'dashed', label: 'Штрих', labelKey: 'frames.dashed', isPro: false, isAnimated: false, category: 'basic' },
  
  // Basic frames (PRO)
  { value: 'dotted', label: 'Точки', labelKey: 'frames.dotted', isPro: true, isAnimated: false, category: 'basic' },
  
  // Gradient frames (PRO)
  { value: 'gradient', label: 'Градиент', labelKey: 'frames.gradient', isPro: true, isAnimated: false, category: 'gradient' },
  { value: 'gradient-sunset', label: 'Закат', labelKey: 'frames.gradientSunset', emoji: '🌅', isPro: true, isAnimated: false, category: 'gradient' },
  { value: 'gradient-ocean', label: 'Океан', labelKey: 'frames.gradientOcean', emoji: '🌊', isPro: true, isAnimated: false, category: 'gradient' },
  { value: 'gradient-purple', label: 'Фиолетовый', labelKey: 'frames.gradientPurple', emoji: '💜', isPro: true, isAnimated: false, category: 'gradient' },
  { value: 'rainbow', label: 'Радуга', labelKey: 'frames.rainbow', emoji: '🌈', isPro: true, isAnimated: false, category: 'gradient' },
  
  // Neon frames (PRO)
  { value: 'neon-blue', label: 'Неон синий', labelKey: 'frames.neonBlue', emoji: '💙', isPro: true, isAnimated: false, category: 'neon' },
  { value: 'neon-pink', label: 'Неон розовый', labelKey: 'frames.neonPink', emoji: '💖', isPro: true, isAnimated: false, category: 'neon' },
  { value: 'neon-green', label: 'Неон зелёный', labelKey: 'frames.neonGreen', emoji: '💚', isPro: true, isAnimated: false, category: 'neon' },
  
  // Animated frames (PRO)
  { value: 'rainbow-spin', label: 'Радуга вращение', labelKey: 'frames.rainbowSpin', emoji: '🔄', isPro: true, isAnimated: true, category: 'animated' },
  { value: 'glow-pulse', label: 'Пульсация', labelKey: 'frames.glowPulse', emoji: '✨', isPro: true, isAnimated: true, category: 'animated' },
  { value: 'fire', label: 'Огонь', labelKey: 'frames.fire', emoji: '🔥', isPro: true, isAnimated: true, category: 'special' },
  { value: 'electric', label: 'Электро', labelKey: 'frames.electric', emoji: '⚡', isPro: true, isAnimated: true, category: 'special' },
  { value: 'wave', label: 'Волна', labelKey: 'frames.wave', emoji: '🌊', isPro: true, isAnimated: true, category: 'special' },
  { value: 'heartbeat', label: 'Сердце', labelKey: 'frames.heartbeat', emoji: '💓', isPro: true, isAnimated: true, category: 'special' },
  { value: 'sparkle', label: 'Сияние', labelKey: 'frames.sparkle', emoji: '✨', isPro: true, isAnimated: true, category: 'special' },
  { value: 'glitch', label: 'Глитч', labelKey: 'frames.glitch', emoji: '👾', isPro: true, isAnimated: true, category: 'special' },
];

// Name animation options (all PRO except 'none')
export const NAME_ANIMATION_OPTIONS: NameAnimationOption[] = [
  { value: 'none', label: 'Без анимации', labelKey: 'nameAnimation.none', isPro: false },
  { value: 'typing', label: 'Печатная машинка', labelKey: 'nameAnimation.typing', isPro: true },
  { value: 'wave', label: 'Волна', labelKey: 'nameAnimation.wave', isPro: true },
  { value: 'bounce', label: 'Прыжки', labelKey: 'nameAnimation.bounce', isPro: true },
  { value: 'glow', label: 'Свечение', labelKey: 'nameAnimation.glow', isPro: true },
  { value: 'gradient', label: 'Градиент', labelKey: 'nameAnimation.gradient', isPro: true },
  { value: 'shake', label: 'Тряска', labelKey: 'nameAnimation.shake', isPro: true },
  { value: 'pulse', label: 'Пульсация', labelKey: 'nameAnimation.pulse', isPro: true },
  { value: 'rainbow', label: 'Радуга', labelKey: 'nameAnimation.rainbow', isPro: true },
  { value: 'neon', label: 'Неон', labelKey: 'nameAnimation.neon', isPro: true },
  { value: 'shine', label: 'Блик', labelKey: 'nameAnimation.shine', isPro: true },
  { value: 'ticker', label: 'Бегущая строка', labelKey: 'nameAnimation.ticker', isPro: true },
  { value: 'underline-draw', label: 'Подчёркивание', labelKey: 'nameAnimation.underlineDraw', isPro: true },
  { value: 'glitch', label: 'Глитч', labelKey: 'nameAnimation.glitch', isPro: true },
  { value: 'rainbow-slow', label: 'Радуга (плавно)', labelKey: 'nameAnimation.rainbowSlow', isPro: true },
];

// ============= Helper Functions =============

export function isFramePro(frame: ProfileFrameStyle): boolean {
  return PRO_FRAMES.includes(frame);
}

export function isFrameAnimated(frame: ProfileFrameStyle): boolean {
  const frameOption = FRAME_OPTIONS.find(f => f.value === frame);
  return frameOption?.isAnimated ?? false;
}

export function isNameAnimationPro(animation: NameAnimationType): boolean {
  return animation !== 'none';
}

export function getFramesByCategory(category: FrameOption['category']): FrameOption[] {
  return FRAME_OPTIONS.filter(f => f.category === category);
}

export function getFreeFrames(): FrameOption[] {
  return FRAME_OPTIONS.filter(f => !f.isPro);
}

export function getProFrames(): FrameOption[] {
  return FRAME_OPTIONS.filter(f => f.isPro);
}

// ============= CSS for Name Animations =============

export const NAME_ANIMATION_CSS = `
  @keyframes name-typing {
    from { width: 0; }
    to { width: 100%; }
  }
  
  @keyframes name-wave {
    0%, 100% { transform: translateY(0); }
    25% { transform: translateY(-3px); }
    75% { transform: translateY(3px); }
  }
  
  @keyframes name-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  
  @keyframes name-glow {
    0%, 100% { 
      text-shadow: 0 0 5px hsl(var(--primary) / 0.5), 0 0 10px hsl(var(--primary) / 0.3);
    }
    50% { 
      text-shadow: 0 0 20px hsl(var(--primary) / 0.8), 0 0 40px hsl(var(--primary) / 0.5), 0 0 60px hsl(var(--primary) / 0.3);
    }
  }
  
  @keyframes name-gradient {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  
  @keyframes name-shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
    20%, 40%, 60%, 80% { transform: translateX(2px); }
  }
  
  @keyframes name-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }
  
  @keyframes name-rainbow {
    0% { color: #ff0000; }
    16% { color: #ff8800; }
    33% { color: #ffff00; }
    50% { color: #00ff00; }
    66% { color: #0088ff; }
    83% { color: #8800ff; }
    100% { color: #ff0000; }
  }
  
  @keyframes name-neon {
    0%, 100% {
      text-shadow: 0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 20px #00ffff;
      color: #ffffff;
    }
    50% {
      text-shadow: 0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 40px #ff00ff;
      color: #ffffff;
    }
  }
  
  .name-animation-typing {
    overflow: hidden;
    white-space: nowrap;
    animation: name-typing 2s steps(20, end) forwards;
  }
  
  .name-animation-wave {
    display: inline-block;
    animation: name-wave 2s ease-in-out infinite;
  }
  
  .name-animation-bounce {
    display: inline-block;
    animation: name-bounce 1s ease-in-out infinite;
  }
  
  .name-animation-glow {
    animation: name-glow 2s ease-in-out infinite;
  }
  
  .name-animation-gradient {
    background: linear-gradient(90deg, hsl(var(--primary)), #ff6b6b, #feca57, #48dbfb, hsl(var(--primary)));
    background-size: 300% 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: name-gradient 4s ease infinite;
  }
  
  .name-animation-shake {
    display: inline-block;
    animation: name-shake 0.5s ease-in-out infinite;
  }
  
  .name-animation-pulse {
    display: inline-block;
    animation: name-pulse 1.5s ease-in-out infinite;
  }
  
  .name-animation-rainbow {
    animation: name-rainbow 3s linear infinite;
  }
  
  .name-animation-neon {
    animation: name-neon 2s ease-in-out infinite;
  }

  @keyframes name-shine {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .name-animation-shine {
    background: linear-gradient(90deg, currentColor 0%, currentColor 40%, #fff 50%, currentColor 60%, currentColor 100%);
    background-size: 200% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: name-shine 2.4s linear infinite;
  }

  @keyframes name-ticker {
    0% { transform: translateX(20%); }
    100% { transform: translateX(-100%); }
  }
  .name-animation-ticker {
    display: inline-block;
    white-space: nowrap;
    animation: name-ticker 8s linear infinite;
  }

  @keyframes name-underline-draw {
    0% { background-size: 0% 2px; }
    60%, 100% { background-size: 100% 2px; }
  }
  .name-animation-underline-draw {
    background-image: linear-gradient(hsl(var(--primary)), hsl(var(--primary)));
    background-repeat: no-repeat;
    background-position: 0 100%;
    background-size: 0% 2px;
    animation: name-underline-draw 1.6s ease-out infinite alternate;
    padding-bottom: 4px;
  }

  @keyframes name-glitch-a {
    0%,100% { transform: translate(0,0); }
    20% { transform: translate(-2px,1px); }
    40% { transform: translate(2px,-1px); }
    60% { transform: translate(-1px,-2px); }
    80% { transform: translate(1px,2px); }
  }
  .name-animation-glitch {
    position: relative;
    animation: name-glitch-a 0.9s steps(2, end) infinite;
    text-shadow: 1px 0 #ff00c8, -1px 0 #00e5ff;
  }

  .name-animation-rainbow-slow {
    animation: name-rainbow 12s linear infinite;
  }

  /* A4: respect reduced-motion — freeze all name animations */
  @media (prefers-reduced-motion: reduce) {
    [class*="name-animation-"] {
      animation: none !important;
      text-shadow: none !important;
    }
    .name-animation-underline-draw::after,
    .name-animation-glitch::before,
    .name-animation-glitch::after {
      animation: none !important;
      display: none !important;
    }
  }
`;

export function getNameAnimationClass(animation: NameAnimationType): string {
  if (animation === 'none') return '';
  return `name-animation-${animation}`;
}
