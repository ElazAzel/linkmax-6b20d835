import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Lock, Crown, Type, Video, Link2, File, Music, ListOrdered, Image, ShoppingBag, Code, MessageCircle, Calendar, Star, Gift, Compass, MapPin, Clock, DollarSign, Megaphone, FormInput, Mail, HelpCircle, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { FREE_LIMITS, type FreeTier } from '@/hooks/useFreemiumLimits';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface BlockInsertButtonProps {
  onInsert: (blockType: string) => void;
  isPremium?: boolean;
  currentBlockCount?: number;
  className?: string;
  currentTier?: FreeTier;
}

type BlockTier = 'free' | 'pro' | 'business';

interface BlockConfig {
  type: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  tier: BlockTier;
}

// Blocks with colorful icons like competitors
const ALL_BLOCKS: BlockConfig[] = [
  // Basic
  { type: 'text', label: 'Текст', Icon: Type, color: 'bg-slate-500', tier: 'free' },
  { type: 'link', label: 'Ссылка', Icon: Link2, color: 'bg-blue-500', tier: 'free' },
  { type: 'button', label: 'Кнопка', Icon: () => <span className="text-lg font-bold">▶</span>, color: 'bg-red-500', tier: 'free' },
  { type: 'image', label: 'Фото', Icon: Image, color: 'bg-emerald-500', tier: 'free' },
  
  // Media
  { type: 'video', label: 'Видео', Icon: Video, color: 'bg-rose-500', tier: 'pro' },
  { type: 'carousel', label: 'Галерея', Icon: Layers, color: 'bg-violet-500', tier: 'pro' },
  { type: 'avatar', label: 'Аватар', Icon: () => <span className="text-lg">👤</span>, color: 'bg-cyan-500', tier: 'free' },
  { type: 'separator', label: 'Разделитель', Icon: () => <span className="text-lg">—</span>, color: 'bg-gray-400', tier: 'free' },
  
  // Social
  { type: 'socials', label: 'Соцсети', Icon: () => <span className="text-lg">@</span>, color: 'bg-pink-500', tier: 'free' },
  { type: 'messenger', label: 'Мессенджеры', Icon: MessageCircle, color: 'bg-green-500', tier: 'free' },
  { type: 'shoutout', label: 'Упоминание', Icon: Megaphone, color: 'bg-orange-500', tier: 'pro' },
  
  // Business
  { type: 'product', label: 'Товар', Icon: ShoppingBag, color: 'bg-amber-500', tier: 'pro' },
  { type: 'catalog', label: 'Каталог', Icon: ListOrdered, color: 'bg-teal-500', tier: 'pro' },
  { type: 'pricing', label: 'Цены', Icon: DollarSign, color: 'bg-lime-500', tier: 'pro' },
  { type: 'download', label: 'Файл', Icon: File, color: 'bg-indigo-500', tier: 'business' },
  
  // Forms
  { type: 'form', label: 'Форма', Icon: FormInput, color: 'bg-purple-500', tier: 'business' },
  { type: 'newsletter', label: 'Рассылка', Icon: Mail, color: 'bg-sky-500', tier: 'pro' },
  { type: 'booking', label: 'Запись', Icon: Calendar, color: 'bg-fuchsia-500', tier: 'business' },
  
  // Interactive
  { type: 'testimonial', label: 'Отзывы', Icon: Star, color: 'bg-yellow-500', tier: 'pro' },
  { type: 'scratch', label: 'Скретч', Icon: Gift, color: 'bg-red-400', tier: 'pro' },
  { type: 'faq', label: 'FAQ', Icon: HelpCircle, color: 'bg-blue-400', tier: 'pro' },
  { type: 'countdown', label: 'Таймер', Icon: Clock, color: 'bg-orange-400', tier: 'business' },
  
  // Other
  { type: 'map', label: 'Карта', Icon: MapPin, color: 'bg-green-600', tier: 'free' },
  { type: 'before_after', label: 'До/После', Icon: Compass, color: 'bg-cyan-600', tier: 'pro' },
  { type: 'search', label: 'AI Поиск', Icon: Search, color: 'bg-violet-600', tier: 'pro' },
  { type: 'custom_code', label: 'Код', Icon: Code, color: 'bg-slate-600', tier: 'pro' },
];

export const BlockInsertButton = memo(function BlockInsertButton({ 
  onInsert, 
  isPremium = false,
  currentBlockCount = 0,
  className,
  currentTier = 'free'
}: BlockInsertButtonProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAtBlockLimit = !isPremium && currentBlockCount >= FREE_LIMITS.maxBlocks;
  const remainingBlocks = isPremium ? Infinity : FREE_LIMITS.maxBlocks - currentBlockCount;

  const tierLevel = (tier: FreeTier): number => {
    switch (tier) {
      case 'business': return 3;
      case 'pro': return 2;
      default: return 1;
    }
  };

  const canUseBlock = (blockTier: BlockTier): boolean => {
    return tierLevel(currentTier) >= tierLevel(blockTier);
  };

  const filteredBlocks = ALL_BLOCKS.filter(block => 
    block.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInsert = (blockType: string, blockTier: BlockTier) => {
    if (!canUseBlock(blockTier)) {
      const tierName = blockTier === 'business' ? 'BUSINESS' : 'PRO';
      toast.error(`Этот блок доступен только в ${tierName}`, {
        action: {
          label: 'Upgrade',
          onClick: () => navigate('/pricing'),
        },
      });
      return;
    }
    
    if (isAtBlockLimit) {
      toast.error(`Достигнут лимит ${FREE_LIMITS.maxBlocks} блоков. Перейдите на Premium.`);
      return;
    }
    
    onInsert(blockType);
    setIsOpen(false);
    setSearchQuery('');
  };

  // Mobile & Desktop - Clean full-screen sheet like competitors
  return (
    <div className={cn("flex items-center justify-center", className)}>
      {/* FAB Button */}
      <Button
        variant="default"
        size="lg"
        onClick={() => setIsOpen(true)}
        className={cn(
          "shadow-lg transition-all active:scale-95",
          isMobile 
            ? "h-16 w-16 rounded-full" 
            : "h-12 w-12 rounded-2xl"
        )}
        data-onboarding="add-block"
      >
        <Plus className={isMobile ? "h-8 w-8" : "h-6 w-6"} />
      </Button>

      {/* Clean Sheet with Grid */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent 
          side="bottom" 
          className="h-[80vh] p-0 bg-background border-t rounded-t-3xl"
        >
          {/* Header */}
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-bold">{t('editor.addBlock', 'Добавить элемент')}</SheetTitle>
              {!isPremium && (
                <Badge 
                  variant={isAtBlockLimit ? 'destructive' : 'secondary'} 
                  className="text-sm px-3 py-1"
                >
                  {remainingBlocks > 0 ? `${remainingBlocks} ${t('freemium.left', 'осталось')}` : t('freemium.limit', 'Лимит')}
                </Badge>
              )}
            </div>
            <SheetDescription className="sr-only">{t('editor.selectBlock', 'Выберите блок для добавления')}</SheetDescription>
          </SheetHeader>
          
          {/* Search */}
          <div className="px-6 py-4 border-b bg-muted/30">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder={t('editor.searchBlocks', 'Поиск блоков...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base rounded-xl bg-background border-border"
              />
            </div>
          </div>
          
          {/* Grid of blocks - 4 columns like competitor */}
          <div className="overflow-y-auto p-6" style={{ height: 'calc(100% - 140px)' }}>
            <div className="grid grid-cols-4 gap-4">
              {filteredBlocks.map((block) => {
                const isLocked = !canUseBlock(block.tier);
                const IconComponent = block.Icon;
                
                return (
                  <button
                    key={block.type}
                    onClick={() => handleInsert(block.type, block.tier)}
                    disabled={isLocked}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-3 rounded-2xl transition-all",
                      isLocked
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-muted active:scale-95"
                    )}
                  >
                    {/* Colorful icon square */}
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center text-white",
                      block.color
                    )}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    
                    {/* Label */}
                    <span className="text-xs font-medium text-center leading-tight">
                      {block.label}
                    </span>
                    
                    {/* Lock/Crown badge */}
                    {isLocked && (
                      <div className="absolute top-1 right-1">
                        <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                    )}
                    {block.tier === 'pro' && !isLocked && (
                      <div className="absolute top-1 right-1">
                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                      </div>
                    )}
                    {block.tier === 'business' && !isLocked && (
                      <div className="absolute top-1 right-1">
                        <Badge variant="secondary" className="text-[8px] px-1 py-0 bg-amber-500/20 text-amber-600">
                          BIZ
                        </Badge>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            
            {filteredBlocks.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">{t('common.noResults', 'Ничего не найдено')}</p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
});
