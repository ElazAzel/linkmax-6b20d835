import { memo, useState, useRef, useCallback, TouchEvent } from 'react';
import { Pencil, Trash2, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlockRenderer } from '@/components/BlockRenderer';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { Block } from '@/types/page';

interface InlineEditableBlockProps {
  block: Block;
  onEdit: (block: Block) => void;
  onDelete: (id: string) => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
  isFirst?: boolean;
  isLast?: boolean;
  isOwnerPremium?: boolean;
}

export const InlineEditableBlock = memo(function InlineEditableBlock({
  block,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  isDragging,
  dragHandleProps,
  isFirst = false,
  isLast = false,
  isOwnerPremium = false,
}: InlineEditableBlockProps) {
  const isMobile = useIsMobile();
  const haptic = useHapticFeedback();
  const [isHovered, setIsHovered] = useState(false);
  const [isTouched, setIsTouched] = useState(false);
  const isProfileBlock = block.type === 'profile';

  // Swipe state
  const [offsetX, setOffsetX] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isSwipingRef = useRef(false);
  const isVerticalScrollRef = useRef(false);

  const threshold = 60;
  const maxSwipe = 100;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isProfileBlock) {
      setIsTouched(true);
      return;
    }
    
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isSwipingRef.current = false;
    isVerticalScrollRef.current = false;
    setIsTransitioning(false);
    setHasTriggeredHaptic(false);
  }, [isProfileBlock]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isProfileBlock) return;
    
    const diffX = e.touches[0].clientX - startXRef.current;
    const diffY = e.touches[0].clientY - startYRef.current;
    
    // Determine if this is a vertical scroll or horizontal swipe
    if (!isSwipingRef.current && !isVerticalScrollRef.current) {
      if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 10) {
        isVerticalScrollRef.current = true;
        return;
      }
      if (Math.abs(diffX) > 15) {
        isSwipingRef.current = true;
        haptic.lightTap(); // Initial swipe feedback
      }
    }
    
    if (isVerticalScrollRef.current) return;
    
    if (isSwipingRef.current && isMobile) {
      // Clamp the offset
      const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diffX));
      setOffsetX(clampedDiff);
      
      // Haptic feedback when crossing threshold
      if (!hasTriggeredHaptic && Math.abs(clampedDiff) >= threshold) {
        haptic.mediumTap();
        setHasTriggeredHaptic(true);
      } else if (hasTriggeredHaptic && Math.abs(clampedDiff) < threshold) {
        setHasTriggeredHaptic(false);
      }
    }
  }, [isProfileBlock, isMobile, hasTriggeredHaptic, haptic, threshold]);

  const handleTouchEnd = useCallback(() => {
    if (isProfileBlock) {
      setTimeout(() => setIsTouched(false), 3000);
      return;
    }
    
    if (!isSwipingRef.current || !isMobile) {
      setOffsetX(0);
      return;
    }
    
    setIsTransitioning(true);
    
    if (offsetX < -threshold) {
      // Swipe left - Delete action
      haptic.warning(); // Warning haptic for delete
      setOffsetX(-maxSwipe);
      setTimeout(() => {
        onDelete(block.id);
        setOffsetX(0);
        setIsTransitioning(false);
      }, 200);
    } else if (offsetX > threshold) {
      // Swipe right - Edit action
      haptic.success(); // Success haptic for edit
      setOffsetX(maxSwipe);
      setTimeout(() => {
        onEdit(block);
        setOffsetX(0);
        setIsTransitioning(false);
      }, 200);
    } else {
      // Reset
      setOffsetX(0);
      setTimeout(() => setIsTransitioning(false), 200);
    }
    
    isSwipingRef.current = false;
  }, [isProfileBlock, isMobile, offsetX, threshold, maxSwipe, block, onDelete, onEdit, haptic]);

  const showControls = isHovered || isTouched;
  
  // Calculate action visibility based on swipe direction
  const showDeleteAction = offsetX < -20 && isMobile && !isProfileBlock;
  const showEditAction = offsetX > 20 && isMobile && !isProfileBlock;
  const actionOpacity = Math.min(1, Math.abs(offsetX) / threshold);
  const isAtThreshold = Math.abs(offsetX) >= threshold;

  return (
    <div className="relative overflow-visible rounded-2xl">
      {/* Delete action background (swipe left) */}
      {isMobile && !isProfileBlock && (
        <div 
          className={cn(
            "absolute inset-y-0 right-0 flex items-center justify-end px-6 transition-all rounded-2xl backdrop-blur-xl",
            showDeleteAction ? "opacity-100" : "opacity-0 pointer-events-none",
            isAtThreshold && offsetX < 0 ? "bg-destructive/90" : "bg-destructive/60"
          )}
          style={{ opacity: showDeleteAction ? actionOpacity : 0, width: maxSwipe + 20 }}
        >
          <div className={cn(
            "flex flex-col items-center gap-1 text-destructive-foreground transition-transform",
            isAtThreshold && offsetX < 0 && "scale-110"
          )}>
            <Trash2 className="h-5 w-5" />
            <span className="text-[10px] font-medium">Delete</span>
          </div>
        </div>
      )}
      
      {/* Edit action background (swipe right) */}
      {isMobile && !isProfileBlock && (
        <div 
          className={cn(
            "absolute inset-y-0 left-0 flex items-center justify-start px-6 transition-all rounded-2xl backdrop-blur-xl",
            showEditAction ? "opacity-100" : "opacity-0 pointer-events-none",
            isAtThreshold && offsetX > 0 ? "bg-primary/90" : "bg-primary/60"
          )}
          style={{ opacity: showEditAction ? actionOpacity : 0, width: maxSwipe + 20 }}
        >
          <div className={cn(
            "flex flex-col items-center gap-1 text-primary-foreground transition-transform",
            isAtThreshold && offsetX > 0 && "scale-110"
          )}>
            <Pencil className="h-5 w-5" />
            <span className="text-[10px] font-medium">Edit</span>
          </div>
        </div>
      )}
      
      {/* Main content wrapper */}
      <div
        className={cn(
          "relative group transition-all duration-300 bg-card/60 backdrop-blur-xl rounded-2xl border border-border/30 shadow-glass",
          isDragging && "opacity-50 scale-95 shadow-glass-lg",
          isTransitioning && "transition-transform duration-200 ease-out"
        )}
        style={{ 
          transform: isMobile && !isProfileBlock ? `translateX(${offsetX}px)` : undefined,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        data-onboarding={isProfileBlock ? 'profile-block' : 'block-edit'}
      >
        {/* Hover/Touch overlay with controls */}
        {showControls && !isDragging && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-primary/40 rounded-2xl pointer-events-none z-10 backdrop-blur-sm" />
        )}

        {/* Control buttons - Optimized for both mobile and desktop */}
        {showControls && !isDragging && (
          <div className="absolute -top-2 right-1 flex gap-1.5 z-20">
            {/* Arrow controls for reordering - only for non-profile blocks */}
            {!isProfileBlock && onMoveUp && onMoveDown && (
              <div className="flex gap-0.5 bg-card/80 backdrop-blur-xl rounded-xl shadow-glass border border-border/30 p-0.5">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-primary/20"
                  onClick={() => {
                    haptic.lightTap();
                    onMoveUp(block.id);
                  }}
                  disabled={isFirst}
                  title="Move up"
                >
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 hover:bg-primary/20"
                  onClick={() => {
                    haptic.lightTap();
                    onMoveDown(block.id);
                  }}
                  disabled={isLast}
                  title="Move down"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {/* Drag handle - desktop only */}
            {!isProfileBlock && (
              <Button
                variant="glass"
                size="sm"
                className="h-7 w-7 p-0 shadow-glass hidden md:inline-flex"
                {...dragHandleProps}
              >
                <GripVertical className="h-4 w-4" />
              </Button>
            )}
            
            {/* Edit button */}
            <Button
              variant="glass"
              size="sm"
              className="h-7 w-7 p-0 shadow-glass hover:bg-primary/20"
              onClick={() => {
                haptic.lightTap();
                onEdit(block);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            
            {/* Delete button - only for non-profile blocks */}
            {!isProfileBlock && (
              <Button
                variant="destructive"
                size="sm"
                className="h-7 w-7 p-0 shadow-glass backdrop-blur-xl"
                onClick={() => {
                  haptic.warning();
                  onDelete(block.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}

        {/* The actual block */}
        <BlockRenderer block={block} isPreview={false} isOwnerPremium={isOwnerPremium} />
        
        {/* Swipe hint for mobile (shown on first touch) */}
        {isMobile && !isProfileBlock && isTouched && offsetX === 0 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-card/80 backdrop-blur-xl rounded-full text-[10px] text-muted-foreground shadow-glass border border-border/30 animate-fade-in">
            ← Swipe to edit or delete →
          </div>
        )}
      </div>
    </div>
  );
});
