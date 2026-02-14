import { memo, useState } from 'react';
import { Plus, Search, Lock, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { FREE_LIMITS } from '@/hooks/useFreemiumLimits';
import { openPremiumPurchase } from '@/lib/upgrade-utils';
import { toast } from 'sonner';

interface BlockInsertButtonProps {
  onInsert: (blockType: string) => void;
  isPremium?: boolean;
  currentBlockCount?: number;
  className?: string;
}

const ALL_BLOCKS = [
  // Links & Navigation
  { type: 'link', label: 'Link', icon: '🔗', category: 'Links', premium: false },
  { type: 'button', label: 'Button', icon: '🔘', category: 'Links', premium: false },
  { type: 'socials', label: 'Social Links', icon: '👥', category: 'Links', premium: false },
  
  // Content
  { type: 'text', label: 'Text', icon: '📝', category: 'Content', premium: false },
  { type: 'image', label: 'Image', icon: '🖼️', category: 'Content', premium: false },
  { type: 'video', label: 'Video', icon: '🎬', category: 'Content', premium: true },
  { type: 'carousel', label: 'Carousel', icon: '📸', category: 'Content', premium: true },
  { type: 'avatar', label: 'Avatar', icon: '👤', category: 'Content', premium: false },
  { type: 'separator', label: 'Separator', icon: '➖', category: 'Content', premium: false },
  { type: 'map', label: 'Map', icon: '🗺️', category: 'Content', premium: false },
  
  // Shop & Products
  { type: 'product', label: 'Product', icon: '🛍️', category: 'Shop', premium: false },
  { type: 'download', label: 'Download', icon: '📥', category: 'Shop', premium: true },
  
  // Forms & Communication
  { type: 'form', label: 'Form', icon: '📋', category: 'Forms', premium: true },
  { type: 'newsletter', label: 'Newsletter', icon: '✉️', category: 'Forms', premium: true },
  { type: 'messenger', label: 'Messengers', icon: '💬', category: 'Forms', premium: true },
  
  // Interactive
  { type: 'testimonial', label: 'Testimonials', icon: '⭐', category: 'Interactive', premium: true },
  { type: 'scratch', label: 'Scratch Card', icon: '🎁', category: 'Interactive', premium: true },
  { type: 'search', label: 'AI Search', icon: '🔍', category: 'Interactive', premium: true },
  
  // Advanced
  { type: 'custom_code', label: 'Custom Code', icon: '💻', category: 'Advanced', premium: true },
];

export const BlockInsertButton = memo(function BlockInsertButton({ 
  onInsert, 
  isPremium = false,
  currentBlockCount = 0,
  className 
}: BlockInsertButtonProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isAtBlockLimit = !isPremium && currentBlockCount >= FREE_LIMITS.maxBlocks;
  const remainingBlocks = isPremium ? Infinity : FREE_LIMITS.maxBlocks - currentBlockCount;

  // Filter blocks based on search
  const filteredBlocks = ALL_BLOCKS.filter(block => 
    block.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    block.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group blocks by category
  const blocksByCategory = filteredBlocks.reduce((acc, block) => {
    if (!acc[block.category]) {
      acc[block.category] = [];
    }
    acc[block.category].push(block);
    return acc;
  }, {} as Record<string, typeof ALL_BLOCKS>);

  const handleInsert = (blockType: string, premium: boolean) => {
    if (premium && !isPremium) {
      toast.error('Этот блок доступен только в Premium');
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

  // Mobile Sheet Interface
  const MobileSheet = () => (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="default"
        size="lg"
        onClick={() => setIsOpen(true)}
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95"
        data-onboarding="add-block"
      >
        <Plus className="h-6 w-6" />
      </Button>
      <SheetContent side="bottom" className="h-[85vh] p-0">
        <SheetHeader className="p-4 pb-2 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <SheetTitle>Add Block</SheetTitle>
            {!isPremium && (
              <Badge variant={isAtBlockLimit ? 'destructive' : 'secondary'} className="text-xs">
                {remainingBlocks > 0 ? `${remainingBlocks} осталось` : 'Лимит'}
              </Badge>
            )}
          </div>
          <SheetDescription className="sr-only">Choose a block to add to your page</SheetDescription>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search blocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          {isAtBlockLimit && (
            <button
              onClick={openPremiumPurchase}
              className="mt-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg w-full text-left hover:bg-amber-500/20 transition-colors"
            >
              <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Crown className="h-3.5 w-3.5" />
                Перейдите на Premium для неограниченных блоков
              </p>
            </button>
          )}
        </SheetHeader>
        
        <div className="overflow-y-auto p-4 space-y-6 pb-safe" style={{ height: 'calc(100% - 130px)' }}>
          {Object.entries(blocksByCategory).map(([category, blocks]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
                {category}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {blocks.map((block) => (
                  <button
                    key={block.type}
                    onClick={() => handleInsert(block.type, block.premium)}
                    disabled={block.premium && !isPremium}
                    className={cn(
                      "relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all active:scale-95",
                      block.premium && !isPremium
                        ? "bg-muted/50 border-border cursor-not-allowed opacity-60"
                        : "bg-card border-border hover:border-primary hover:bg-accent cursor-pointer"
                    )}
                  >
                    {block.premium && !isPremium && (
                      <Lock className="absolute top-1.5 right-1.5 h-3 w-3 text-muted-foreground" />
                    )}
                    <span className="text-2xl">{block.icon}</span>
                    <span className="text-xs font-medium text-center leading-tight">
                      {block.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          {filteredBlocks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">No blocks found</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

  // Desktop Dropdown Interface
  const DesktopDropdown = () => (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-full border-2 border-dashed border-primary/50 hover:border-primary hover:bg-primary/10 transition-all"
          data-onboarding="add-block"
        >
          <Plus className="h-4 w-4 text-primary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="center" 
        className="w-64 bg-card z-50 max-h-[75vh] overflow-hidden p-2"
        sideOffset={5}
      >
        <div className="sticky top-0 bg-card z-10 pb-2">
          <DropdownMenuLabel className="text-xs text-muted-foreground px-2">
            Add Block
          </DropdownMenuLabel>
          <div className="relative px-2 pt-2">
            <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </div>
        
        <div className="overflow-y-auto max-h-[60vh] mt-2">
          {Object.entries(blocksByCategory).map(([category, blocks], idx) => (
            <div key={category}>
              {idx > 0 && <DropdownMenuSeparator className="my-2" />}
              <DropdownMenuLabel className="text-xs text-muted-foreground px-2 py-1">
                {category}
              </DropdownMenuLabel>
              {blocks.map((block) => (
                <DropdownMenuItem
                  key={block.type}
                  onClick={() => handleInsert(block.type, block.premium)}
                  disabled={block.premium && !isPremium}
                  className={cn(
                    "cursor-pointer transition-colors rounded-lg mx-1 my-0.5",
                    block.premium && !isPremium && "opacity-60"
                  )}
                >
                  <span className="mr-2 text-base">{block.icon}</span>
                  <span className="flex-1">{block.label}</span>
                  {block.premium && !isPremium && (
                    <Lock className="h-3 w-3 text-muted-foreground ml-2" />
                  )}
                </DropdownMenuItem>
              ))}
            </div>
          ))}
          
          {filteredBlocks.length === 0 && (
            <div className="text-center py-8 px-4">
              <p className="text-xs text-muted-foreground">No blocks found</p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className={cn(
      "flex items-center justify-center transition-opacity duration-200",
      className
    )}>
      {isMobile ? <MobileSheet /> : <DesktopDropdown />}
    </div>
  );
});
