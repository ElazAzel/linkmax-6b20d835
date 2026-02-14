import type { ProfileFrameStyle, AvatarFrameStyle } from '@/types/page';

export type FrameStyle = ProfileFrameStyle | AvatarFrameStyle;

export const getFrameStyles = (frameStyle: FrameStyle = 'default'): React.CSSProperties => {
  const styles: Record<FrameStyle, React.CSSProperties> = {
    default: {
      border: '2px solid hsl(var(--primary))',
    },
    none: {},
    solid: {
      border: '3px solid hsl(var(--primary))',
    },
    gradient: {
      background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.5))',
      padding: '3px',
    },
    'gradient-sunset': {
      background: 'linear-gradient(135deg, #ff6b6b, #feca57, #ff9ff3)',
      padding: '3px',
    },
    'gradient-ocean': {
      background: 'linear-gradient(135deg, #0abde3, #10ac84, #48dbfb)',
      padding: '3px',
    },
    'gradient-purple': {
      background: 'linear-gradient(135deg, #a55eea, #5f27cd, #c44dff)',
      padding: '3px',
    },
    'neon-blue': {
      border: '2px solid #00d4ff',
      boxShadow: '0 0 10px #00d4ff, 0 0 20px #00d4ff, 0 0 30px #00d4ff, inset 0 0 10px rgba(0,212,255,0.1)',
    },
    'neon-pink': {
      border: '2px solid #ff00ff',
      boxShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff, 0 0 30px #ff00ff, inset 0 0 10px rgba(255,0,255,0.1)',
    },
    'neon-green': {
      border: '2px solid #00ff88',
      boxShadow: '0 0 10px #00ff88, 0 0 20px #00ff88, 0 0 30px #00ff88, inset 0 0 10px rgba(0,255,136,0.1)',
    },
    rainbow: {
      background: 'conic-gradient(from 0deg, #ff0000, #ff8800, #ffff00, #00ff00, #00ffff, #0088ff, #8800ff, #ff00ff, #ff0000)',
      padding: '3px',
    },
    'rainbow-spin': {
      background: 'conic-gradient(from 0deg, #ff0000, #ff8800, #ffff00, #00ff00, #00ffff, #0088ff, #8800ff, #ff00ff, #ff0000)',
      padding: '3px',
      animation: 'spin 3s linear infinite',
    },
    double: {
      border: '3px double hsl(var(--primary))',
      padding: '2px',
    },
    dashed: {
      border: '3px dashed hsl(var(--primary))',
    },
    dotted: {
      border: '3px dotted hsl(var(--primary))',
    },
    'glow-pulse': {
      border: '2px solid hsl(var(--primary))',
      animation: 'glow-pulse 2s ease-in-out infinite',
    },
  };
  return styles[frameStyle] || styles.default;
};

export const getShadowStyles = (shadow: string = 'none'): React.CSSProperties => {
  const shadowStyles: Record<string, React.CSSProperties> = {
    none: {},
    soft: { boxShadow: '0 4px 14px -3px hsl(var(--primary) / 0.25)' },
    medium: { boxShadow: '0 8px 24px -4px hsl(var(--primary) / 0.35)' },
    strong: { boxShadow: '0 12px 32px -4px hsl(var(--primary) / 0.45)' },
    glow: { boxShadow: '0 0 30px hsl(var(--primary) / 0.5), 0 0 60px hsl(var(--primary) / 0.3)' },
  };
  return shadowStyles[shadow] || {};
};

export const isGradientFrame = (frameStyle: FrameStyle): boolean => {
  return ['gradient', 'gradient-sunset', 'gradient-ocean', 'gradient-purple', 'rainbow', 'rainbow-spin'].includes(frameStyle);
};

// Avatar icon options using Lucide icons
export const AVATAR_ICON_OPTIONS = [
  { value: '', label: 'No Icon' },
  { value: 'crown', label: 'Crown' },
  { value: 'star', label: 'Star' },
  { value: 'heart', label: 'Heart' },
  { value: 'sparkles', label: 'Sparkles' },
  { value: 'zap', label: 'Zap' },
  { value: 'flame', label: 'Flame' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'gem', label: 'Gem' },
  { value: 'trophy', label: 'Trophy' },
  { value: 'medal', label: 'Medal' },
  { value: 'award', label: 'Award' },
  { value: 'badge-check', label: 'Verified' },
  { value: 'shield-check', label: 'Shield' },
  { value: 'rocket', label: 'Rocket' },
  { value: 'music', label: 'Music' },
  { value: 'camera', label: 'Camera' },
  { value: 'palette', label: 'Palette' },
  { value: 'pen-tool', label: 'Designer' },
  { value: 'code', label: 'Code' },
  { value: 'gamepad-2', label: 'Gaming' },
  { value: 'dumbbell', label: 'Fitness' },
  { value: 'utensils', label: 'Food' },
  { value: 'plane', label: 'Travel' },
  { value: 'briefcase', label: 'Business' },
  { value: 'graduation-cap', label: 'Education' },
  { value: 'stethoscope', label: 'Medical' },
  { value: 'mic', label: 'Podcast' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitch', label: 'Twitch' },
] as const;

export const FRAME_CSS = `
  @keyframes glow-pulse {
    0%, 100% {
      box-shadow: 0 0 5px hsl(var(--primary) / 0.5), 0 0 10px hsl(var(--primary) / 0.3);
    }
    50% {
      box-shadow: 0 0 20px hsl(var(--primary) / 0.8), 0 0 40px hsl(var(--primary) / 0.5), 0 0 60px hsl(var(--primary) / 0.3);
    }
  }
`;
