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
      animation: 'frame-spin 3s linear infinite',
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
    // New animated frames
    fire: {
      background: 'linear-gradient(45deg, #ff4500, #ff8c00, #ffd700, #ff4500)',
      backgroundSize: '300% 300%',
      padding: '3px',
      animation: 'fire-animation 2s ease infinite',
    },
    electric: {
      border: '2px solid #00ffff',
      animation: 'electric-pulse 0.5s ease-in-out infinite',
    },
    wave: {
      background: 'linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c, #667eea)',
      backgroundSize: '400% 100%',
      padding: '3px',
      animation: 'wave-animation 3s linear infinite',
    },
    heartbeat: {
      border: '3px solid #ff4757',
      animation: 'heartbeat 1.5s ease-in-out infinite',
    },
    sparkle: {
      border: '2px solid #ffd700',
      animation: 'sparkle 2s ease-in-out infinite',
    },
    glitch: {
      border: '2px solid #00ff00',
      animation: 'glitch 0.3s ease-in-out infinite',
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
  return ['gradient', 'gradient-sunset', 'gradient-ocean', 'gradient-purple', 'rainbow', 'rainbow-spin', 'fire', 'wave'].includes(frameStyle);
};

export const isAnimatedFrame = (frameStyle: FrameStyle): boolean => {
  return ['rainbow-spin', 'glow-pulse', 'fire', 'electric', 'wave', 'heartbeat', 'sparkle', 'glitch'].includes(frameStyle);
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
  { value: 'check-circle', label: 'Verified Circle' },
] as const;

// Verification icon color options
export const VERIFICATION_COLOR_OPTIONS = [
  { value: 'blue', label: 'Blue', color: '#3b82f6' },
  { value: 'green', label: 'Green', color: '#22c55e' },
  { value: 'gold', label: 'Gold', color: '#eab308' },
  { value: 'purple', label: 'Purple', color: '#a855f7' },
  { value: 'pink', label: 'Pink', color: '#ec4899' },
  { value: 'red', label: 'Red', color: '#ef4444' },
  { value: 'white', label: 'White', color: '#ffffff' },
] as const;

// Verification icon position options
export const VERIFICATION_POSITION_OPTIONS = [
  { value: 'top-right', label: 'Top Right' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'bottom-left', label: 'Bottom Left' },
] as const;

// Verification icon type options
export const VERIFICATION_ICON_OPTIONS = [
  { value: 'check-circle', label: 'Check Circle', icon: 'CheckCircle2' },
  { value: 'badge-check', label: 'Badge Check', icon: 'BadgeCheck' },
  { value: 'shield-check', label: 'Shield Check', icon: 'ShieldCheck' },
  { value: 'verified', label: 'Verified', icon: 'Verified' },
  { value: 'star', label: 'Star', icon: 'Star' },
  { value: 'crown', label: 'Crown', icon: 'Crown' },
  { value: 'award', label: 'Award', icon: 'Award' },
  { value: 'medal', label: 'Medal', icon: 'Medal' },
  { value: 'trophy', label: 'Trophy', icon: 'Trophy' },
  { value: 'gem', label: 'Gem', icon: 'Gem' },
  { value: 'diamond', label: 'Diamond', icon: 'Diamond' },
  { value: 'sparkles', label: 'Sparkles', icon: 'Sparkles' },
  { value: 'heart', label: 'Heart', icon: 'Heart' },
  { value: 'flame', label: 'Flame', icon: 'Flame' },
  { value: 'zap', label: 'Zap', icon: 'Zap' },
] as const;

// Get position classes for verification badge
export const getVerificationPositionClasses = (position: string = 'bottom-right'): string => {
  const positions: Record<string, string> = {
    'top-right': 'top-0 right-0 translate-x-1/4 -translate-y-1/4',
    'top-left': 'top-0 left-0 -translate-x-1/4 -translate-y-1/4',
    'bottom-right': 'bottom-0 right-0 translate-x-1/4 translate-y-1/4',
    'bottom-left': 'bottom-0 left-0 -translate-x-1/4 translate-y-1/4',
  };
  return positions[position] || positions['bottom-right'];
};

// Get verification icon color
export const getVerificationColor = (color: string = 'blue'): string => {
  const colors: Record<string, string> = {
    blue: '#3b82f6',
    green: '#22c55e',
    gold: '#eab308',
    purple: '#a855f7',
    pink: '#ec4899',
    red: '#ef4444',
    white: '#ffffff',
  };
  return colors[color] || colors.blue;
};

export const FRAME_CSS = `
  @keyframes glow-pulse {
    0%, 100% {
      box-shadow: 0 0 5px hsl(var(--primary) / 0.5), 0 0 10px hsl(var(--primary) / 0.3);
    }
    50% {
      box-shadow: 0 0 20px hsl(var(--primary) / 0.8), 0 0 40px hsl(var(--primary) / 0.5), 0 0 60px hsl(var(--primary) / 0.3);
    }
  }
  
  @keyframes frame-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes fire-animation {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  @keyframes electric-pulse {
    0%, 100% {
      box-shadow: 0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff;
      border-color: #00ffff;
    }
    25% {
      box-shadow: 0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff, 0 0 40px #00ffff;
      border-color: #ffffff;
    }
    50% {
      box-shadow: 0 0 5px #00ffff, 0 0 10px #00ffff;
      border-color: #00ffff;
    }
    75% {
      box-shadow: 0 0 15px #00ffff, 0 0 25px #00ffff, 0 0 35px #00ffff;
      border-color: #88ffff;
    }
  }
  
  @keyframes wave-animation {
    0% { background-position: 0% 50%; }
    100% { background-position: 400% 50%; }
  }
  
  @keyframes heartbeat {
    0%, 100% { transform: scale(1); }
    14% { transform: scale(1.1); }
    28% { transform: scale(1); }
    42% { transform: scale(1.1); }
    70% { transform: scale(1); }
  }
  
  @keyframes sparkle {
    0%, 100% {
      box-shadow: 0 0 5px #ffd700, 0 0 10px #ffd700;
      border-color: #ffd700;
    }
    25% {
      box-shadow: 0 0 10px #fff700, 0 0 20px #fff700, 0 0 30px #ffd700;
      border-color: #ffffff;
    }
    50% {
      box-shadow: 0 0 15px #ffd700, 0 0 25px #ffd700, 0 0 35px #ff8c00;
      border-color: #ffd700;
    }
    75% {
      box-shadow: 0 0 5px #ff8c00, 0 0 15px #ff8c00;
      border-color: #ffaa00;
    }
  }
  
  @keyframes glitch {
    0%, 100% {
      transform: translate(0);
      border-color: #00ff00;
      box-shadow: 0 0 5px #00ff00;
    }
    20% {
      transform: translate(-2px, 2px);
      border-color: #ff0000;
      box-shadow: 2px 0 5px #ff0000, -2px 0 5px #00ff00;
    }
    40% {
      transform: translate(2px, -2px);
      border-color: #0000ff;
      box-shadow: -2px 0 5px #0000ff, 2px 0 5px #ff0000;
    }
    60% {
      transform: translate(-1px, 1px);
      border-color: #00ff00;
      box-shadow: 0 0 10px #00ff00;
    }
    80% {
      transform: translate(1px, -1px);
      border-color: #ff00ff;
      box-shadow: 1px 1px 5px #ff00ff, -1px -1px 5px #00ffff;
    }
  }
`;
