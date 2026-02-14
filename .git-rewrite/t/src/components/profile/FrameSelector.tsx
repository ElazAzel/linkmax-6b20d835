import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Lock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  FRAME_OPTIONS, 
  type FrameOption,
  getFramesByCategory,
} from '@/lib/profile-frame-system';
import { getFrameStyles, isGradientFrame, FRAME_CSS } from '@/lib/avatar-frame-utils';
import type { ProfileFrameStyle } from '@/types/page';

interface FrameSelectorProps {
  value: ProfileFrameStyle;
  onChange: (value: ProfileFrameStyle) => void;
  isPremium: boolean;
  avatarUrl?: string;
  onUpgradeClick?: () => void;
}

const DEMO_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo&backgroundColor=b6e3f4';

const FramePreviewItem = memo(function FramePreviewItem({
  option,
  selected,
  onClick,
  avatarUrl,
  isPremium,
  locked,
}: {
  option: FrameOption;
  selected: boolean;
  onClick: () => void;
  avatarUrl?: string;
  isPremium: boolean;
  locked: boolean;
}) {
  const { t } = useTranslation();
  const frameStyles = getFrameStyles(option.value);
  const isGradient = isGradientFrame(option.value);

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-2 rounded-xl cursor-pointer transition-all duration-200',
        'hover:bg-muted/50',
        selected && 'bg-primary/10 ring-2 ring-primary',
        locked && !isPremium && 'opacity-60'
      )}
    >
      <div className="relative">
        <style>{FRAME_CSS}</style>
        <div
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-200 hover:scale-105',
            option.isAnimated && 'animate-pulse-slow'
          )}
          style={frameStyles}
        >
          <Avatar className={cn('w-12 h-12', isGradient && 'p-0')}>
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
        
        {/* Pro/Lock indicator */}
        {locked && !isPremium && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-warning rounded-full flex items-center justify-center shadow-sm">
            <Lock className="w-3 h-3 text-warning-foreground" />
          </div>
        )}
        
        {option.isPro && isPremium && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-warning rounded-full flex items-center justify-center shadow-sm">
            <Crown className="w-3 h-3 text-warning-foreground" />
          </div>
        )}
      </div>
      
      <span className="text-[10px] text-muted-foreground text-center leading-tight max-w-[56px] truncate">
        {option.emoji ? `${option.emoji} ` : ''}{t(option.labelKey, option.label)}
      </span>
    </div>
  );
});

export const FrameSelector = memo(function FrameSelector({
  value,
  onChange,
  isPremium,
  avatarUrl,
  onUpgradeClick,
}: FrameSelectorProps) {
  const { t } = useTranslation();

  const handleSelect = (option: FrameOption) => {
    if (option.isPro && !isPremium) {
      onUpgradeClick?.();
      return;
    }
    onChange(option.value);
  };

  const basicFrames = getFramesByCategory('basic');
  const gradientFrames = getFramesByCategory('gradient');
  const neonFrames = getFramesByCategory('neon');
  const animatedFrames = [...getFramesByCategory('animated'), ...getFramesByCategory('special')];

  const renderFrameGrid = (frames: FrameOption[]) => (
    <div className="grid grid-cols-4 gap-2 p-2">
      {frames.map((option) => (
        <FramePreviewItem
          key={option.value}
          option={option}
          selected={value === option.value}
          onClick={() => handleSelect(option)}
          avatarUrl={avatarUrl}
          isPremium={isPremium}
          locked={option.isPro}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      {!isPremium && (
        <div 
          onClick={onUpgradeClick}
          className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-xl cursor-pointer hover:bg-warning/20 transition-colors"
        >
          <Crown className="w-4 h-4 text-warning flex-shrink-0" />
          <span className="text-xs text-warning">
            {t('frames.unlockProFrames', 'Разблокируйте все рамки с PRO подпиской')}
          </span>
        </div>
      )}
      
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-auto p-1">
          <TabsTrigger value="basic" className="text-xs py-2 px-1">
            {t('frames.categories.basic', 'Базовые')}
          </TabsTrigger>
          <TabsTrigger value="gradient" className="text-xs py-2 px-1">
            {t('frames.categories.gradient', 'Градиент')}
          </TabsTrigger>
          <TabsTrigger value="neon" className="text-xs py-2 px-1">
            {t('frames.categories.neon', 'Неон')}
          </TabsTrigger>
          <TabsTrigger value="animated" className="text-xs py-2 px-1 relative">
            {t('frames.categories.animated', 'Анимация')}
            {!isPremium && <Lock className="w-3 h-3 ml-1 inline-block" />}
          </TabsTrigger>
        </TabsList>
        
        <ScrollArea className="h-[200px] mt-2">
          <TabsContent value="basic" className="mt-0">
            {renderFrameGrid(basicFrames)}
          </TabsContent>
          
          <TabsContent value="gradient" className="mt-0">
            {renderFrameGrid(gradientFrames)}
            {!isPremium && (
              <Badge variant="outline" className="mx-2 mb-2 text-warning">
                <Crown className="w-3 h-3 mr-1" />
                PRO
              </Badge>
            )}
          </TabsContent>
          
          <TabsContent value="neon" className="mt-0">
            {renderFrameGrid(neonFrames)}
            {!isPremium && (
              <Badge variant="outline" className="mx-2 mb-2 text-warning">
                <Crown className="w-3 h-3 mr-1" />
                PRO
              </Badge>
            )}
          </TabsContent>
          
          <TabsContent value="animated" className="mt-0">
            {renderFrameGrid(animatedFrames)}
            {!isPremium && (
              <Badge variant="outline" className="mx-2 mb-2 text-warning">
                <Crown className="w-3 h-3 mr-1" />
                PRO
              </Badge>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
});
