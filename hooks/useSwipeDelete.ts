"use client";

import { useState, useRef, useCallback } from "react";

interface UseSwipeDeleteOptions {
  /** Called when the drag surpasses the threshold and the user lifts their finger */
  onDelete: () => void;
  /** How far left (px) the user needs to drag to trigger delete (default 80) */
  threshold?: number;
  /** Max drag distance in pixels (default 120) */
  maxDrag?: number;
}

interface UseSwipeDeleteResult {
  /** Current horizontal offset in pixels (≤ 0) */
  dragX: number;
  /** Whether the delete was triggered (used to skip snap-back transition) */
  swiped: boolean;
  /** Attach these handlers to the card element */
  handlers: {
    onTouchStart: (e: React.TouchEvent) => void;
    onTouchMove:  (e: React.TouchEvent) => void;
    onTouchEnd:   ()                    => void;
  };
}

/**
 * Touch-gesture hook that enables swipe-left-to-delete on a list item.
 *
 * Usage:
 * ```tsx
 * const { dragX, swiped, handlers } = useSwipeDelete({ onDelete: () => removeItem(id) });
 * <div {...handlers} style={{ transform: `translateX(${dragX}px)` }}>...</div>
 * ```
 */
export function useSwipeDelete({
  onDelete,
  threshold = 80,
  maxDrag   = 120,
}: UseSwipeDeleteOptions): UseSwipeDeleteResult {
  const [dragX,  setDragX]  = useState(0);
  const [swiped, setSwiped] = useState(false);

  const startX    = useRef(0);
  const isDragging = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current  = e.touches[0].clientX;
    isDragging.current = true;
    setSwiped(false);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;
    const delta = e.touches[0].clientX - startX.current;
    // Only track leftward swipes
    if (delta > 0) { setDragX(0); return; }
    setDragX(Math.max(delta, -maxDrag));
  }, [maxDrag]);

  const onTouchEnd = useCallback(() => {
    isDragging.current = false;
    if (dragX < -threshold) {
      setSwiped(true);
      onDelete();
    } else {
      setDragX(0);
    }
  }, [dragX, threshold, onDelete]);

  return { dragX, swiped, handlers: { onTouchStart, onTouchMove, onTouchEnd } };
}
