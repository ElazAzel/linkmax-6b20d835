import { useState, useRef, useCallback, TouchEvent } from 'react';

interface SwipeState {
  offsetX: number;
  isSwiping: boolean;
  direction: 'left' | 'right' | null;
}

interface UseSwipeGestureOptions {
  threshold?: number;
  maxSwipe?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export function useSwipeGesture({
  threshold = 80,
  maxSwipe = 120,
  onSwipeLeft,
  onSwipeRight,
}: UseSwipeGestureOptions) {
  const [state, setState] = useState<SwipeState>({
    offsetX: 0,
    isSwiping: false,
    direction: null,
  });

  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
    setState(prev => ({ ...prev, isSwiping: true }));
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!state.isSwiping) return;
    
    currentXRef.current = e.touches[0].clientX;
    const diff = currentXRef.current - startXRef.current;
    
    // Limit the swipe distance
    const clampedDiff = Math.max(-maxSwipe, Math.min(maxSwipe, diff));
    
    setState(prev => ({
      ...prev,
      offsetX: clampedDiff,
      direction: diff < 0 ? 'left' : diff > 0 ? 'right' : null,
    }));
  }, [state.isSwiping, maxSwipe]);

  const handleTouchEnd = useCallback(() => {
    const diff = currentXRef.current - startXRef.current;
    
    if (diff < -threshold && onSwipeLeft) {
      onSwipeLeft();
    } else if (diff > threshold && onSwipeRight) {
      onSwipeRight();
    }
    
    // Reset state
    setState({
      offsetX: 0,
      isSwiping: false,
      direction: null,
    });
  }, [threshold, onSwipeLeft, onSwipeRight]);

  const reset = useCallback(() => {
    setState({
      offsetX: 0,
      isSwiping: false,
      direction: null,
    });
  }, []);

  return {
    ...state,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    reset,
  };
}
