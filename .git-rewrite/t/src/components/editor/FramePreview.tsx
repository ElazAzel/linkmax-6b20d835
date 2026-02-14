import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getFrameStyles, isGradientFrame, isAnimatedFrame, type FrameStyle, FRAME_CSS } from '@/lib/avatar-frame-utils';
import { cn } from '@/lib/utils';

interface FramePreviewProps {
  frameStyle: FrameStyle;
  size?: 'small' | 'medium';
  selected?: boolean;
  onClick?: () => void;
  avatarUrl?: string;
}

const sizeMap = {
  small: { container: 'w-12 h-12', avatar: 'w-10 h-10' },
  medium: { container: 'w-16 h-16', avatar: 'w-14 h-14' },
};

// Demo avatar for frame preview
const DEMO_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo&backgroundColor=b6e3f4';

export function FramePreview({ frameStyle, size = 'small', selected, onClick, avatarUrl }: FramePreviewProps) {
  const frameStyles = getFrameStyles(frameStyle);
  const isGradient = isGradientFrame(frameStyle);
  const isAnimated = isAnimatedFrame(frameStyle);
  const sizes = sizeMap[size];

  return (
    <>
      <style>{FRAME_CSS}</style>
      <div
        onClick={onClick}
        className={cn(
          'rounded-full cursor-pointer transition-all duration-200 hover:scale-105',
          sizes.container,
          'flex items-center justify-center',
          selected && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
          isAnimated && 'animate-pulse-slow'
        )}
        style={frameStyles}
      >
        <Avatar className={cn(sizes.avatar, isGradient && 'p-0')}>
          <AvatarImage 
            src={avatarUrl || DEMO_AVATAR} 
            alt="Frame preview" 
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/40 text-primary text-xs font-medium">
            AB
          </AvatarFallback>
        </Avatar>
      </div>
    </>
  );
}

const FRAME_OPTIONS: { value: FrameStyle; label: string }[] = [
  { value: 'none', label: 'Без рамки' },
  { value: 'default', label: 'По умолчанию' },
  { value: 'solid', label: 'Сплошная' },
  { value: 'gradient', label: 'Градиент' },
  { value: 'gradient-sunset', label: 'Закат' },
  { value: 'gradient-ocean', label: 'Океан' },
  { value: 'gradient-purple', label: 'Фиолетовый' },
  { value: 'neon-blue', label: 'Неон синий' },
  { value: 'neon-pink', label: 'Неон розовый' },
  { value: 'neon-green', label: 'Неон зелёный' },
  { value: 'rainbow', label: 'Радуга' },
  { value: 'rainbow-spin', label: 'Радуга вращение' },
  { value: 'double', label: 'Двойная' },
  { value: 'dashed', label: 'Штрих' },
  { value: 'dotted', label: 'Точки' },
  { value: 'glow-pulse', label: 'Пульсация' },
  { value: 'fire', label: '🔥 Огонь' },
  { value: 'electric', label: '⚡ Электро' },
  { value: 'wave', label: '🌊 Волна' },
  { value: 'heartbeat', label: '💓 Сердце' },
  { value: 'sparkle', label: '✨ Сияние' },
  { value: 'glitch', label: '👾 Глитч' },
];

interface FrameGridSelectorProps {
  value: FrameStyle;
  onChange: (value: FrameStyle) => void;
}

interface FrameGridSelectorProps {
  value: FrameStyle;
  onChange: (value: FrameStyle) => void;
  avatarUrl?: string;
}

export function FrameGridSelector({ value, onChange, avatarUrl }: FrameGridSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-3 p-3">
      {FRAME_OPTIONS.map((option) => (
        <div key={option.value} className="flex flex-col items-center gap-1.5">
          <FramePreview
            frameStyle={option.value}
            selected={value === option.value}
            onClick={() => onChange(option.value)}
            avatarUrl={avatarUrl}
          />
          <span className="text-[10px] text-muted-foreground text-center leading-tight max-w-[48px] truncate">
            {option.label}
          </span>
        </div>
      ))}
    </div>
  );
}
