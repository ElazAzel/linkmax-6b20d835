import { memo, useState, useRef, useCallback, TouchEvent } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SwipeableBlockProps {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export const SwipeableBlock = memo(function SwipeableBlock({
  children,
  onEdit,
  onDelete,
  disabled = false,
}: SwipeableBlockProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isSwipingRef = useRef(false);
  const isVerticalScrollRef = useRef(false);

  const threshold = 60;
  const maxSwipe = 100;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled) return;
    startXRef.current = e.touches[0].clientX;
    startYRef.current = e.touches[0].clientY;
    isSwipingRef.current = false;
    isVerticalScrollRef.current = false;
    setIsTransitioning(false);
  }, [disabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled) return;
    
    const diffX = e.touches[0].clientX - startXRef.current;
    const diffY = e.touches[0].clientY - startYRef.current;
    
    // Determine if this is a vertical scroll or horizontal swipe
    if (!isSwipingRef.current && !isVerticalScrollRef.current) {
      if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 10) {
        isVerticalScrollRef.current = true;
        return;
      }
      if (Math.abs(diffX) > 10) {
        isSwipingRef.current = true;
      }
    }
    
    if (isVerticalScrollRef.current) return;
    
    if (isSwipingRef.current) {
      // Prevent vertical scroll during horizontal swipe
      e.preventDefault();
      
      // Clamp the offset
      const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diffX));
      setOffsetX(clampedDiff);
    }
  }, [disabled]);

  const handleTouchEnd = useCallback(() => {
    if (disabled || !isSwipingRef.current) {
      setOffsetX(0);
      return;
    }
    
    setIsTransitioning(true);
    
    if (offsetX < -threshold) {
      // Swipe left - Delete action
      setOffsetX(-maxSwipe);
      setTimeout(() => {
        onDelete();
        setOffsetX(0);
        setIsTransitioning(false);
      }, 200);
    } else if (offsetX > threshold) {
      // Swipe right - Edit action
      setOffsetX(maxSwipe);
      setTimeout(() => {
        onEdit();
        setOffsetX(0);
        setIsTransitioning(false);
      }, 200);
    } else {
      // Reset
      setOffsetX(0);
      setTimeout(() => setIsTransitioning(false), 200);
    }
    
    isSwipingRef.current = false;
  }, [disabled, offsetX, threshold, maxSwipe, onDelete, onEdit]);

  // Calculate action visibility based on swipe direction
  const showDeleteAction = offsetX < -20;
  const showEditAction = offsetX > 20;
  const actionOpacity = Math.min(1, Math.abs(offsetX) / threshold);

  return (
    <div className="relative overflow-visible rounded-xl">
      {/* Delete action (swipe left) */}
      <div 
        className={cn(
          "absolute inset-y-0 right-0 flex items-center justify-end px-6 bg-destructive transition-opacity",
          showDeleteAction ? "opacity-100" : "opacity-0"
        )}
        style={{ opacity: showDeleteAction ? actionOpacity : 0 }}
      >
        <div className="flex flex-col items-center gap-1 text-destructive-foreground">
          <Trash2 className="h-6 w-6" />
          <span className="text-xs font-medium">Delete</span>
        </div>
      </div>
      
      {/* Edit action (swipe right) */}
      <div 
        className={cn(
          "absolute inset-y-0 left-0 flex items-center justify-start px-6 bg-primary transition-opacity",
          showEditAction ? "opacity-100" : "opacity-0"
        )}
        style={{ opacity: showEditAction ? actionOpacity : 0 }}
      >
        <div className="flex flex-col items-center gap-1 text-primary-foreground">
          <Pencil className="h-6 w-6" />
          <span className="text-xs font-medium">Edit</span>
        </div>
      </div>
      
      {/* Content */}
      <div
        className={cn(
          "relative bg-background",
          isTransitioning && "transition-transform duration-200 ease-out"
        )}
        style={{ 
          transform: `translateX(${offsetX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
});
