import { memo, useState, useRef, useCallback, TouchEvent } from 'react';
import { Pencil, Trash2, GripVertical, ChevronUp, ChevronDown, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BlockRenderer } from '@/components/BlockRenderer';
import { MobileBlockActions } from './MobileBlockActions';
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
  onDuplicate?: (block: Block) => void;
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
  onDuplicate,
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
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const isProfileBlock = block.type === 'profile';

  // Swipe state
  const [offsetX, setOffsetX] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const isSwipingRef = useRef(false);
  const isVerticalScrollRef = useRef(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const threshold = 80;
  const maxSwipe = 120;
  const longPressDelay = 350;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (isProfileBlock) {
      setIsTouched(true);
      return;
    }
    
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    startTimeRef.current = Date.now();
    isSwipingRef.current = false;
    isVerticalScrollRef.current = false;
    setIsTransitioning(false);
    setHasTriggeredHaptic(false);
    
    // Long press detection
    longPressTimerRef.current = setTimeout(() => {
      if (!isSwipingRef.current && !isVerticalScrollRef.current) {
        haptic.heavyTap();
        setShowActionsSheet(true);
      }
    }, longPressDelay);
  }, [isProfileBlock, haptic]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isProfileBlock) return;
    
    // Cancel long press on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
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
        haptic.lightTap();
      }
    }
    
    if (isVerticalScrollRef.current) return;
    
    if (isSwipingRef.current && isMobile) {
      const resistance = Math.abs(diffX) > threshold ? 0.5 : 1;
      const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diffX * resistance));
      setOffsetX(clampedDiff);
      
      if (!hasTriggeredHaptic && Math.abs(clampedDiff) >= threshold) {
        haptic.mediumTap();
        setHasTriggeredHaptic(true);
      } else if (hasTriggeredHaptic && Math.abs(clampedDiff) < threshold - 10) {
        setHasTriggeredHaptic(false);
      }
    }
  }, [isProfileBlock, isMobile, hasTriggeredHaptic, haptic, threshold]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    if (isProfileBlock) {
      setTimeout(() => setIsTouched(false), 3000);
      return;
    }
    
    const touchDuration = Date.now() - startTimeRef.current;
    if (!isSwipingRef.current && !isVerticalScrollRef.current && touchDuration < 200) {
      setIsTouched(true);
      setTimeout(() => setIsTouched(false), 3000);
      return;
    }
    
    if (!isSwipingRef.current || !isMobile) {
      setOffsetX(0);
      return;
    }
    
    setIsTransitioning(true);
    
    if (offsetX < -threshold) {
      haptic.warning();
      setOffsetX(-maxSwipe - 20);
      setTimeout(() => {
        onDelete(block.id);
        setOffsetX(0);
        setIsTransitioning(false);
      }, 250);
    } else if (offsetX > threshold) {
      haptic.success();
      setOffsetX(maxSwipe + 20);
      setTimeout(() => {
        onEdit(block);
        setOffsetX(0);
        setIsTransitioning(false);
      }, 250);
    } else {
      setOffsetX(0);
      setTimeout(() => setIsTransitioning(false), 300);
    }
    
    isSwipingRef.current = false;
  }, [isProfileBlock, isMobile, offsetX, threshold, maxSwipe, block, onDelete, onEdit, haptic]);

  const showControls = isHovered || isTouched;
  
  const showDeleteAction = offsetX < -30 && isMobile && !isProfileBlock;
  const showEditAction = offsetX > 30 && isMobile && !isProfileBlock;
  const actionOpacity = Math.min(1, Math.abs(offsetX) / threshold);
  const isAtThreshold = Math.abs(offsetX) >= threshold;
  const actionScale = isAtThreshold ? 1.2 : 0.85 + (Math.abs(offsetX) / threshold) * 0.35;

  return (
    <>
      <div className="relative overflow-visible rounded-3xl">
        {/* Delete action background (swipe left) */}
        {isMobile && !isProfileBlock && (
          <div 
            className={cn(
              "absolute inset-y-0 right-0 flex items-center justify-end px-6 transition-all duration-200 rounded-3xl",
              showDeleteAction ? "opacity-100" : "opacity-0 pointer-events-none",
              isAtThreshold && offsetX < 0 ? "bg-destructive" : "bg-destructive/75"
            )}
            style={{ 
              opacity: showDeleteAction ? actionOpacity : 0, 
              width: maxSwipe + 40,
            }}
          >
            <div 
              className="flex flex-col items-center gap-2 text-destructive-foreground transition-all duration-200"
              style={{ transform: `scale(${offsetX < 0 ? actionScale : 0.85})` }}
            >
              <div className={cn(
                "h-14 w-14 rounded-2xl bg-white/25 flex items-center justify-center backdrop-blur-sm",
                isAtThreshold && "animate-pulse"
              )}>
                <Trash2 className="h-7 w-7" />
              </div>
              <span className="text-sm font-bold">Удалить</span>
            </div>
          </div>
        )}
        
        {/* Edit action background (swipe right) */}
        {isMobile && !isProfileBlock && (
          <div 
            className={cn(
              "absolute inset-y-0 left-0 flex items-center justify-start px-6 transition-all duration-200 rounded-3xl",
              showEditAction ? "opacity-100" : "opacity-0 pointer-events-none",
              isAtThreshold && offsetX > 0 ? "bg-primary" : "bg-primary/75"
            )}
            style={{ 
              opacity: showEditAction ? actionOpacity : 0, 
              width: maxSwipe + 40,
            }}
          >
            <div 
              className="flex flex-col items-center gap-2 text-primary-foreground transition-all duration-200"
              style={{ transform: `scale(${offsetX > 0 ? actionScale : 0.85})` }}
            >
              <div className={cn(
                "h-14 w-14 rounded-2xl bg-white/25 flex items-center justify-center backdrop-blur-sm",
                isAtThreshold && "animate-pulse"
              )}>
                <Pencil className="h-7 w-7" />
              </div>
              <span className="text-sm font-bold">Изменить</span>
            </div>
          </div>
        )}
        
        {/* Main content wrapper */}
        <div
          className={cn(
            "relative group bg-card/70 backdrop-blur-xl rounded-3xl border border-border/20 shadow-glass",
            isDragging && "opacity-50 scale-95 shadow-glass-lg",
            isTransitioning && "transition-transform duration-300 ease-out"
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
            <div className="absolute inset-0 bg-primary/10 border-2 border-primary/40 rounded-3xl pointer-events-none z-10 backdrop-blur-sm" />
          )}

          {/* Control buttons - Desktop */}
          {showControls && !isDragging && !isMobile && (
            <div className="absolute -top-3 right-2 flex gap-2 z-20">
              {!isProfileBlock && onMoveUp && onMoveDown && (
                <div className="flex gap-1 bg-card/90 backdrop-blur-xl rounded-2xl shadow-glass border border-border/20 p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 hover:bg-primary/20 rounded-xl"
                    onClick={() => {
                      haptic.lightTap();
                      onMoveUp(block.id);
                    }}
                    disabled={isFirst}
                  >
                    <ChevronUp className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 hover:bg-primary/20 rounded-xl"
                    onClick={() => {
                      haptic.lightTap();
                      onMoveDown(block.id);
                    }}
                    disabled={isLast}
                  >
                    <ChevronDown className="h-5 w-5" />
                  </Button>
                </div>
              )}
              
              {!isProfileBlock && (
                <Button
                  variant="glass"
                  size="sm"
                  className="h-9 w-9 p-0 shadow-glass rounded-xl"
                  {...dragHandleProps}
                >
                  <GripVertical className="h-5 w-5" />
                </Button>
              )}
              
              <Button
                variant="glass"
                size="sm"
                className="h-9 w-9 p-0 shadow-glass hover:bg-primary/20 rounded-xl"
                onClick={() => {
                  haptic.lightTap();
                  onEdit(block);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              
              {!isProfileBlock && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-9 w-9 p-0 shadow-glass backdrop-blur-xl rounded-xl"
                  onClick={() => {
                    haptic.warning();
                    onDelete(block.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}

          {/* Mobile: Quick action buttons - MUCH LARGER for easy tapping */}
          {isMobile && showControls && !isDragging && !isProfileBlock && (
            <div className="absolute -top-4 right-3 z-20 flex gap-2">
              <Button
                variant="default"
                size="lg"
                className="h-14 w-14 p-0 rounded-2xl shadow-xl shadow-primary/30"
                onClick={() => {
                  haptic.mediumTap();
                  onEdit(block);
                }}
              >
                <Pencil className="h-6 w-6" />
              </Button>
              <Button
                variant="glass"
                size="lg"
                className="h-14 w-14 p-0 rounded-2xl shadow-glass-lg"
                onClick={() => {
                  haptic.mediumTap();
                  setShowActionsSheet(true);
                }}
              >
                <MoreVertical className="h-6 w-6" />
              </Button>
            </div>
          )}

          {/* The actual block */}
          <BlockRenderer block={block} isPreview={false} isOwnerPremium={isOwnerPremium} />
          
          {/* Mobile swipe hint */}
          {isMobile && !isProfileBlock && isTouched && offsetX === 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-card/95 backdrop-blur-xl rounded-full text-sm text-muted-foreground shadow-glass border border-border/30 flex items-center gap-3 animate-fade-in font-medium">
              <span className="text-primary text-lg">←</span>
              <span>Свайп для действий</span>
              <span className="text-primary text-lg">→</span>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Actions Sheet */}
      <MobileBlockActions
        block={block}
        open={showActionsSheet}
        onOpenChange={setShowActionsSheet}
        onEdit={onEdit}
        onDelete={onDelete}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onDuplicate={onDuplicate}
        isFirst={isFirst}
        isLast={isLast}
      />
    </>
  );
});
