import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Block } from '@/types/page';
import { 
  Link2, 
  Image, 
  Type, 
  Video, 
  ShoppingBag, 
  MessageCircle,
  User,
  Layers,
  FormInput,
  Star,
  MapPin,
  HelpCircle,
  Clock,
  DollarSign,
  File,
  Mail,
  ListOrdered,
  Gift,
  Megaphone,
  CalendarDays,
} from 'lucide-react';

interface TemplatePreviewCardProps {
  blocks: Block[] | unknown;
  className?: string;
  showBlockCount?: boolean;
}

// Map block types to icons and colors
const BLOCK_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  profile: { icon: User, color: 'bg-blue-500' },
  link: { icon: Link2, color: 'bg-sky-500' },
  button: { icon: () => <span className="text-[10px] font-bold">▶</span>, color: 'bg-red-500' },
  text: { icon: Type, color: 'bg-slate-500' },
  image: { icon: Image, color: 'bg-emerald-500' },
  video: { icon: Video, color: 'bg-rose-500' },
  product: { icon: ShoppingBag, color: 'bg-amber-500' },
  messenger: { icon: MessageCircle, color: 'bg-green-500' },
  socials: { icon: () => <span className="text-[10px]">@</span>, color: 'bg-pink-500' },
  carousel: { icon: Layers, color: 'bg-violet-500' },
  form: { icon: FormInput, color: 'bg-purple-500' },
  testimonial: { icon: Star, color: 'bg-yellow-500' },
  map: { icon: MapPin, color: 'bg-green-600' },
  faq: { icon: HelpCircle, color: 'bg-blue-400' },
  countdown: { icon: Clock, color: 'bg-orange-400' },
  pricing: { icon: DollarSign, color: 'bg-lime-500' },
  download: { icon: File, color: 'bg-indigo-500' },
  newsletter: { icon: Mail, color: 'bg-sky-500' },
  catalog: { icon: ListOrdered, color: 'bg-teal-500' },
  scratch: { icon: Gift, color: 'bg-red-400' },
  shoutout: { icon: Megaphone, color: 'bg-orange-500' },
  event: { icon: CalendarDays, color: 'bg-emerald-600' },
  avatar: { icon: User, color: 'bg-cyan-500' },
  separator: { icon: () => <span className="text-[10px]">—</span>, color: 'bg-gray-400' },
};

/**
 * Visual preview card showing template blocks in a mini-layout format
 */
export const TemplatePreviewCard = memo(function TemplatePreviewCard({
  blocks,
  className,
  showBlockCount = true,
}: TemplatePreviewCardProps) {
  const blocksArray = useMemo(() => {
    if (!blocks) return [];
    return Array.isArray(blocks) ? blocks : [];
  }, [blocks]);

  const profileBlock = blocksArray.find((b: any) => b?.type === 'profile');
  const contentBlocks = blocksArray.filter((b: any) => b?.type !== 'profile').slice(0, 8);
  
  // Group blocks into rows (max 2 per row for half-width, 1 for full-width)
  const rows = useMemo(() => {
    const result: Array<Array<any>> = [];
    let currentRow: any[] = [];
    let currentCols = 0;
    
    for (const block of contentBlocks) {
      const isFullWidth = !block.blockSize?.includes('half');
      const cols = isFullWidth ? 2 : 1;
      
      if (currentCols + cols > 2) {
        if (currentRow.length > 0) result.push(currentRow);
        currentRow = [block];
        currentCols = cols;
      } else {
        currentRow.push(block);
        currentCols += cols;
      }
      
      if (currentCols === 2) {
        result.push(currentRow);
        currentRow = [];
        currentCols = 0;
      }
    }
    
    if (currentRow.length > 0) result.push(currentRow);
    return result.slice(0, 4); // Max 4 rows in preview
  }, [contentBlocks]);

  const getBlockVisual = (block: any) => {
    const config = BLOCK_ICONS[block?.type] || BLOCK_ICONS.link;
    const IconComponent = config.icon;
    
    return (
      <div 
        className={cn(
          'rounded-sm flex items-center justify-center text-white',
          config.color
        )}
        style={{ width: '100%', height: '100%', minHeight: '12px' }}
      >
        <IconComponent className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
      </div>
    );
  };

  return (
    <div className={cn(
      'relative w-full h-full rounded-lg overflow-hidden',
      'bg-gradient-to-br from-muted/50 to-muted',
      className
    )}>
      {/* Mini phone frame */}
      <div className="absolute inset-2 sm:inset-3 bg-background rounded-lg shadow-inner overflow-hidden flex flex-col">
        {/* Profile area */}
        {profileBlock && (
          <div className="flex flex-col items-center pt-2 pb-1 sm:pt-3 sm:pb-2 border-b border-border/30">
            {/* Mini avatar */}
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-primary/40 to-primary/20 flex items-center justify-center">
              <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
            </div>
            {/* Name placeholder */}
            <div className="w-12 sm:w-16 h-1.5 sm:h-2 bg-foreground/20 rounded-full mt-1" />
            {/* Bio placeholder */}
            <div className="w-16 sm:w-20 h-1 sm:h-1.5 bg-foreground/10 rounded-full mt-0.5" />
          </div>
        )}
        
        {/* Blocks grid */}
        <div className="flex-1 p-1.5 sm:p-2 space-y-1 sm:space-y-1.5 overflow-hidden">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="flex gap-1 sm:gap-1.5">
              {row.map((block: any, blockIndex: number) => {
                const isFullWidth = !block.blockSize?.includes('half');
                return (
                  <div 
                    key={blockIndex}
                    className={cn(
                      'h-3 sm:h-4 rounded-sm overflow-hidden',
                      isFullWidth ? 'w-full' : 'w-1/2'
                    )}
                  >
                    {getBlockVisual(block)}
                  </div>
                );
              })}
            </div>
          ))}
          
          {/* More blocks indicator */}
          {blocksArray.length > 9 && (
            <div className="text-center py-0.5">
              <span className="text-[8px] sm:text-[9px] text-muted-foreground">
                +{blocksArray.length - 9}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Block count badge */}
      {showBlockCount && blocksArray.length > 0 && (
        <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2">
          <div className="bg-background/90 backdrop-blur-sm rounded-full px-1.5 py-0.5 text-[8px] sm:text-[9px] font-medium text-muted-foreground border border-border/50">
            {blocksArray.length} блоков
          </div>
        </div>
      )}
    </div>
  );
});
