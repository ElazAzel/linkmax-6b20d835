import type { BlockStyle } from '@/types/page';

export function getAnimationClass(style?: BlockStyle): string {
  if (!style?.animation || style.animation === 'none') {
    return '';
  }

  const animationMap: Record<string, string> = {
    'fade-in': 'animate-fade-in',
    'slide-up': 'animate-slide-up',
    'scale-in': 'animate-scale-in',
    'bounce': 'animate-bounce',
  };

  const baseAnimation = animationMap[style.animation] || '';
  
  // Speed variants
  const speedMap: Record<string, string> = {
    'slow': '[animation-duration:0.8s]',
    'normal': '[animation-duration:0.5s]',
    'fast': '[animation-duration:0.3s]',
  };

  const speed = style.animationSpeed ? speedMap[style.animationSpeed] : '';

  return `${baseAnimation} ${speed}`.trim();
}

export function getAnimationStyle(style?: BlockStyle): React.CSSProperties {
  if (!style?.animationDelay) {
    return {};
  }

  return {
    animationDelay: `${style.animationDelay}ms`,
  };
}
